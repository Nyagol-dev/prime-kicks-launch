import { Link, useRouterState } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";
import { BRAND } from "@/lib/format";

export function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  return (
    <footer className="border-t border-border bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <p className="display text-[13vw] leading-[0.85] md:text-[7rem]">
          Step In. <span className="text-primary">Stand Out.</span>
        </p>

        <div className="mt-14 grid gap-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow">Visit</p>
            <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {BRAND.pickup}
            </p>
          </div>
          <div>
            <p className="eyebrow">Talk to us</p>
            <a
              href={`https://wa.me/${BRAND.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 text-primary" />
              {BRAND.phone}
            </a>
          </div>
          <div>
            <p className="eyebrow">Follow</p>
            <a
              href={`https://instagram.com/${BRAND.social}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Instagram className="h-4 w-4 text-primary" />@{BRAND.social}
            </a>
          </div>
          <div>
            <p className="eyebrow">Explore</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/shop" className="transition-colors hover:text-primary">
                Shop all
              </Link>
              <Link to="/lookbook" className="transition-colors hover:text-primary">
                Style It
              </Link>
              <Link to="/about" className="transition-colors hover:text-primary">
                Our story
              </Link>
              <Link to="/auth" className="transition-colors hover:text-primary">
                Owner login
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Prime Kicks KE — Nairobi, Kenya.
        </p>
      </div>
    </footer>
  );
}
