import { RequestHandler } from "express";
import type { ChatRequestBody, ChatResponseBody } from "@shared/api";
import { parseUserQueryWithOpenAI } from "../services/openai";
import { searchProducts } from "../services/algolia";
import { logChatEvent } from "../services/telemetry";
import { randomUUID } from "crypto";

export const handleChat: RequestHandler = async (req, res) => {
  try {
    const started = Date.now();
    let bodyAny: any = req.body;
    if (typeof bodyAny === "string") {
      try {
        bodyAny = JSON.parse(bodyAny);
      } catch {}
    }
    if (bodyAny && typeof bodyAny === "object" && Buffer.isBuffer(bodyAny)) {
      try {
        bodyAny = JSON.parse(bodyAny.toString("utf8"));
      } catch {}
    }
    const body: ChatRequestBody =
      bodyAny && typeof bodyAny === "object"
        ? (bodyAny as any)
        : { message: "" };
    const { message, selectedRefinements = [], history = [] } = body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    const parsed = await parseUserQueryWithOpenAI(
      message,
      selectedRefinements,
      history,
    );

    const products = await searchProducts(
      parsed.searchQuery,
      parsed.filters,
      12,
      { chips: selectedRefinements },
    );

    const payload: ChatResponseBody = {
      reply: parsed.replyBlurb,
      products,
      refineChips: parsed.refineChips,
    };

    const latency = Date.now() - started;
    const sessionId = (req.headers["x-session-id"] as string) || randomUUID();
    const ua = (req.headers["user-agent"] as string) || null;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      null;
    const country =
      (req.headers["x-vercel-ip-country"] as string) ||
      (req.headers["cf-ipcountry"] as string) ||
      null;
    const city = (req.headers["x-vercel-ip-city"] as string) || null;
    const userId = (req.headers["x-user-id"] as string) || null;

    logChatEvent({
      sessionId,
      userText: message,
      aiReply: payload.reply,
      algoliaQuery: parsed.searchQuery,
      chips: payload.refineChips,
      filters: parsed.filters,
      productsCount: products.length,
      productIds: products.map((p) => p.id),
      latencyMs: latency,
      userId,
      ip,
      ua,
      country,
      city,
    });

    console.log("/api/gifts/chat", {
      q: parsed.searchQuery,
      filters: parsed.filters,
      count: products.length,
      ms: latency,
    });
    res.status(200).json(payload);
  } catch (err) {
    console.error("/api/gifts/chat error", err);
    return res.status(200).json({
      reply: "Sorry, I couldn't reach the AI service. Please try again.",
      products: [],
      refineChips: [
        "Birthday",
        "Anniversary",
        "Under ₹500",
        "Under ₹1000",
        "Cooking",
        "Gym",
        "Makeup",
        "Tech",
      ],
    });
  }
};
