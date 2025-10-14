import { mountChat } from './entry.tsx'

// Keep ESM export for module consumers:
export { mountChat }

// Also expose a global for non-module usage (and to prevent DCE):
declare global {
  interface Window {
    GiftsmateChat?: { mountChat: typeof mountChat }
  }
}
if (typeof window !== 'undefined') {
  // Don't overwrite if already present (hot reload / multiple includes)
  window.GiftsmateChat = window.GiftsmateChat || { mountChat }
  // Ensure the reference is kept so bundlers don't tree-shake it away
  // by "using" it here:
  void window.GiftsmateChat.mountChat
}
