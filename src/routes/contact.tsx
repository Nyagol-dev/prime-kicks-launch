import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Pickup — Prime Kicks KE" },
      {
        name: "description",
        content:
          "Reach Prime Kicks KE on WhatsApp 0798718785 or visit Platinum Plaza, 3rd Floor, Shop 305, Nairobi.",
      },
      { property: "og:title", content: "Contact & Pickup — Prime Kicks KE" },
      { property: "og:description", content: "WhatsApp us or visit the shop in Nairobi CBD." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-28 pt-28 md:px-8 md:pt-36">
      <p className="eyebrow">Say hello</p>
      <h1 className="mt-3 display text-6xl md:text-8xl">
        Let's <span className="text-primary">talk</span>
      </h1>
      <p className="mt-5 max-w-lg text-sm text-muted-foreground">
        Questions on sizing, stock or delivery? WhatsApp is the fastest way to reach Joyce.
      </p>

      <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
        <a
          href={`https://wa.me/${BRAND.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="group bg-background p-8 transition-colors hover:bg-surface"
        >
          <MessageCircle className="h-5 w-5 text-primary" strokeWidth={1.6} />
          <p className="mt-5 display text-2xl group-hover:text-primary">WhatsApp</p>
          <p className="mt-2 text-sm text-muted-foreground">{BRAND.phone}</p>
        </a>
        <a
          href={`tel:${BRAND.phone}`}
          className="group bg-background p-8 transition-colors hover:bg-surface"
        >
          <Phone className="h-5 w-5 text-primary" strokeWidth={1.6} />
          <p className="mt-5 display text-2xl group-hover:text-primary">Call</p>
          <p className="mt-2 text-sm text-muted-foreground">{BRAND.phone}</p>
        </a>
        <a
          href={`https://instagram.com/${BRAND.social}`}
          target="_blank"
          rel="noreferrer"
          className="group bg-background p-8 transition-colors hover:bg-surface"
        >
          <Instagram className="h-5 w-5 text-primary" strokeWidth={1.6} />
          <p className="mt-5 display text-2xl group-hover:text-primary">Instagram & TikTok</p>
          <p className="mt-2 text-sm text-muted-foreground">@{BRAND.social}</p>
        </a>
        <div className="bg-background p-8">
          <MapPin className="h-5 w-5 text-primary" strokeWidth={1.6} />
          <p className="mt-5 display text-2xl">Pickup point</p>
          <p className="mt-2 text-sm text-muted-foreground">{BRAND.pickup}</p>
        </div>
      </div>
    </main>
  );
}
