import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listProducts } from "@/lib/shop.functions";
import { ProductCard } from "@/components/site/ProductCard";

const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => listProducts() });

export const Route = createFileRoute("/shop/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => ({
    meta: [
      { title: "Shop Sneakers — Prime Kicks KE" },
      {
        name: "description",
        content:
          "Browse every pair in stock at Prime Kicks KE. Filter by size, category and price. Nairobi pickup or countrywide delivery.",
      },
      { property: "og:title", content: "Shop Sneakers — Prime Kicks KE" },
      { property: "og:description", content: "Every pair in stock, filter by size and price." },
    ],
  }),
  component: Shop,
});

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
] as const;

function Shop() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [category, setCategory] = useState("all");
  const [size, setSize] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("featured");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );
  const sizes = useMemo(
    () =>
      Array.from(new Set(products.flatMap((p) => p.sizes.map((s) => s.size)))).sort(
        (a, b) => Number(a) - Number(b),
      ),
    [products],
  );

  const visible = useMemo(() => {
    let list = products.filter((p) => category === "all" || p.category === category);
    if (size !== "all") list = list.filter((p) => p.sizes.some((s) => s.size === size && s.stock > 0));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "featured")
      list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return list;
  }, [products, category, size, sort]);

  const chip = (active: boolean) =>
    `px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] border transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
    }`;

  return (
    <main className="mx-auto max-w-7xl px-5 pb-28 pt-28 md:px-8 md:pt-36">
      <p className="eyebrow">The collection</p>
      <h1 className="mt-3 display text-6xl md:text-8xl">Shop</h1>

      <div className="mt-10 space-y-4 border-y border-border py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-2 w-20">Category</span>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-2 w-20">Size</span>
          <button onClick={() => setSize("all")} className={chip(size === "all")}>
            All
          </button>
          {sizes.map((s) => (
            <button key={s} onClick={() => setSize(s)} className={chip(size === s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-2 w-20">Sort</span>
          {SORTS.map((s) => (
            <button key={s.id} onClick={() => setSort(s.id)} className={chip(sort === s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">
          Nothing matches that combination yet — try another size.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-4">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
