-- ============================================================
-- ACTUALIZACIONES — Ejecutar en Supabase SQL Editor
-- (después de haber ejecutado setup.sql)
-- ============================================================


-- ============================================================
-- 1. TELÉFONO ÚNICO en profiles
-- ============================================================
-- Agregar constraint de unicidad al teléfono
-- (ignorar si ya existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_phone_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
  END IF;
END $$;


-- ============================================================
-- 2. TRIGGER: Bajar stock al CONFIRMAR un pedido
-- ============================================================
-- Se dispara cuando el estado de un pedido cambia a 'confirmado'
-- Descuenta el stock de cada producto en order_items

CREATE OR REPLACE FUNCTION public.handle_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actuar cuando cambia A 'confirmado' desde otro estado
  IF NEW.status = 'confirmado' AND OLD.status != 'confirmado' THEN
    -- Descontar stock de cada producto del pedido
    UPDATE public.products p
    SET
      stock      = p.stock - oi.quantity,
      updated_at = NOW()
    FROM public.order_items oi
    WHERE oi.order_id  = NEW.id
      AND oi.product_id = p.id
      AND p.active      = true;

    -- Desactivar productos que quedaron sin stock
    UPDATE public.products
    SET
      active     = false,
      updated_at = NOW()
    WHERE stock <= 0
      AND active = true;
  END IF;

  -- Si el pedido se CANCELA después de haber sido confirmado → devolver stock
  IF NEW.status = 'cancelado' AND OLD.status = 'confirmado' THEN
    UPDATE public.products p
    SET
      stock      = p.stock + oi.quantity,
      active     = true,
      updated_at = NOW()
    FROM public.order_items oi
    WHERE oi.order_id  = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger (reemplazar si ya existe)
DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;

CREATE TRIGGER on_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_confirmed();


-- ============================================================
-- VERIFICAR
-- ============================================================
SELECT 'Trigger de stock creado OK' AS status;
SELECT 'Unicidad de teléfono OK'    AS status;
