import { RequestHandler } from "express";
import type { ChatRequestBody, ChatResponseBody } from "@shared/api";
import { parseUserQueryWithIntentToken } from "../services/openai";
import { searchProductsPaginated } from "../services/algolia";
import { logChatEvent } from "../services/telemetry";
import { randomUUID } from "crypto";

export const handleChat = async (req: any, res: any) => {
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
    const {
      message,
      selectedRefinements = [],
      history = [],
      filters,
      cursor,
      page,
      perPage,
      intentToken
    } = body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    const pageSize = perPage || parseInt(process.env.CHAT_PAGE_SIZE || "12");

    const parsed = await parseUserQueryWithIntentToken(
      message,
      selectedRefinements,
      history,
      intentToken,
    );

    let searchResult = await searchProductsPaginated(
      parsed.searchQuery,
      parsed.filters,
      pageSize,
      { chips: selectedRefinements, cursor, page },
      filters,
    );

    let broadened = false;

    // Check if we have any active filters
    const hasActiveFilters = Boolean(
      filters && (
        filters.relationships?.length ||
        filters.occasions?.length ||
        filters.categories?.length ||
        filters.priceBuckets?.length ||
        filters.priceRange
      )
    );

    // Zero-hit fallback: if strict filters produce no results and we have filters, try soft mode
    if (searchResult.products.length === 0 && hasActiveFilters && !cursor && !filters?.soft) {
      const softFilters = { ...filters, soft: true };
      const softResult = await searchProductsPaginated(
        parsed.searchQuery,
        parsed.filters,
        pageSize,
        { chips: selectedRefinements, cursor, page },
        softFilters,
      );

      // Use soft results if they're better than zero
      if (softResult.products.length > 0) {
        searchResult = softResult;
        broadened = true;
      }
    }

    const payload: ChatResponseBody = {
      reply: parsed.replyBlurb,
      products: searchResult.products,
      refineChips: parsed.refineChips,
      pageInfo: {
        total: searchResult.total,
        pageSize,
        page: searchResult.page,
        totalPages: searchResult.totalPages,
        nextCursor: searchResult.nextCursor,
        prevCursor: searchResult.prevCursor,
      },
      facets: searchResult.facets,
      appliedFilters: filters,
      meta: {
        queryLatencyMs: searchResult.latencyMs,
        source: 'algolia' as const,
        intentToken: parsed.intentToken,
        broadened,
      },
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
      productsCount: searchResult.products.length,
      productIds: searchResult.products.map((p) => p.id),
      latencyMs: latency,
      userId,
      ip,
      ua,
      country,
      city,
      page: searchResult.page,
      pageSize,
      totalResults: searchResult.total,
      nextCursorExists: !!searchResult.nextCursor,
      returnedCount: searchResult.products.length,
      zeroHits: searchResult.products.length === 0,
      intentTokenUsed: !!intentToken,
      appliedFilters: filters,
      broadened,
    });

    console.log("/api/gifts/chat", {
      q: parsed.searchQuery,
      filters: parsed.filters,
      count: searchResult.products.length,
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
