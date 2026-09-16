import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { signOut as signOutFn } from "@/lib/auth.functions";
import { Logo } from "@/components/site/Logo";
import { ksh, BRAND } from "@/lib/format";
import {
  adminAddLookbook,
  adminDeleteLookbook,
  adminDeleteProduct,
  adminGetSettings,
  adminListLookbook,
  adminListOrders,
  adminListProducts,
  adminSaveProduct,
  adminSaveSettings,
  adminSetOrderStatus,
  adminSetStock,
  checkAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin | Prime Kicks KE" },
      { name: "description", content: "Prime Kicks KE shop management dashboard." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin | Prime Kicks KE" },
      { property: "og:description", content: "Prime Kicks KE shop management dashboard." },
    ],
  }),
  component: AdminPage,
});

type Tab = "orders" | "products" | "lookbook" | "settings";

const field =
  "w-full border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary";

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await res.text());
  const { url } = (await res.json()) as { url: string };
  return url;
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("orders");
  const isAdminFn = useServerFn(checkAdmin);
  const signOutServerFn = useServerFn(signOutFn);

  const { data: access, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => isAdminFn({}),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutServerFn({});
    void navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!access?.isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <h1 className="display text-3xl">No access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account isn't the shop owner account.
          </p>
          <button
            onClick={signOut}
            className="mt-6 border border-border px-6 py-3 text-xs uppercase tracking-[0.2em]"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "orders", label: "Orders" },
    { key: "products", label: "Products" },
    { key: "lookbook", label: "Style It" },
    { key: "settings", label: "Alerts" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Logo />
          <button
            onClick={signOut}
            className="border border-border px-4 py-2 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-5 md:px-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 pb-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        {tab === "orders" && <OrdersPanel />}
        {tab === "products" && <ProductsPanel />}
        {tab === "lookbook" && <LookbookPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </main>
  );
}

/* ---------------- Orders ---------------- */

function OrdersPanel() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListOrders);
  const setStatus = useServerFn(adminSetOrderStatus);

  // Poll for new orders every 15 seconds instead of Supabase Realtime
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => list({}),
    refetchInterval: 15_000,
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  const orders = data ?? [];

  return (
    <div>
      <h1 className="display text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        New orders appear here instantly. Call or WhatsApp the buyer to confirm payment.
      </p>

      {orders.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">No orders yet.</p>
      )}

      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <article key={o.id} className="border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-primary">{o.order_code}</p>
                <h2 className="display mt-1 text-2xl">{o.customer_name}</h2>
                <a
                  href={`tel:${o.phone}`}
                  className="mt-1 inline-block text-lg font-semibold text-primary"
                >
                  {o.phone}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("en-KE")}
                </p>
              </div>
              <div className="text-right">
                <p className="display text-2xl">{ksh(o.total)}</p>
                <select
                  value={o.status}
                  onChange={async (e) => {
                    try {
                      await setStatus({
                        data: { id: o.id, status: e.target.value as "new" | "processing" | "fulfilled" },
                      });
                      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
                    } catch {
                      toast.error("Could not update status");
                    }
                  }}
                  className="mt-2 border border-border bg-background px-3 py-2 text-xs uppercase tracking-[0.14em]"
                >
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4 text-sm">
              <p className="text-muted-foreground">
                {o.delivery_method === "pickup"
                  ? `Pickup — ${BRAND.pickup}`
                  : `Delivery — ${o.address ?? ""}`}
              </p>
              {o.notes && <p className="mt-1 text-muted-foreground">Note: {o.notes}</p>}
              <ul className="mt-3 space-y-1">
                {(o.order_items ?? []).map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>
                      {it.quantity} × {it.product_name} · size {it.size}
                    </span>
                    <span>{ksh(it.unit_price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/${o.phone.replace(/^0/, "254").replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block bg-primary px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground"
              >
                WhatsApp buyer
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */

type SizeDraft = { size: string; stock: number };
type Draft = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: "men" | "women" | "unisex" | "kids";
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  sizes: SizeDraft[];
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: 0,
  category: "unisex",
  images: [],
  is_featured: false,
  is_active: true,
  sizes: [],
};

function ProductsPanel() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListProducts);
  const save = useServerFn(adminSaveProduct);
  const del = useServerFn(adminDeleteProduct);
  const setStock = useServerFn(adminSetStock);
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => list({}) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  const products = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add sneakers, upload photos and keep stock accurate.
          </p>
        </div>
        <button
          onClick={() => setDraft({ ...emptyDraft })}
          className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New product
        </button>
      </div>

      {draft && (
        <ProductForm
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={async (d) => {
            await save({ data: d });
            setDraft(null);
            await refresh();
            toast.success("Product saved");
          }}
        />
      )}

      <div className="mt-8 space-y-4">
        {products.map((p) => (
          <article key={p.id} className="flex flex-wrap gap-5 border border-border bg-surface p-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden bg-surface-2">
              {p.images?.[0] && (
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-52 flex-1">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="text-sm text-muted-foreground">
                {ksh(p.price)} · {p.category}
                {p.is_featured ? " · featured" : ""}
                {p.is_active ? "" : " · hidden"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...(p.product_sizes ?? [])]
                  .sort((a, b) => Number(a.size) - Number(b.size))
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-1 border border-border px-2 py-1 text-xs"
                    >
                      <span className="text-muted-foreground">{s.size}</span>
                      <input
                        type="number"
                        min={0}
                        defaultValue={s.stock}
                        onBlur={async (e) => {
                          const stock = Number(e.target.value);
                          if (stock === s.stock) return;
                          await setStock({ data: { id: s.id, stock } });
                          await refresh();
                          toast.success("Stock updated");
                        }}
                        className="w-12 bg-transparent text-right outline-none"
                      />
                    </label>
                  ))}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <button
                onClick={() =>
                  setDraft({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    category: p.category as Draft["category"],
                    images: p.images ?? [],
                    is_featured: p.is_featured,
                    is_active: p.is_active,
                    sizes: (p.product_sizes ?? []).map((s) => ({ size: s.size, stock: s.stock })),
                  })
                }
                className="border border-border px-4 py-2 text-xs uppercase tracking-[0.16em] hover:bg-surface-2"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete ${p.name}?`)) return;
                  await del({ data: { id: p.id } });
                  await refresh();
                }}
                className="border border-border px-3 py-2 text-muted-foreground hover:text-primary"
                aria-label="Delete product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProductForm({
  draft,
  onClose,
  onSave,
}: {
  draft: Draft;
  onClose: () => void;
  onSave: (d: Draft) => Promise<void>;
}) {
  const [d, setD] = useState<Draft>(draft);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(d);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not save");
        } finally {
          setBusy(false);
        }
      }}
      className="mt-8 border border-border bg-surface p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl">{d.id ? "Edit product" : "New product"}</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          required
          className={field}
          placeholder="Name"
          value={d.name}
          onChange={(e) => setD({ ...d, name: e.target.value })}
        />
        <input
          required
          type="number"
          min={1}
          className={field}
          placeholder="Price in Ksh"
          value={d.price || ""}
          onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
        />
        <select
          className={field}
          value={d.category}
          onChange={(e) => setD({ ...d, category: e.target.value as Draft["category"] })}
        >
          <option value="unisex">Unisex</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="kids">Kids</option>
        </select>
        <div className="flex items-center gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={d.is_featured}
              onChange={(e) => setD({ ...d, is_featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={d.is_active}
              onChange={(e) => setD({ ...d, is_active: e.target.checked })}
            />
            Visible in shop
          </label>
        </div>
      </div>

      <textarea
        rows={3}
        className={`${field} mt-4 resize-none`}
        placeholder="Description"
        value={d.description}
        onChange={(e) => setD({ ...d, description: e.target.value })}
      />

      <div className="mt-6">
        <span className="eyebrow">Photos</span>
        <div className="mt-3 flex flex-wrap gap-3">
          {d.images.map((src) => (
            <div key={src} className="relative h-24 w-24 overflow-hidden bg-surface-2">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setD({ ...d, images: d.images.filter((i) => i !== src) })}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center bg-background/80"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-24 w-24 place-items-center border border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            <Upload className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              try {
                const urls = await Promise.all(files.map(uploadImage));
                setD((prev) => ({ ...prev, images: [...prev.images, ...urls].slice(0, 8) }));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Upload failed");
              }
            }}
          />
        </div>
      </div>

      <div className="mt-6">
        <span className="eyebrow">Sizes & stock</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {d.sizes.map((s, i) => (
            <div key={i} className="flex items-center gap-1 border border-border px-2 py-1">
              <input
                className="w-12 bg-transparent text-sm outline-none"
                value={s.size}
                onChange={(e) => {
                  const sizes = [...d.sizes];
                  sizes[i] = { ...s, size: e.target.value };
                  setD({ ...d, sizes });
                }}
              />
              <input
                type="number"
                min={0}
                className="w-14 bg-transparent text-right text-sm outline-none"
                value={s.stock}
                onChange={(e) => {
                  const sizes = [...d.sizes];
                  sizes[i] = { ...s, stock: Number(e.target.value) };
                  setD({ ...d, sizes });
                }}
              />
              <button
                type="button"
                onClick={() => setD({ ...d, sizes: d.sizes.filter((_, x) => x !== i) })}
                aria-label="Remove size"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setD({ ...d, sizes: [...d.sizes, { size: "", stock: 1 }] })}
            className="border border-dashed border-border px-3 py-1 text-xs uppercase tracking-[0.16em]"
          >
            Add size
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-8 bg-primary px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}

/* ---------------- Lookbook ---------------- */

function LookbookPanel() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListLookbook);
  const add = useServerFn(adminAddLookbook);
  const del = useServerFn(adminDeleteLookbook);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-lookbook"], queryFn: () => list({}) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-lookbook"] });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div>
      <h1 className="display text-3xl">Style It photos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Styling shots shown on the homepage and the Style It page.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          className={`${field} max-w-xs`}
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground"
        >
          <Upload className="h-4 w-4" /> Upload photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              const url = await uploadImage(file);
              await add({ data: { image_url: url, caption } });
              setCaption("");
              await refresh();
              toast.success("Photo added");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Upload failed");
            }
          }}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(data ?? []).map((p) => (
          <figure key={p.id} className="relative overflow-hidden bg-surface-2">
            <img src={p.image_url} alt={p.caption} className="aspect-[3/4] w-full object-cover" />
            <button
              onClick={async () => {
                await del({ data: { id: p.id } });
                await refresh();
              }}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center bg-background/80"
              aria-label="Delete photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {p.caption && (
              <figcaption className="px-3 py-2 text-xs text-muted-foreground">{p.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsPanel() {
  const get = useServerFn(adminGetSettings);
  const save = useServerFn(adminSaveSettings);
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: () => get({}) });
  const [form, setForm] = useState({ callmebot_phone: "", callmebot_apikey: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary" />;

  return (
    <div className="max-w-lg">
      <h1 className="display text-3xl">WhatsApp order alerts</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Send "I allow callmebot to send me messages" on WhatsApp to +34 644 51 95 23, then paste the
        API key they reply with here together with your WhatsApp number in international format
        (e.g. 254798718785). Every new order will then ping your phone.
      </p>
      <div className="mt-6 space-y-4">
        <input
          className={field}
          placeholder="WhatsApp number e.g. 254798718785"
          value={form.callmebot_phone}
          onChange={(e) => setForm({ ...form, callmebot_phone: e.target.value })}
        />
        <input
          className={field}
          placeholder="CallMeBot API key"
          value={form.callmebot_apikey}
          onChange={(e) => setForm({ ...form, callmebot_apikey: e.target.value })}
        />
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await save({ data: form });
              toast.success("Alert settings saved");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save");
            } finally {
              setBusy(false);
            }
          }}
          className="bg-primary px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
