-- ==============================================================================
-- MIGRACIÓN SUPABASE: AGREGAR CAMPO 'direccion' A LA TABLA 'pqrs'
-- ==============================================================================
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Entra a tu proyecto -> Sección "SQL Editor"
-- 3. Pega y ejecuta el siguiente script:

ALTER TABLE pqrs ADD COLUMN IF NOT EXISTS direccion TEXT;

COMMENT ON COLUMN pqrs.direccion IS 'Dirección específica del inmueble o lugar donde ocurre la falla o causa reportada por el ciudadano.';
