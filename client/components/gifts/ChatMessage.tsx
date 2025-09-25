import { cn } from "@/lib/utils";
import type { ProductItem } from "@shared/api";
import { ProductCard } from "./ProductCard";

interface Props {
  role: "user" | "assistant";
  content: string;
  products?: ProductItem[];
}

export function ChatMessage({ role, content, products }: Props) {
  const isUser = role === "user";
  return (
    <div className="w-full">
      {/* Message bubble in readable container */}
      <div className="mx-auto max-w-[78ch] px-4">
        <div
          className={cn(
            "flex w-full gap-3",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {!isUser && (
            <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#155ca5] to-[#1d7dd8] text-white grid place-items-center font-semibold">
              AI
            </div>
          )}
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-[#F0F5F9] text-foreground rounded-bl-sm",
            )}
          >
            <p className="whitespace-pre-wrap font-mono lg:font-sans">{content}</p>
          </div>
          {isUser && (
            <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#1d7dd8] to-[#155ca5] text-white grid place-items-center font-semibold">
              You
            </div>
          )}
        </div>
      </div>

      {/* Products grid spans full width */}
      {products && products.length > 0 && (
        <div className="mt-4 w-full px-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
