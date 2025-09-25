import { cn } from "@/lib/utils";
import type { ProductItem } from "@shared/api";

interface Props {
  product: ProductItem;
  className?: string;
}

export function ProductCard({ product, className }: Props) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      {product.image ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="line-clamp-2 font-medium leading-snug">
          {product.title}
        </div>
        {product.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {typeof product.price === "number" ? (
              <span className="font-semibold text-primary">
                ₹{product.price.toFixed(0)}
              </span>
            ) : null}
            {typeof product.score === "number" ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {Math.round(product.score * 100)}% match
              </span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">View</span>
        </div>
      </div>
    </a>
  );
}
