import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/format";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Prime Kicks KE" },
      {
        name: "description",
        content:
          "Founded by Joyce in Nairobi, Prime Kicks KE sources premium sneakers for people who treat style as identity. Our mission, vision and values.",
      },
      { property: "og:title", content: "Our Story — Prime Kicks KE" },
      {
        property: "og:description",
        content: "Founded by Joyce in Nairobi — confidence, presence and a lifestyle.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-28 pt-28 md:px-8 md:pt-36">
      <p className="eyebrow">Our story</p>
      <h1 className="mt-3 display text-6xl md:text-8xl">
        Style is not optional.
        <br />
        <span className="text-primary">It's identity.</span>
      </h1>

      <div className="mt-14 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p className="text-lg text-foreground">
          Prime Kicks KE is a Nairobi-based sneaker brand built for people who understand that style
          is not optional — it's identity.
        </p>
        <p>
          We specialize in sourcing and delivering fresh, high-demand sneakers that elevate your
          everyday look. We're not just selling shoes. We're delivering confidence, presence, and a
          lifestyle.
        </p>
        <p>
          The brand is founded and run by <span className="text-foreground">Joyce</span>, who
          personally checks every pair before it reaches you — from the first DM to the moment you
          lace up.
        </p>
      </div>

      <div className="mt-16 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
        <div className="bg-background p-8">
          <p className="eyebrow">Mission</p>
          <p className="mt-3 text-sm leading-relaxed">
            To make premium, stylish sneakers accessible to people who value quality, confidence and
            self-expression.
          </p>
        </div>
        <div className="bg-background p-8">
          <p className="eyebrow">Vision</p>
          <p className="mt-3 text-sm leading-relaxed">
            To become one of Kenya's most trusted and recognized sneaker brands, known for
            authenticity, consistency and culture.
          </p>
        </div>
      </div>

      <div className="mt-16 border-t border-border pt-10">
        <p className="eyebrow">Come see us</p>
        <p className="mt-3 display text-3xl">{BRAND.pickup}</p>
        <Link
          to="/shop"
          className="mt-8 inline-flex bg-primary px-8 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          Shop the collection
        </Link>
      </div>
    </main>
  );
}
