/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ProductItem {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  url: string;
  tags?: string[];
  vendor?: string;
  score?: number; // 0..1 match score
}

export interface ChatTurn {
  role: ChatRole;
  content: string;
  products?: ProductItem[];
  refineChips?: string[];
}

export interface ChatRequestBody {
  message: string;
  history?: ChatTurn[];
  selectedRefinements?: string[];
}

export interface ChatResponseBody {
  reply: string;
  products: ProductItem[];
  refineChips: string[];
}
