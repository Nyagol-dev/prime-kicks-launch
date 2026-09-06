import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { ksh, BRAND } from "@/lib/format";
import { placeOrder } from "@/lib/shop.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Prime Kicks KE Sneakers Nairobi" },
      {
        name: "description",
        content:
          "Place your sneaker order with Prime Kicks KE. Pickup at Platinum Plaza Nairobi or countrywide delivery. We confirm payment on WhatsApp.",
      },
      { property: "og:title", content: "Checkout | Prime Kicks KE" },
      {
        property: "og:description",
        content: "Fast, no-payment-online checkout. We confirm your order on WhatsApp.",
      },
    ],
  }),
  component: CheckoutPage,
});

type Done = { orderCode: string; total: number };

function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const submit = useServerFn(placeOrder);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    deliveryMethod: "pickup" as "pickup" | "delivery",
    address: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await submit({
        data: {
          name: form.name,
          phone: form.phone,
          deliveryMethod: form.deliveryMethod,
          address: form.address,
          notes: form.notes,
          items: lines.map((l) => ({
            product_id: l.productId,
            size: l.size,
            quantity: l.quantity,
          })),
        },
      });
      setDone(result);
      clear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 pb-24 pt-32 text-center md:px-8">
        <p className="eyebrow text-primary">Order {done.orderCode}</p>
        <h1 className="display mt-4 text-4xl md:text-5xl">Order received</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Your order has been received and is being processed. We will contact you shortly on{" "}
          {form.phone || "your phone"} to confirm payment and delivery details.
        </p>
        <p className="mt-6 display text-3xl">{ksh(done.total)}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(`Hi Prime Kicks, I just placed order ${done.orderCode}`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-primary px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Message us on WhatsApp
          </a>
          <Link
            to="/shop"
            className="border border-border px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-surface-2"
          >
            Keep shopping
          </Link>
        </div>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 pb-24 pt-32 text-center md:px-8">
        <h1 className="display text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">Add a pair and come back here.</p>
        <div className="mt-8">
          <Link
            to="/shop"
            className="inline-block bg-primary px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground"
          >
            Shop sneakers
          </Link>
        </div>
      </main>
    );
  }

  const field =
    "w-full border border-border bg-surface px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <p className="eyebrow text-primary">Checkout</p>
      <h1 className="display mt-3 text-4xl md:text-6xl">Almost yours</h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        No payment online. Tell us where to send them and we'll confirm everything with you
        directly.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="eyebrow mb-2 block" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={field}
                placeholder="Joyce Wanjiru"
              />
            </div>
            <div>
              <label className="eyebrow mb-2 block" htmlFor="phone">
                Phone / WhatsApp
              </label>
              <input
                id="phone"
                required
                minLength={9}
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={field}
                placeholder="07XX XXX XXX"
              />
            </div>
          </div>

          <div>
            <span className="eyebrow mb-2 block">How do you want them?</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { key: "pickup", title: "Pickup", copy: BRAND.pickup },
                  { key: "delivery", title: "Delivery", copy: "Countrywide, rider or courier" },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => set("deliveryMethod", opt.key)}
                  className={`border p-4 text-left transition-colors ${
                    form.deliveryMethod === opt.key
                      ? "border-primary bg-surface"
                      : "border-border hover:bg-surface-2"
                  }`}
                >
                  <span className="block text-sm font-semibold uppercase tracking-[0.16em]">
                    {opt.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">{opt.copy}</span>
                </button>
              ))}
            </div>
          </div>

          {form.deliveryMethod === "delivery" && (
            <div>
              <label className="eyebrow mb-2 block" htmlFor="address">
                Delivery address
              </label>
              <input
                id="address"
                required
                minLength={4}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={field}
                placeholder="Town, estate, pickup station"
              />
            </div>
          )}

          <div>
            <label className="eyebrow mb-2 block" htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className={`${field} resize-none`}
              placeholder="Anything we should know?"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary py-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Placing order…" : `Place order · ${ksh(total)}`}
          </button>
        </form>

        <aside className="h-fit border border-border bg-surface p-6">
          <h2 className="eyebrow">Your bag</h2>
          <div className="mt-5 space-y-4">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.size}`} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden bg-surface-2">
                  {l.image && (
                    <img src={l.image} alt={l.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size {l.size} · x{l.quantity}
                  </p>
                </div>
                <p className="text-sm">{ksh(l.price * l.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
            <span className="eyebrow">Total</span>
            <span className="display text-2xl">{ksh(total)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
