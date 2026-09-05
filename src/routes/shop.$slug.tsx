import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/shop.functions";
import { useCart } from "@/lib/cart";
import { ksh } from "@/lib/format";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
  });

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    return { name: product.name, description: product.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Sneaker not found — Prime Kicks KE" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — Prime Kicks KE`;
    const description = loaderData.description.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  if (!product) return null;

  const onAdd = () => {
    if (!size) {
      toast.error("Pick your size first");
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size,
      image: product.images[0] ?? null,
    });
    toast.success(`${product.name} (size ${size}) added`);
  };

  return (
    <main className="mx-auto max-w-7xl px-5 pb-28 pt-28 md:px-8 md:pt-32">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="aspect-square overflow-hidden bg-surface">
            {product.images[active] && (
              <img
                src={product.images[active]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActive(i)}
                  className={`h-20 w-20 overflow-hidden border transition-colors ${
                    i === active ? "border-primary" : "border-border hover:border-foreground"
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          <p className="eyebrow">{product.category}</p>
          <h1 className="mt-3 display text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-4 display text-3xl text-primary">{ksh(product.price)}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-10">
            <p className="eyebrow">Select size</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const disabled = s.stock <= 0;
                return (
                  <button
                    key={s.size}
                    disabled={disabled}
                    onClick={() => setSize(s.size)}
                    className={`h-12 min-w-14 border px-3 text-sm transition-all duration-300 ${
                      disabled
                        ? "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                        : size === s.size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-foreground"
                    }`}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
            {size && (
              <p className="mt-3 text-xs text-muted-foreground">
                {product.sizes.find((s) => s.size === size)?.stock} left in size {size}
              </p>
            )}
          </div>

          <button
            onClick={onAdd}
            className="mt-8 w-full bg-primary py-5 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto sm:px-16"
          >
            Add to bag
          </button>

          <div className="mt-10 space-y-3 border-t border-border pt-8 text-sm text-muted-foreground">
            <p className="flex gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-primary" /> Free pickup — Platinum Plaza, 3rd
              Floor, Shop 305
            </p>
            <p className="flex gap-3">
              <Truck className="h-4 w-4 shrink-0 text-primary" /> Countrywide delivery available
            </p>
            <p className="flex gap-3">
              <Check className="h-4 w-4 shrink-0 text-primary" /> No online payment — we confirm on
              WhatsApp
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
