-- =============================================================
-- Prime Kicks — full schema
-- Run once against a fresh Supabase (or local psql) instance.
-- =============================================================

-- ------------------------------------------------------------
-- ROLES
-- ------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Helper: check whether a user holds a given role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Lock down has_role: only service_role may call it directly
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated;

-- First signed-up user automatically becomes admin (the shop owner)
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_bootstrap_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

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

GRANT SELECT                        ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL                            ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products public read"
  ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products admin write"
  ON public.products FOR ALL TO authenticated
  USING     (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.product_sizes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       text NOT NULL,
  stock      integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, size)
);

GRANT SELECT                        ON public.product_sizes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sizes TO authenticated;
GRANT ALL                            ON public.product_sizes TO service_role;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sizes public read"
  ON public.product_sizes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sizes admin write"
  ON public.product_sizes FOR ALL TO authenticated
  USING     (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- LOOKBOOK
-- ------------------------------------------------------------
CREATE TABLE public.lookbook_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   text NOT NULL,
  caption     text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT                        ON public.lookbook_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookbook_photos TO authenticated;
GRANT ALL                            ON public.lookbook_photos TO service_role;
ALTER TABLE public.lookbook_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lookbook public read"
  ON public.lookbook_photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lookbook admin write"
  ON public.lookbook_photos FOR ALL TO authenticated
  USING     (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL             ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders admin read"
  ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin update"
  ON public.orders FOR UPDATE TO authenticated
  USING     (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  size         text NOT NULL,
  quantity     integer NOT NULL CHECK (quantity > 0),
  unit_price   integer NOT NULL
);

GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL    ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order items admin read"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- SETTINGS  (owner-only key/value store)
-- ------------------------------------------------------------
CREATE TABLE public.settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL                    ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings admin all"
  ON public.settings FOR ALL TO authenticated
  USING     (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (key, value)
  VALUES ('callmebot_phone', ''), ('callmebot_apikey', '');

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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

REVOKE ALL ON FUNCTION public.place_order(text, text, text, text, text, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, text, jsonb)
  TO anon, authenticated, service_role;

-- Enable realtime for orders dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ------------------------------------------------------------
-- STORAGE POLICIES  (bucket: shop-images)
-- ------------------------------------------------------------
CREATE POLICY "shop images read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'shop-images');

CREATE POLICY "shop images admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "shop images admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "shop images admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-images' AND public.has_role(auth.uid(), 'admin'));

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
