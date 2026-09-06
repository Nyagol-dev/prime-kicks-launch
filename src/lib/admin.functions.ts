import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
}) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Forbidden");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id,order_code,customer_name,phone,delivery_method,address,notes,total,status,created_at,order_items(id,product_name,size,quantity,unit_price)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["new", "processing", "fulfilled"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("products")
      .select(
        "id,name,slug,description,price,category,images,is_featured,is_active,product_sizes(id,size,stock)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1200).default(""),
  price: z.number().int().min(1).max(10_000_000),
  category: z.enum(["men", "women", "unisex", "kids"]),
  images: z.array(z.string().trim().min(1).max(500)).max(8).default([]),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sizes: z
    .array(z.object({ size: z.string().trim().min(1).max(10), stock: z.number().int().min(0).max(999) }))
    .max(40)
    .default([]),
});

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || `product-${Date.now()}`
  );
}

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const supabase = context.supabase;
    const base = {
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      images: data.images,
      is_featured: data.is_featured,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };

    let productId = data.id;
    if (productId) {
      const { error } = await supabase.from("products").update(base).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: created, error } = await supabase
        .from("products")
        .insert({ ...base, slug })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = created.id;
    }

    await supabase.from("product_sizes").delete().eq("product_id", productId!);
    if (data.sizes.length) {
      const { error } = await supabase
        .from("product_sizes")
        .insert(data.sizes.map((s) => ({ product_id: productId!, size: s.size, stock: s.stock })));
      if (error) throw new Error(error.message);
    }
    return { id: productId! };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), stock: z.number().int().min(0).max(999) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("product_sizes")
      .update({ stock: data.stock })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListLookbook = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("lookbook_photos")
      .select("id,image_url,caption,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminAddLookbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        image_url: z.string().trim().min(1).max(500),
        caption: z.string().trim().max(160).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase.from("lookbook_photos").insert({
      image_url: data.image_url,
      caption: data.caption,
      sort_order: Math.floor(Date.now() / 1000),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteLookbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase.from("lookbook_photos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase.from("settings").select("key,value");
    if (error) throw new Error(error.message);
    const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
    return {
      callmebot_phone: map["callmebot_phone"] ?? "",
      callmebot_apikey: map["callmebot_apikey"] ?? "",
    };
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        callmebot_phone: z.string().trim().max(30).default(""),
        callmebot_apikey: z.string().trim().max(60).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const rows = [
      { key: "callmebot_phone", value: data.callmebot_phone, updated_at: new Date().toISOString() },
      { key: "callmebot_apikey", value: data.callmebot_apikey, updated_at: new Date().toISOString() },
    ];
    const { error } = await context.supabase.from("settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
