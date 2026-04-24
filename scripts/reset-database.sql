-- ========================================
-- GYMSYNC - RESET DATABASE (EJECUTAR EN DATAGRIP)
-- Limpia TODAS las tablas anteriores y deja el schema listo
-- para que TypeORM cree las 33 tablas nuevas desde cero.
-- ========================================

-- Opción A: Nuclear — Reconstruye el schema completo
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restaurar permisos por defecto de PostgreSQL
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Después de ejecutar esto, reinicia NestJS con:
--   npm run start:dev
-- TypeORM (synchronize: true) creará las 33 tablas automáticamente.
