-- ==============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE CONTRASEÑAS (Fijado a 'aaron123')

UPDATE users
SET password_hash = '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6'
WHERE email IN (
    'admin@gymsync.com', 
    'gerente@smartfit.com', 
    'ana@ejemplo.com', 
    'carlos@ejemplo.com'
);


