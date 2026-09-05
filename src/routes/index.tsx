import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { listLookbook, listProducts } from "@/lib/shop.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { BRAND } from "@/lib/format";

const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => listProducts() });
const lookbookQuery = queryOptions({ queryKey: ["lookbook"], queryFn: () => listLookbook() });

const FALLBACK_LOOKS = [
  { id: "l1", image_url: "/images/look-1.jpg", caption: "Denim on denim, clean whites" },
  { id: "l2", image_url: "/images/look-2.jpg", caption: "All black, red sole energy" },
  { id: "l3", image_url: "/images/look-3.jpg", caption: "Nairobi nights, tracksuit season" },
];

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(lookbookQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Prime Kicks KE — Step In. Stand Out. Step Different." },
      {
        name: "description",
        content:
          "Nairobi-based sneaker brand delivering fresh, high-demand sneakers. Shop premium kicks, pick up at Platinum Plaza or get countrywide delivery.",
      },
      { property: "og:title", content: "Prime Kicks KE — Step In. Stand Out. Step Different." },
      {
        property: "og:description",
        content: "Premium sneakers for people who treat style as identity. Nairobi, Kenya.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: looks } = useSuspenseQuery(lookbookQuery);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const gallery = looks.length ? looks : FALLBACK_LOOKS;

  return (
    <main>
      {/* HERO */}
      <section className="relative min-h-[92svh] overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Prime Kicks KE street style in Nairobi"
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 fade-mask" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-end px-5 pb-16 pt-28 md:px-8 md:pb-24">
          <p className="eyebrow rise">Nairobi, Kenya · @{BRAND.social}</p>
          <h1 className="mt-5 display text-[16vw] leading-[0.85] rise md:text-[8.5rem]">
            Step In.
            <br />
            Stand Out.
            <br />
            <span className="text-primary">Step Different.</span>
          </h1>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-muted-foreground rise md:text-base">
            We source fresh, high-demand sneakers for people who understand that style is not
            optional — it's identity.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 rise">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 bg-primary px-8 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Shop the drop
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center border border-border px-8 py-4 text-xs font-semibold uppercase tracking-[0.24em] transition-colors hover:border-primary hover:text-primary"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-border bg-ink py-4">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10 display text-lg text-muted-foreground">
              <span>Authentic sourcing</span>
              <span className="text-primary">◆</span>
              <span>Countrywide delivery</span>
              <span className="text-primary">◆</span>
              <span>Pickup at Platinum Plaza</span>
              <span className="text-primary">◆</span>
              <span>Pay on confirmation</span>
              <span className="text-primary">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* STORY */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Who we are</p>
            <h2 className="mt-4 display text-5xl md:text-6xl">
              Not just shoes.
              <br />
              <span className="text-primary">Confidence.</span>
            </h2>
          </div>
          <div className="space-y-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p className="text-foreground">
              Prime Kicks KE is a Nairobi-based sneaker brand built for people who understand that
              style is not optional — it's identity.
            </p>
            <p>
              We specialize in sourcing and delivering fresh, high-demand sneakers that elevate your
              everyday look. We're not just selling shoes. We're delivering confidence, presence,
              and a lifestyle.
            </p>
            <div className="grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Mission</p>
                <p className="mt-2">
                  Make premium, stylish sneakers accessible to people who value quality, confidence
                  and self-expression.
                </p>
              </div>
              <div>
                <p className="eyebrow">Vision</p>
                <p className="mt-2">
                  Become one of Kenya's most trusted sneaker brands — known for authenticity,
                  consistency and culture.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Authentic sourcing", copy: "Every pair checked before it reaches you." },
            { icon: Truck, title: "Countrywide delivery", copy: "Nairobi pickup or delivered to your town." },
            { icon: Sparkles, title: "Styled with you", copy: "Tell us the vibe, we'll match the pair." },
          ].map((f) => (
            <div key={f.title} className="bg-background p-8 transition-colors hover:bg-surface">
              <f.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
              <h3 className="mt-5 display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-t border-border bg-ink">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Trending now</p>
              <h2 className="mt-3 display text-5xl md:text-6xl">Fresh on the shelf</h2>
            </div>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary"
            >
              All sneakers
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* STYLE IT */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="max-w-xl">
          <p className="eyebrow">Style it</p>
          <h2 className="mt-3 display text-5xl md:text-6xl">
            How Nairobi <span className="text-primary">wears them</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Real fits, real people. Tag @{BRAND.social} and you might land in the lookbook.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.slice(0, 3).map((look, i) => (
            <figure
              key={look.id}
              className="group relative aspect-[3/4] overflow-hidden bg-surface rise"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img
                src={look.image_url}
                alt={look.caption || "Prime Kicks street style"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 fade-mask p-5 text-sm">
                {look.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10">
          <Link
            to="/lookbook"
            className="inline-flex items-center border border-border px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] transition-colors hover:border-primary hover:text-primary"
          >
            See the full lookbook
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-5 py-16 md:px-8 md:py-20">
          <h2 className="display text-4xl md:text-6xl">Ready to step different?</h2>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-background px-8 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-foreground transition-transform duration-500 hover:-translate-y-1"
          >
            Shop now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
