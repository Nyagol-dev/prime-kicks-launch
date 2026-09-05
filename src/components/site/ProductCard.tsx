import { Link } from "@tanstack/react-router";
import { ksh } from "@/lib/format";
import type { Product } from "@/lib/shop.functions";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const inStock = product.sizes.reduce((n, s) => n + s.stock, 0);

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="group block rise"
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            Photo coming soon
          </div>
        )}
        {inStock === 0 && (
          <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em]">
            Sold out
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-primary py-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
          View
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium leading-snug transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {product.sizes.length} sizes
          </p>
        </div>
        <p className="display text-base whitespace-nowrap">{ksh(product.price)}</p>
      </div>
    </Link>
  );
}
