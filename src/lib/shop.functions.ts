import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type SizeRow = { size: string; stock: number };
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  is_featured: boolean;
  sizes: SizeRow[];
};

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const SELECT = "id,name,slug,description,price,category,images,is_featured,product_sizes(size,stock)";

type RawProduct = Omit<Product, "sizes"> & { product_sizes: SizeRow[] };

function shape(rows: RawProduct[] | null): Product[] {
  return (rows ?? []).map((r) => {
    const { product_sizes, ...rest } = r;
    return {
      ...rest,
      sizes: [...(product_sizes ?? [])].sort((a, b) => Number(a.size) - Number(b.size)),
    };
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return shape(data as unknown as RawProduct[]);
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await publicClient()
      .from("products")
      .select(SELECT)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .limit(1);
    if (error) throw new Error(error.message);
    return shape(rows as unknown as RawProduct[])[0] ?? null;
  });

export const listLookbook = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("lookbook_photos")
    .select("id,image_url,caption")
    .order("sort_order", { ascending: true })
    .limit(12);
  if (error) throw new Error(error.message);
  return data ?? [];
});

const orderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  address: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(300).optional().default(""),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        size: z.string().min(1).max(10),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: result, error } = await publicClient().rpc("place_order", {
      p_name: data.name,
      p_phone: data.phone,
      p_delivery_method: data.deliveryMethod,
      p_address: data.address,
      p_notes: data.notes,
      p_items: data.items,
    });
    if (error) throw new Error(error.message);
    const row = (result as unknown as { order_code: string; total: number }[])[0]!;

    // Fire-and-forget WhatsApp alert to the shop owner via CallMeBot.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: settings } = await supabaseAdmin
        .from("settings")
        .select("key,value")
        .in("key", ["callmebot_phone", "callmebot_apikey"]);
      const map = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
      const phone = (map["callmebot_phone"] ?? "").replace(/[^\d]/g, "");
      const apikey = map["callmebot_apikey"] ?? "";
      if (phone && apikey) {
        const lines = data.items.map((i) => `${i.quantity} x size ${i.size}`).join(", ");
        const text =
          `NEW ORDER ${row.order_code}\n` +
          `Name: ${data.name}\nPhone: ${data.phone}\n` +
          `${data.deliveryMethod === "pickup" ? "Pickup at Platinum Plaza" : `Delivery: ${data.address}`}\n` +
          `Items: ${lines}\nTotal: Ksh ${row.total.toLocaleString("en-KE")}`;
        await fetch(
          `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`,
        );
      }
    } catch (notifyError) {
      console.error("CallMeBot notification failed", notifyError);
    }

    return { orderCode: row.order_code, total: row.total };
  });
