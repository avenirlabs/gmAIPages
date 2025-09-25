import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChatMessage } from "./ChatMessage";
import { RefinementChips } from "./RefinementChips";
import type { ChatResponseBody, ProductItem } from "@shared/api";
import { Button } from "@/components/ui/button";
import { StarterPrompts } from "./StarterPrompts";

interface Turn {
  role: "user" | "assistant";
  content: string;
  products?: ProductItem[];
  refineChips?: string[];
}

export function ChatInterface({
  starterPrompts,
}: {
  starterPrompts?: string[];
}) {
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you find the perfect gift. Tell me who it's for and the occasion (e.g. 'gifts for sister who loves cooking, budget under $50').",
    },
  ]);
  const [input, setInput] = useState("");
  const [lastRefine, setLastRefine] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutate = useMutation<
    ChatResponseBody,
    Error,
    { message: string; selectedRefinements?: string[]; history?: Turn[] }
  >({
    mutationFn: async (payload) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 20000);
      const tryUrls = [
        "/api/gifts/chat",
        "/.netlify/functions/api/gifts/chat",
        "/gifts/chat",
      ];
      try {
        let lastErr: any = null;
        for (const url of tryUrls) {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            if (res.ok) return await res.json();
            lastErr = new Error(`${url} -> ${res.status}`);
          } catch (e) {
            lastErr = e;
          }
        }
        throw lastErr || new Error("All endpoints failed");
      } finally {
        clearTimeout(t);
      }
    },
    onSuccess: (data) => {
      const assistant: Turn = {
        role: "assistant",
        content: data.reply,
        products: data.products,
        refineChips: data.refineChips,
      };
      setTurns((t) => [...t, assistant]);
      setLastRefine(data.refineChips);
    },
    onError: () => {
      const assistant: Turn = {
        role: "assistant",
        content: "Sorry, I had trouble fetching results. Please try again.",
      };
      setTurns((t) => [...t, assistant]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns.length, mutate.isPending]);

  const canSend = input.trim().length > 0 && !mutate.isPending;

  const handleSend = (text?: string, refinements?: string[]) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const userTurn: Turn = { role: "user", content };
    setTurns((t) => [...t, userTurn]);
    setInput("");
    mutate.mutate({
      message: content,
      selectedRefinements: refinements?.length ? refinements : undefined,
      history: turns,
    });
  };

  const handleChip = (chip: string) => {
    const next = input ? `${input} ${chip}` : chip;
    setInput(next);
    handleSend(next, [chip]);
  };

  const placeholder = useMemo(
    () =>
      "Try: gifts for sister who loves cooking under $50, or: birthday ideas for gym lover",
    [],
  );

  return (
    <div className="flex h-full flex-col rounded-3xl border bg-gradient-to-b from-background/60 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold text-[#155ca5]">Gifts Guru</h2>
        <p className="text-xs text-muted-foreground">
          Next-gen gifting intelligence at your fingertips. Tell it who you’re
          shopping for—let the magic unfold.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
      >
        {turns.map((t, i) => (
          <ChatMessage
            key={i}
            role={t.role}
            content={t.content}
            products={t.products}
          />
        ))}
        {!turns.some((t) => t.role === "user") && (
          <div className="rounded-xl border bg-[#DBEBFF]/70 p-3">
            <p className="mb-2 text-xs font-semibold text-[#222529]">
              Try one of these:
            </p>
            <StarterPrompts
              prompts={
                (starterPrompts && starterPrompts.length
                  ? starterPrompts
                  : [
                      "Gifts for father",
                      "Diwali gifts",
                      "Birthday return gifts",
                      "Gifts for sister",
                      "Anniversary gifts for wife",
                    ]) as string[]
              }
              onSelect={(p) => handleSend(p)}
            />
          </div>
        )}
        {mutate.isPending ? (
          <div className="flex gap-2 px-2 text-sm text-muted-foreground">
            <span className="mt-1 inline-block h-2 w-2 animate-bounce rounded-full bg-primary" />
            Thinking...
          </div>
        ) : null}
      </div>

      <div className="border-t p-4">
        <RefinementChips
          chips={lastRefine}
          onSelect={handleChip}
          className="mb-2"
        />
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-full border bg-background/60 px-4 py-3 text-sm shadow-sm outline-none ring-primary/20 focus:ring-2"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!canSend}
            className="rounded-full px-5"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
