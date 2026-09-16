-- =============================================================
-- Prime Kicks — full schema (plain PostgreSQL, no Supabase extensions)
-- Run once against a fresh database.
-- =============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ------------------------------------------------------------
-- USERS  (custom auth — no Supabase auth.users dependency)
-- ------------------------------------------------------------
CREATE TABLE public.users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_admin      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE public.products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price       integer NOT NULL CHECK (price >= 0),
  category    text NOT NULL DEFAULT 'unisex',
  images      text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_sizes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       text NOT NULL,
  stock      integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, size)
);

-- ------------------------------------------------------------
-- LOOKBOOK
-- ------------------------------------------------------------
CREATE TABLE public.lookbook_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  text NOT NULL,
  caption    text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
CREATE TABLE public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code      text NOT NULL UNIQUE DEFAULT ('PK-' || upper(substr(md5(random()::text), 1, 6))),
  customer_name   text NOT NULL,
  phone           text NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('pickup', 'delivery')),
  address         text,
  notes           text,
  total           integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'processing', 'fulfilled', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  size         text NOT NULL,
  quantity     integer NOT NULL CHECK (quantity > 0),
  unit_price   integer NOT NULL
);

-- ------------------------------------------------------------
-- SETTINGS  (key-value store for owner config)
-- ------------------------------------------------------------
CREATE TABLE public.settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.settings (key, value) VALUES
  ('callmebot_phone', ''),
  ('callmebot_apikey', '');

-- ------------------------------------------------------------
-- CHECKOUT  (atomic order placement with stock decrement)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order(
  p_name            text,
  p_phone           text,
  p_delivery_method text,
  p_address         text,
  p_notes           text,
  p_items           jsonb
) RETURNS TABLE (order_id uuid, order_code text, total integer)
LANGUAGE plpgsql AS $$
DECLARE
  v_order_id uuid;
  v_code     text;
  v_total    integer := 0;
  it         jsonb;
  v_product  public.products%ROWTYPE;
  v_qty      integer;
  v_size     text;
  v_updated  integer;
BEGIN
  IF length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Please enter your name';
  END IF;
  IF length(trim(p_phone)) < 9 THEN
    RAISE EXCEPTION 'Please enter a valid phone number';
  END IF;
  IF p_delivery_method NOT IN ('pickup', 'delivery') THEN
    RAISE EXCEPTION 'Invalid delivery method';
  END IF;
  IF p_delivery_method = 'delivery' AND coalesce(length(trim(p_address)), 0) < 4 THEN
    RAISE EXCEPTION 'Please enter a delivery address';
  END IF;
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  INSERT INTO public.orders (customer_name, phone, delivery_method, address, notes, total)
  VALUES (
    trim(p_name),
    trim(p_phone),
    p_delivery_method,
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_notes,  '')), ''),
    0
  )
  RETURNING id, public.orders.order_code INTO v_order_id, v_code;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty  := greatest(1, least(20, (it->>'quantity')::int));
    v_size := it->>'size';

    SELECT * INTO v_product
      FROM public.products
      WHERE id = (it->>'product_id')::uuid AND is_active;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in your cart is no longer available';
    END IF;

    UPDATE public.product_sizes
      SET stock = stock - v_qty
      WHERE product_id = v_product.id AND size = v_size AND stock >= v_qty;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RAISE EXCEPTION 'Sorry, % (size %) is out of stock', v_product.name, v_size;
    END IF;

    INSERT INTO public.order_items
      (order_id, product_id, product_name, size, quantity, unit_price)
    VALUES
      (v_order_id, v_product.id, v_product.name, v_size, v_qty, v_product.price);

    v_total := v_total + v_qty * v_product.price;
  END LOOP;

  UPDATE public.orders SET total = v_total WHERE id = v_order_id;
  RETURN QUERY SELECT v_order_id, v_code, v_total;
END;
$$;

-- ------------------------------------------------------------
-- SEED DATA
-- ------------------------------------------------------------
WITH p AS (
  INSERT INTO public.products
    (name, slug, description, price, category, images, is_featured)
  VALUES
    ('Puma Super GT Black & Gold',    'puma-super-gt-black-gold',       'A clean black leather silhouette lifted by metallic gold detailing. Understated until you look twice — built for nights out and everyday flex.',      3800, 'men',    ARRAY['/images/p-puma-super-gt.jpg'], true),
    ('Nike Air Max Kids',             'nike-air-max-kids',              'Crisp red and white air-cushioned kicks for the little ones. Sizes 25-36, light, durable and playground approved.',                                   1999, 'kids',   ARRAY['/images/p-kids-airmax.jpg'],   true),
    ('New Balance 530 Blue & White',  'new-balance-530-blue-white',     'Retro runner energy in soft blue suede and white mesh. The easiest everyday pair in the lineup.',                                                      2600, 'unisex', ARRAY['/images/p-nb-530.jpg'],        true),
    ('New Balance 1000 Purple',       'new-balance-1000-purple',        'Chunky, futuristic and unapologetically loud. Purple and grey panelling with a sculpted sole.',                                                        3700, 'unisex', ARRAY['/images/p-nb-1000.jpg'],       false),
    ('Nike Portal',                   'nike-portal',                    'Minimal white leather with grey accents. The one pair that goes with absolutely everything.',                                                           3200, 'unisex', ARRAY['/images/p-nike-portal.jpg'],   true),
    ('Black & Red Statement Sneakers','black-red-statement-sneakers',   'Versace-inspired black and red chunky sole. Pure presence — the Prime Kicks signature pair.',                                                          2500, 'unisex', ARRAY['/images/p-black-red.jpg'],     true)
  RETURNING id, slug
)
INSERT INTO public.product_sizes (product_id, size, stock)
SELECT p.id, s.size, s.stock FROM p
JOIN LATERAL (
  SELECT * FROM (VALUES
    ('puma-super-gt-black-gold',    '39', 3), ('puma-super-gt-black-gold',    '40', 4), ('puma-super-gt-black-gold',    '41', 5), ('puma-super-gt-black-gold',    '42', 4), ('puma-super-gt-black-gold',    '43', 2),
    ('nike-air-max-kids',           '25', 4), ('nike-air-max-kids',           '28', 5), ('nike-air-max-kids',           '30', 5), ('nike-air-max-kids',           '32', 4), ('nike-air-max-kids',           '34', 3), ('nike-air-max-kids', '36', 3),
    ('new-balance-530-blue-white',  '38', 2), ('new-balance-530-blue-white',  '39', 4), ('new-balance-530-blue-white',  '40', 4), ('new-balance-530-blue-white',  '41', 3), ('new-balance-530-blue-white',  '42', 3),
    ('new-balance-1000-purple',     '39', 2), ('new-balance-1000-purple',     '40', 3), ('new-balance-1000-purple',     '41', 3), ('new-balance-1000-purple',     '42', 2),
    ('nike-portal',                 '39', 3), ('nike-portal',                 '40', 5), ('nike-portal',                 '41', 5), ('nike-portal',                 '42', 4), ('nike-portal',                 '43', 3),
    ('black-red-statement-sneakers','39', 3), ('black-red-statement-sneakers','40', 4), ('black-red-statement-sneakers','41', 4), ('black-red-statement-sneakers','42', 3), ('black-red-statement-sneakers','43', 2)
  ) AS v(slug, size, stock)
) s ON s.slug = p.slug;
