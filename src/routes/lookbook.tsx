import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listLookbook } from "@/lib/shop.functions";
import { BRAND } from "@/lib/format";

const lookbookQuery = queryOptions({ queryKey: ["lookbook"], queryFn: () => listLookbook() });

const FALLBACK = [
  { id: "l1", image_url: "/images/look-1.jpg", caption: "Denim on denim, clean whites" },
  { id: "l2", image_url: "/images/look-2.jpg", caption: "All black, red sole energy" },
  { id: "l3", image_url: "/images/look-3.jpg", caption: "Nairobi nights, tracksuit season" },
];

export const Route = createFileRoute("/lookbook")({
  loader: ({ context }) => context.queryClient.ensureQueryData(lookbookQuery),
  head: () => ({
    meta: [
      { title: "Style It — Prime Kicks KE Lookbook" },
      {
        name: "description",
        content: "Real Nairobi fits styled with Prime Kicks sneakers. Get ideas, then get the pair.",
      },
      { property: "og:title", content: "Style It — Prime Kicks KE Lookbook" },
      { property: "og:description", content: "Real Nairobi fits styled with Prime Kicks sneakers." },
    ],
  }),
  component: Lookbook,
});

function Lookbook() {
  const { data } = useSuspenseQuery(lookbookQuery);
  const looks = data.length ? data : FALLBACK;

  return (
    <main className="mx-auto max-w-7xl px-5 pb-28 pt-28 md:px-8 md:pt-36">
      <p className="eyebrow">Style it</p>
      <h1 className="mt-3 display text-6xl md:text-8xl">
        The <span className="text-primary">Lookbook</span>
      </h1>
      <p className="mt-5 max-w-lg text-sm text-muted-foreground">
        How the city wears them. Tag @{BRAND.social} in your fit and we'll feature you here.
      </p>

      <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {looks.map((look, i) => (
          <figure
            key={look.id}
            className="group relative mb-5 break-inside-avoid overflow-hidden bg-surface rise"
            style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
          >
            <img
              src={look.image_url}
              alt={look.caption || "Prime Kicks street style"}
              loading="lazy"
              className="w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            {look.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 fade-mask p-5 text-sm">
                {look.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </main>
  );
}
