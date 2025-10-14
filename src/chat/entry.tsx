import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from '@/components/gifts/ChatInterface';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function mountChat(selector?: string, options?: { apiBase?: string; starterPrompts?: string[] }) {
  const el = selector ? (document.querySelector(selector) as HTMLElement) : ensureContainer();
  if (!el) {
    throw new Error(`mountChat: element not found for selector "${selector}"`);
  }

  const root = createRoot(el);
  root.render(<App apiBase={options?.apiBase} starterPrompts={options?.starterPrompts} />);

  return {
    unmount: () => root.unmount(),
  };
}

function ensureContainer() {
  let el = document.getElementById('gm-chat-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gm-chat-container';
    document.body.appendChild(el);
  }
  return el;
}

function App({ apiBase, starterPrompts }: { apiBase?: string; starterPrompts?: string[] }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <ChatInterface apiBase={apiBase} starterPrompts={starterPrompts} />
      </div>
    </QueryClientProvider>
  );
}
