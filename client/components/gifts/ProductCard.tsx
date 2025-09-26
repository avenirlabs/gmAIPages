import { cn } from "@/lib/utils";
import type { ProductItem } from "@shared/api";
import { getImageAspectClass } from "@/config/ui";

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
        "group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200",
        className,
      )}
    >
      {product.image ? (
        <div className={cn("relative w-full overflow-hidden", getImageAspectClass())}>
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="line-clamp-2 font-medium leading-snug text-brand-secondary-800">
          {product.title}
        </div>
        {product.description ? (
          <p className="line-clamp-2 text-sm text-brand-secondary-600">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {typeof product.price === "number" ? (
              <span className="font-semibold text-brand-primary-500">
                ₹{product.price.toFixed(0)}
              </span>
            ) : null}
            {typeof product.score === "number" ? (
              <span className="rounded-full bg-brand-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-primary-600">
                {Math.round(product.score * 100)}% match
              </span>
            ) : null}
          </div>
          <span className="text-xs text-brand-secondary-500 hover:text-brand-primary-500 transition-colors">View</span>
        </div>
      </div>
    </a>
  );
}
