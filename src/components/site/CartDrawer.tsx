import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { ksh } from "@/lib/format";

export function CartDrawer() {
  const { lines, total, isOpen, setOpen, setQuantity, remove } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="display text-2xl">Your bag</SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-muted-foreground">Nothing in here yet.</p>
            <button
              onClick={() => {
                setOpen(false);
                void navigate({ to: "/shop" });
              }}
              className="bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {lines.map((line) => (
                <div
                  key={`${line.productId}-${line.size}`}
                  className="flex gap-4 border-b border-border py-4 first:pt-0"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden bg-surface">
                    {line.image && (
                      <img
                        src={line.image}
                        alt={line.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{line.name}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Size {line.size}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center transition-colors hover:bg-surface-2"
                          onClick={() =>
                            setQuantity(line.productId, line.size, line.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs">{line.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center transition-colors hover:bg-surface-2"
                          onClick={() =>
                            setQuantity(line.productId, line.size, line.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        aria-label="Remove item"
                        className="text-muted-foreground transition-colors hover:text-primary"
                        onClick={() => remove(line.productId, line.size)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">{ksh(line.price * line.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Total</span>
                <span className="display text-2xl">{ksh(total)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                No payment online — we confirm everything with you on WhatsApp.
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  void navigate({ to: "/checkout" });
                }}
                className="mt-4 w-full bg-primary py-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
