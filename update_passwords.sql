-- ==============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE CONTRASEÑAS (Fijado a 'aaron123')
-- ==============================================================================
-- Problema: El backend (Bcrypt.adapter / AuthService) está rechazando hashes
-- de la versión $2a$ (antigua/insegura en algunas librerías estrictas) y 
-- requiere la versión $2b$ (estándar actual en Node.js).
--
-- Solución: Reemplazamos todos los hashes por el generado para Aarón.
-- ==============================================================================

UPDATE users
SET password_hash = '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6'
WHERE email IN (
    'admin@gymsync.com', 
    'gerente@smartfit.com', 
    'ana@ejemplo.com', 
    'carlos@ejemplo.com'
);

-- Verificar que los cambios se aplicaron:
-- SELECT email, password_hash FROM users;
