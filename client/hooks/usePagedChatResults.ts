import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ChatRequestBody, ChatResponseBody, ProductItem, PageInfo } from '@shared/api';

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

  const mutation = useMutation<ChatResponseBody, Error, ChatRequestBody>({
    mutationFn: async (payload) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        // Convert message to query format for our simple endpoint
        const requestBody = {
          query: payload.message,
          topK: 5
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
        setItems(data.products);
        setReply(data.reply);
        setRefineChips(data.refineChips);
      } else {
        // Append new items for subsequent pages
        setItems(prev => [...prev, ...data.products]);
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

  const loadMore = useCallback(() => {
    if (!pageInfo?.nextCursor || loadingRef.current || mutation.isPending) {
      return;
    }

    if (!options.initialPayload) {
      setError('No initial payload available for pagination');
      return;
    }

    loadingRef.current = true;
    setError(null);

    mutation.mutate({
      ...options.initialPayload,
      cursor: pageInfo.nextCursor,
      intentToken: meta?.intentToken,
    });
  }, [pageInfo?.nextCursor, mutation, options.initialPayload, meta?.intentToken]);

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