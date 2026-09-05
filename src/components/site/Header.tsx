import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/lookbook", label: "Style It" },
  { to: "/about", label: "Our Story" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenu(false), [pathname]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:h-20 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group relative text-[0.8rem] font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary transition-all duration-400 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-sm transition-colors hover:bg-surface-2"
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-sm transition-colors hover:bg-surface-2 md:hidden"
            aria-label="Toggle menu"
          >
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="border-b border-border py-4 display text-2xl last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
