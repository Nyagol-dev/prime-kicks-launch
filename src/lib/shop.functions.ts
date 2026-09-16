import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

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

// ─── Public product queries ───────────────────────────────────

export const listProducts = createServerFn({ method: 'GET' }).handler(async () => {
  const sql = (await import('./db')).default;

  const rows = await sql`
    SELECT
      p.id, p.name, p.slug, p.description, p.price, p.category,
      p.images, p.is_featured,
      COALESCE(
        json_agg(json_build_object('size', ps.size, 'stock', ps.stock)
          ORDER BY ps.size::numeric NULLS LAST)
        FILTER (WHERE ps.id IS NOT NULL),
        '[]'
      ) AS sizes
    FROM products p
    LEFT JOIN product_sizes ps ON ps.product_id = p.id
    WHERE p.is_active = true
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `;

  return rows as unknown as Product[];
});

export const getProduct = createServerFn({ method: 'GET' })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;

    const rows = await sql`
      SELECT
        p.id, p.name, p.slug, p.description, p.price, p.category,
        p.images, p.is_featured,
        COALESCE(
          json_agg(json_build_object('size', ps.size, 'stock', ps.stock)
            ORDER BY ps.size::numeric NULLS LAST)
          FILTER (WHERE ps.id IS NOT NULL),
          '[]'
        ) AS sizes
      FROM products p
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      WHERE p.slug = ${data.slug} AND p.is_active = true
      GROUP BY p.id
      LIMIT 1
    `;

    return (rows[0] ?? null) as Product | null;
  });

// ─── Lookbook ────────────────────────────────────────────────

export const listLookbook = createServerFn({ method: 'GET' }).handler(async () => {
  const sql = (await import('./db')).default;

  const rows = await sql`
    SELECT id, image_url, caption
    FROM lookbook_photos
    ORDER BY sort_order ASC
    LIMIT 12
  `;

  return rows as { id: string; image_url: string; caption: string }[];
});

// ─── Checkout ────────────────────────────────────────────────

const orderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  address: z.string().trim().max(300).optional().default(''),
  notes: z.string().trim().max(300).optional().default(''),
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

export const placeOrder = createServerFn({ method: 'POST' })
  .inputValidator((input) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    const sql = (await import('./db')).default;

    // Delegate to the stored procedure which handles stock decrement atomically
    const result = await sql`
      SELECT * FROM place_order(
        ${data.name},
        ${data.phone},
        ${data.deliveryMethod},
        ${data.address || null},
        ${data.notes || null},
        ${JSON.stringify(data.items)}::jsonb
      )
    `;

    const row = result[0] as { order_code: string; total: number };

    // Fire-and-forget WhatsApp alert via CallMeBot
    try {
      const [phoneRow] = await sql`SELECT value FROM settings WHERE key = 'callmebot_phone'`;
      const [keyRow] = await sql`SELECT value FROM settings WHERE key = 'callmebot_apikey'`;
      const phone = (phoneRow?.value ?? '').replace(/\D/g, '');
      const apikey = keyRow?.value ?? '';
      if (phone && apikey) {
        const lines = data.items.map((i) => `${i.quantity} x size ${i.size}`).join(', ');
        const text =
          `NEW ORDER ${row.order_code}\n` +
          `Name: ${data.name}\nPhone: ${data.phone}\n` +
          `${data.deliveryMethod === 'pickup' ? 'Pickup at Platinum Plaza' : `Delivery: ${data.address}`}\n` +
          `Items: ${lines}\nTotal: Ksh ${row.total.toLocaleString('en-KE')}`;
        await fetch(
          `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`,
        );
      }
    } catch (notifyError) {
      console.error('CallMeBot notification failed', notifyError);
    }

    return { orderCode: row.order_code, total: row.total };
  });
