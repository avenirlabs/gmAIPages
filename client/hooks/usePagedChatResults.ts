import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ChatRequestBody, ChatResponseBody, ProductItem, PageInfo } from '@shared/api';

type ChatVars = {
  message: string;
  topK?: number;
  cursor?: string | null;
  filters?: {
    relation?: string[];
    occasion?: string[];
    interest?: string[];
    priceRange?: [number, number] | null
  };
  soft?: boolean;
};

interface UsePagedChatResultsOptions {
  initialPayload?: {
    message: string;
    history?: any[];
    selectedRefinements?: string[];
  };
}

interface UsePagedChatResultsReturn {
  items: ProductItem[];
  pageInfo: PageInfo | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMore: () => void;
  reset: () => void;
  refineChips: string[];
  reply: string;
  meta: any;
}

export function usePagedChatResults(options: UsePagedChatResultsOptions = {}): UsePagedChatResultsReturn {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [refineChips, setRefineChips] = useState<string[]>([]);
  const [reply, setReply] = useState<string>('');
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const mutation = useMutation<ChatResponseBody, Error, ChatVars>({
    mutationFn: async (variables) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const requestBody = {
          query: variables.message,
          topK: variables.topK ?? 8,
          cursor: variables.cursor ?? null,
          filters: variables.filters ?? {},
          soft: variables.soft ?? false
        };

        const res = await fetch("/api/gifts/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (res.ok) {
          return await res.json();
        }

        throw new Error(`API request failed with status ${res.status}`);
      } finally {
        clearTimeout(timeout);
      }
    },
    onSuccess: (data, variables) => {
      // If this is the first page (no cursor), reset items
      if (!variables.cursor) {
        setItems(data.products || []);
        setReply(data.reply || '');
        setRefineChips(data.refineChips || []);
      } else {
        // Append new items for subsequent pages
        setItems(prev => [...prev, ...(data.products || [])]);
      }

      setPageInfo(data.pageInfo);
      setMeta(data.meta);
      setError(null);
      loadingRef.current = false;
    },
    onError: (error) => {
      setError(error.message || 'Failed to load results');
      loadingRef.current = false;
    },
  });

  const loadMore = useCallback((lastQuery: string, filters: any = {}) => {
    if (!pageInfo?.nextCursor || loadingRef.current || mutation.isPending) {
      return;
    }

    loadingRef.current = true;
    setError(null);

    mutation.mutate({
      message: lastQuery,
      cursor: pageInfo.nextCursor,
      filters,
      topK: 8,
      soft: false
    });
  }, [pageInfo?.nextCursor, mutation]);

  const reset = useCallback(() => {
    setItems([]);
    setPageInfo(null);
    setRefineChips([]);
    setReply('');
    setMeta(null);
    setError(null);
    loadingRef.current = false;
    mutation.reset();
  }, [mutation]);

  return {
    items,
    pageInfo,
    hasMore: !!pageInfo?.nextCursor,
    isLoadingMore: loadingRef.current || mutation.isPending,
    error,
    loadMore,
    reset,
    refineChips,
    reply,
    meta,
  };
}