import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireAdmin } from './auth.middleware';

// ─── Orders ──────────────────────────────────────────────────

export const checkAdmin = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => {
    return { isAdmin: true };
  });

export const adminListOrders = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => {
    const sql = (await import('./db')).default;

    const rows = await sql`
      SELECT
        o.id, o.order_code, o.customer_name, o.phone,
        o.delivery_method, o.address, o.notes, o.total, o.status, o.created_at,
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'size', oi.size,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price
          ) ORDER BY oi.id),
          '[]'
        ) AS order_items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 200
    `;

    return rows as unknown as {
      id: string;
      order_code: string;
      customer_name: string;
      phone: string;
      delivery_method: string;
      address: string | null;
      notes: string | null;
      total: number;
      status: string;
      created_at: string;
      order_items: { id: string; product_name: string; size: string; quantity: number; unit_price: number }[];
    }[];
  });

export const adminSetOrderStatus = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), status: z.enum(['new', 'processing', 'fulfilled']) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;
    await sql`UPDATE orders SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true };
  });

// ─── Products ────────────────────────────────────────────────

export const adminListProducts = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => {
    const sql = (await import('./db')).default;

    const rows = await sql`
      SELECT
        p.id, p.name, p.slug, p.description, p.price, p.category,
        p.images, p.is_featured, p.is_active,
        COALESCE(
          json_agg(json_build_object(
            'id', ps.id, 'size', ps.size, 'stock', ps.stock
          ) ORDER BY ps.size::numeric NULLS LAST)
          FILTER (WHERE ps.id IS NOT NULL),
          '[]'
        ) AS product_sizes
      FROM products p
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    return rows as unknown as {
      id: string;
      name: string;
      slug: string;
      description: string;
      price: number;
      category: string;
      images: string[];
      is_featured: boolean;
      is_active: boolean;
      product_sizes: { id: string; size: string; stock: number }[];
    }[];
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1200).default(''),
  price: z.number().int().min(1).max(10_000_000),
  category: z.enum(['men', 'women', 'unisex', 'kids']),
  images: z.array(z.string().trim().min(1).max(500)).max(8).default([]),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sizes: z
    .array(z.object({ size: z.string().trim().min(1).max(10), stock: z.number().int().min(0).max(999) }))
    .max(40)
    .default([]),
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || `product-${Date.now()}`
  );
}

export const adminSaveProduct = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) => productSchema.parse(input))
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;

    let productId = data.id;

    if (productId) {
      await sql`
        UPDATE products SET
          name = ${data.name},
          description = ${data.description},
          price = ${data.price},
          category = ${data.category},
          images = ${sql.array(data.images)},
          is_featured = ${data.is_featured},
          is_active = ${data.is_active},
          updated_at = now()
        WHERE id = ${productId}
      `;
    } else {
      const slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const [row] = await sql`
        INSERT INTO products (name, slug, description, price, category, images, is_featured, is_active)
        VALUES (${data.name}, ${slug}, ${data.description}, ${data.price}, ${data.category},
                ${sql.array(data.images)}, ${data.is_featured}, ${data.is_active})
        RETURNING id
      `;
      productId = String(row.id);
    }

    await sql`DELETE FROM product_sizes WHERE product_id = ${productId}`;
    if (data.sizes.length > 0) {
      await sql`
        INSERT INTO product_sizes (product_id, size, stock)
        SELECT ${productId}, size, stock FROM json_to_recordset(${JSON.stringify(data.sizes)}::json)
          AS t(size text, stock int)
      `;
    }

    return { id: productId! };
  });

export const adminDeleteProduct = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;
    await sql`DELETE FROM products WHERE id = ${data.id}`;
    return { ok: true };
  });

export const adminSetStock = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), stock: z.number().int().min(0).max(999) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;
    await sql`UPDATE product_sizes SET stock = ${data.stock} WHERE id = ${data.id}`;
    return { ok: true };
  });

// ─── Lookbook ────────────────────────────────────────────────

export const adminListLookbook = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => {
    const sql = (await import('./db')).default;
    const rows = await sql`
      SELECT id, image_url, caption, sort_order
      FROM lookbook_photos ORDER BY sort_order ASC
    `;
    return rows as { id: string; image_url: string; caption: string; sort_order: number }[];
  });

export const adminAddLookbook = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        image_url: z.string().trim().min(1).max(500),
        caption: z.string().trim().max(160).default(''),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;
    await sql`
      INSERT INTO lookbook_photos (image_url, caption, sort_order)
      VALUES (${data.image_url}, ${data.caption}, ${Math.floor(Date.now() / 1000)})
    `;
    return { ok: true };
  });

export const adminDeleteLookbook = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;
    await sql`DELETE FROM lookbook_photos WHERE id = ${data.id}`;
    return { ok: true };
  });

// ─── Settings ────────────────────────────────────────────────

export const adminGetSettings = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => {
    const sql = (await import('./db')).default;
    const rows = await sql`SELECT key, value FROM settings`;
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      callmebot_phone: (map['callmebot_phone'] as string) ?? '',
      callmebot_apikey: (map['callmebot_apikey'] as string) ?? '',
    };
  });

export const adminSaveSettings = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input) =>
    z
      .object({
        callmebot_phone: z.string().trim().max(30).default(''),
        callmebot_apikey: z.string().trim().max(60).default(''),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;
    await sql`
      INSERT INTO settings (key, value, updated_at) VALUES
        ('callmebot_phone', ${data.callmebot_phone}, now()),
        ('callmebot_apikey', ${data.callmebot_apikey}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
    return { ok: true };
  });
