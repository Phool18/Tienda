-- ============================================================
-- TIENDA DE POSTRES — setup.sql
-- Ejecutar UNA SOLA VEZ en Supabase → SQL Editor
-- ============================================================


-- ============================================================
-- 1. TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT          NOT NULL,
  phone       TEXT UNIQUE,
  role        TEXT          NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock       INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  category    TEXT,
  active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT          NOT NULL DEFAULT 'pendiente'
              CHECK (status IN ('pendiente','confirmado','entregado','cancelado')),
  total       NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID          NOT NULL REFERENCES public.products(id),
  quantity    INT           NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_active     ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_category   ON public.products(category);


-- ============================================================
-- 2. TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();




-- ============================================================
-- 3. TRIGGER: Bajar stock al CONFIRMAR un pedido
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Bajar stock cuando cambia A 'confirmado'
  IF NEW.status = 'confirmado' AND OLD.status != 'confirmado' THEN
    UPDATE public.products p
    SET
      stock      = p.stock - oi.quantity,
      updated_at = NOW()
    FROM public.order_items oi
    WHERE oi.order_id   = NEW.id
      AND oi.product_id = p.id
      AND p.active      = true;

    -- Desactivar productos sin stock
    UPDATE public.products
    SET active = false, updated_at = NOW()
    WHERE stock <= 0 AND active = true;
  END IF;

  -- Devolver stock si se cancela un pedido confirmado
  IF NEW.status = 'cancelado' AND OLD.status = 'confirmado' THEN
    UPDATE public.products p
    SET
      stock      = p.stock + oi.quantity,
      active     = true,
      updated_at = NOW()
    FROM public.order_items oi
    WHERE oi.order_id   = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;
CREATE TRIGGER on_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_confirmed();

-- ============================================================
-- 4. FUNCIÓN para obtener rol del usuario
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "profiles_select"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_trigger" ON public.profiles;
DROP POLICY IF EXISTS "products_select"         ON public.products;
DROP POLICY IF EXISTS "products_insert"         ON public.products;
DROP POLICY IF EXISTS "products_update"         ON public.products;
DROP POLICY IF EXISTS "products_delete"         ON public.products;
DROP POLICY IF EXISTS "orders_select"           ON public.orders;
DROP POLICY IF EXISTS "orders_insert"           ON public.orders;
DROP POLICY IF EXISTS "orders_update"           ON public.orders;
DROP POLICY IF EXISTS "order_items_select"      ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert"      ON public.order_items;

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.get_user_role() = 'ADMIN');

CREATE POLICY "profiles_insert_trigger" ON public.profiles
  FOR INSERT WITH CHECK (true); -- el trigger usa SECURITY DEFINER, necesita permiso

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- PRODUCTS
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (active = true OR public.get_user_role() = 'ADMIN');

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (public.get_user_role() = 'ADMIN');

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (public.get_user_role() = 'ADMIN');

-- ORDERS
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (public.get_user_role() = 'ADMIN');

-- ORDER ITEMS
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR public.get_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );


-- ============================================================
-- 6. PRODUCTOS DE POSTRES
-- ============================================================

INSERT INTO public.products (name, description, price, stock, category, active) VALUES
('Torta de Chocolate',      'Húmeda torta de 3 pisos con ganache de chocolate amargo y fresas frescas.',      65.00, 8,  'Tortas',     true),
('Torta Red Velvet',        'Clásica red velvet con frosting de queso crema, decorada con rosas de azúcar.',  70.00, 6,  'Tortas',     true),
('Torta de Vainilla',       'Esponjosa torta de vainilla con buttercream de fresa y sprinkles de colores.',   55.00, 10, 'Tortas',     true),
('Cupcakes x6 Chocolate',   'Caja de 6 cupcakes de chocolate con frosting de buttercream colorido.',          28.00, 15, 'Cupcakes',   true),
('Cupcakes x6 Vainilla',    'Caja de 6 cupcakes de vainilla con cobertura pastel y decoraciones.',            25.00, 20, 'Cupcakes',   true),
('Macarons x12',            'Caja de 12 macarons franceses: fresa, pistacho, limón y chocolate.',             45.00, 12, 'Macarons',   true),
('Cheesecake de Frutos',    'Cheesecake cremoso con coulis de frutos rojos y base de galleta.',               38.00, 7,  'Pasteles',   true),
('Brownie con Nueces',      'Brownie fudgy de chocolate amargo con nueces tostadas. Porción individual.',     12.00, 25, 'Brownies',   true),
('Caja Brownies x4',        'Cuatro brownies artesanales: chocolate, nutella, oreo y caramelo salado.',       42.00, 15, 'Brownies',   true),
('Galletas Decoradas x6',   'Galletas de mantequilla decoradas a mano con glasé real.',                       22.00, 18, 'Galletas',   true),
('Donas Glaseadas x4',      'Cuatro donas esponjosas con glaseado de colores y toppings variados.',           20.00, 20, 'Donas',      true),
('Tiramisú Personal',       'Clásico tiramisú italiano con mascarpone, café y cacao. Porción individual.',    18.00, 10, 'Pasteles',   true),
('Mousse de Maracuyá',      'Delicado mousse de maracuyá con base de bizcocho y decoración de fruta fresca.', 22.00, 12, 'Pasteles',   true),
('Paletas de Chocolate x4', 'Pack de 4 paletas: oreo, fresa, caramelo y menta con chocolate belga.',         32.00, 15, 'Chocolates', true),
('Caja Sorpresa Pastel',    'Caja mixta con selección del día: cupcakes, brownies y galletas decoradas.',     55.00, 8,  'Especiales', true);


-- ============================================================
-- 7. CREAR ADMIN
-- ============================================================
-- PASO 1: Ve a Authentication → Users → Add user → Create new user
--         Email: admin@tienda.com  |  Password: admin123
--
-- PASO 2: Ejecuta esto (en una nueva query):
--
-- UPDATE public.profiles SET role = 'ADMIN'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@tienda.com');


-- ============================================================
-- VERIFICAR que todo quedó bien
-- ============================================================
SELECT 'Tablas OK' AS status;
SELECT COUNT(*) AS total_productos FROM public.products;
