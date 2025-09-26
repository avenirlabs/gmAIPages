import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChatMessage } from "./ChatMessage";
import { RefinementChips } from "./RefinementChips";
import { FacetChips } from "./FacetChips";
import { EmptyState } from "./EmptyState";
import { BroadeningBanner } from "./BroadeningBanner";
import type { ChatResponseBody, ProductItem, PageInfo, GiftFilters, FacetCounts } from "@shared/api";
import { Button } from "@/components/ui/button";
import { StarterPrompts } from "./StarterPrompts";
import { useGiftFilters } from "@/hooks/useGiftFilters";
import { chipToFilter, isChipActive, filterToChip } from "@/utils/chipMapping";
import { X } from "lucide-react";

interface Turn {
  role: "user" | "assistant";
  content: string;
  products?: ProductItem[];
  refineChips?: string[];
  pageInfo?: PageInfo;
  meta?: any;
  query?: string; // Store original query for pagination
  broadened?: boolean; // Track if results were broadened
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
        "Hi! I can help you find the perfect gift. Tell me who it's for and the occasion (e.g. 'gifts for sister who loves cooking, budget under ₹500').",
    },
  ]);
  const [input, setInput] = useState("");
  const [lastRefine, setLastRefine] = useState<string[]>([]);
  const [lastFacets, setLastFacets] = useState<FacetCounts>({});
  const [loadingMoreStates, setLoadingMoreStates] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gift filter state management
  const { selectedFilters, toggleValue, clearAll, hasFilters, setSoft } = useGiftFilters();

  // Calculate active chips for visual state
  const activeChips = useMemo(() => {
    const active = new Set<string>();
    lastRefine.forEach(chip => {
      if (isChipActive(chip, selectedFilters)) {
        active.add(chip);
      }
    });
    return active;
  }, [lastRefine, selectedFilters]);

  // Get active filter pills for display
  const activeFilterPills = useMemo(() => {
    const pills: Array<{ key: keyof GiftFilters; value: string; label: string }> = [];

    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (key === 'soft' || key === 'priceRange') return; // Skip these special keys

      (values as string[])?.forEach(value => {
        const label = filterToChip(key as keyof GiftFilters, value);
        if (label) {
          pills.push({ key: key as keyof GiftFilters, value, label });
        }
      });
    });

    return pills;
  }, [selectedFilters]);

  const mutate = useMutation<
    ChatResponseBody,
    Error,
    { message: string; selectedRefinements?: string[]; history?: Turn[]; cursor?: string; intentToken?: string; filters?: GiftFilters }
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
    onSuccess: (data, variables) => {
      // If this is load more (cursor provided), append to existing turn
      if (variables.cursor) {
        setTurns((prevTurns) => {
          const lastTurnIndex = prevTurns.length - 1;
          if (lastTurnIndex >= 0 && prevTurns[lastTurnIndex].role === "assistant") {
            const updatedTurn = {
              ...prevTurns[lastTurnIndex],
              products: [...(prevTurns[lastTurnIndex].products || []), ...data.products],
              pageInfo: data.pageInfo,
              meta: data.meta,
            };
            return [...prevTurns.slice(0, lastTurnIndex), updatedTurn];
          }
          return prevTurns;
        });
        // Clear loading more state and announce results
        setLoadingMoreStates((prev) => {
          const updated = { ...prev };
          const turnIndex = turns.length - 1;
          delete updated[turnIndex];
          return updated;
        });

        // Announce loaded results for screen readers
        const announcement = `Loaded ${data.products.length} more results`;
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = announcement;
        document.body.appendChild(announcer);
        setTimeout(() => document.body.removeChild(announcer), 1000);
      } else {
        // New conversation turn
        const assistant: Turn = {
          role: "assistant",
          content: data.reply,
          products: data.products,
          refineChips: data.refineChips,
          pageInfo: data.pageInfo,
          meta: data.meta,
          query: variables.message,
          broadened: data.meta?.broadened || false,
        };
        setTurns((t) => [...t, assistant]);
        setLastRefine(data.refineChips);
        setLastFacets(data.facets || {});
      }
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

  const handleSend = (text?: string, refinements?: string[], resetPagination = true) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const userTurn: Turn = { role: "user", content };
    setTurns((t) => [...t, userTurn]);
    setInput("");
    mutate.mutate({
      message: content,
      selectedRefinements: refinements?.length ? refinements : undefined,
      history: turns,
      filters: hasFilters ? selectedFilters : undefined,
    });
  };

  const handleChip = (chip: string) => {
    const mapping = chipToFilter(chip);
    if (mapping) {
      // This is a filterable chip - toggle the filter
      toggleValue(mapping.key, mapping.value);

      // If we have active filters, re-run the last query with updated filters
      const lastAssistantTurn = [...turns].reverse().find(t => t.role === 'assistant' && t.query);
      if (lastAssistantTurn?.query) {
        handleSend(lastAssistantTurn.query);
      }
    } else {
      // Fallback to old behavior for non-filterable chips
      const next = input ? `${input} ${chip}` : chip;
      setInput(next);
      handleSend(next, [chip]);
    }
  };

  const handleLoadMore = (turnIndex: number, turn: Turn) => {
    if (!turn.pageInfo?.nextCursor || !turn.query || mutate.isPending || loadingMoreStates[turnIndex]) {
      return;
    }

    // Set loading state for this turn
    setLoadingMoreStates((prev) => ({ ...prev, [turnIndex]: true }));

    mutate.mutate({
      message: turn.query,
      cursor: turn.pageInfo.nextCursor,
      intentToken: turn.meta?.intentToken,
      history: turns.slice(0, turnIndex),
      filters: hasFilters ? selectedFilters : undefined,
    });
  };

  const handleEmptyStateSuggestion = (suggestion: string) => {
    setInput(suggestion);
    handleSend(suggestion);
  };

  const handleTryBroaderSearch = (originalQuery: string) => {
    // Create a simpler version of the query
    const broaderQuery = originalQuery
      .replace(/under.*\$?[\d,]+/gi, '') // Remove budget constraints
      .replace(/specific|exactly|perfect|best/gi, '') // Remove exactness words
      .replace(/\s+/g, ' ')
      .trim();

    const finalQuery = broaderQuery || 'gifts';
    setInput(finalQuery);
    handleSend(finalQuery);
  };

  const handleRevertToStrict = () => {
    // Set filters to strict mode and re-run last query
    setSoft(false);
    const lastAssistantTurn = [...turns].reverse().find(t => t.role === 'assistant' && t.query);
    if (lastAssistantTurn?.query) {
      handleSend(lastAssistantTurn.query);
    }
  };

  const placeholder = useMemo(
    () =>
      "Try: gifts for sister who loves cooking under ₹500, or: birthday ideas for gym lover",
    [],
  );

  return (
    <div className="w-full">
      {/* Header */}
     <div className="w-full">
        <h2 className="text-center text-3xl font-bold md:text-4xl">Gifts Guru</h2>
<p className="mt-2 text-center text-lg md:text-xl text-gray-700">
          Next-gen gifting intelligence at your fingertips. Tell it who you're
          shopping for—let the magic unfold.
        </p>
      </div>

      {/* Chat conversation area */}
      <div
        ref={scrollRef}
        className="w-full space-y-6 overflow-y-auto py-6"
      >
        {turns.map((t, i) => (
          <div key={i} className={i === 0 && t.role === "assistant" ? "text-left" : ""}>
            <ChatMessage
              role={t.role}
              content={t.content}
              products={t.products}
            />
            {/* Show broadening banner for assistant turns with broadened results */}
            {t.role === "assistant" && t.broadened && (t.products?.length || 0) > 0 && (
              <div className="mt-4">
                <BroadeningBanner
                  onRevertToStrict={handleRevertToStrict}
                />
              </div>
            )}
            {/* Handle empty state for assistant turns with zero products */}
            {t.role === "assistant" && t.pageInfo?.total === 0 && t.query && (
              <div className="mt-4">
                <EmptyState
                  queryText={t.query}
                  onSuggestionClick={handleEmptyStateSuggestion}
                  onTryBroaderSearch={() => handleTryBroaderSearch(t.query || '')}
                />
              </div>
            )}
            {/* Load More button for assistant turns with more results */}
            {t.role === "assistant" && t.pageInfo?.nextCursor && (t.products?.length || 0) > 0 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleLoadMore(i, t)}
                  disabled={loadingMoreStates[i] || mutate.isPending}
                  aria-busy={loadingMoreStates[i]}
                  className="rounded-full px-6"
                >
                  {loadingMoreStates[i] ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Loading more...
                    </>
                  ) : (
                    `Load more (${t.pageInfo.total - (t.products?.length || 0)} more available)`
                  )}
                </Button>
              </div>
            )}
            {/* Accessibility announcement for loaded results */}
            {loadingMoreStates[i] && (
              <div aria-live="polite" className="sr-only">
                Loading more results...
              </div>
            )}
          </div>
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

      {/* Input controls with responsive container */}
<div className="sticky bottom-0 z-40 border-t bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
<div className="w-full px-0 py-4 sm:py-6">
          {/* Active filters bar */}
          {activeFilterPills.length > 0 && (
            <div className="mb-3 rounded-lg border bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Active Filters:</span>
                <button
                  onClick={() => {
                    clearAll();
                    // Re-run last query without filters
                    const lastAssistantTurn = [...turns].reverse().find(t => t.role === 'assistant' && t.query);
                    if (lastAssistantTurn?.query) {
                      handleSend(lastAssistantTurn.query);
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeFilterPills.map(pill => (
                  <button
                    key={`${pill.key}-${pill.value}`}
                    onClick={() => {
                      toggleValue(pill.key, pill.value);
                      // Re-run last query with updated filters
                      const lastAssistantTurn = [...turns].reverse().find(t => t.role === 'assistant' && t.query);
                      if (lastAssistantTurn?.query) {
                        handleSend(lastAssistantTurn.query);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[#155ca5] px-2 py-1 text-xs font-medium text-white hover:bg-[#134a93] transition"
                  >
                    {pill.label}
                    <X size={12} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show facet chips with counts if facets are available */}
          {Object.keys(lastFacets).length > 0 ? (
            <FacetChips
              chips={lastRefine}
              facets={lastFacets}
              selectedFilters={selectedFilters}
              onToggle={handleChip}
              className="mb-3"
            />
          ) : (
            <RefinementChips
              chips={lastRefine}
              onSelect={handleChip}
              activeChips={activeChips}
              className="mb-3"
            />
          )}

          <div className="flex items-center gap-3">
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
              className="flex-1 rounded-full border bg-background px-4 py-3 text-sm shadow-sm outline-none ring-primary/20 focus:ring-2"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!canSend}
              className="rounded-full px-6"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
