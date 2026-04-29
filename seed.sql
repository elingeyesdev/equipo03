-- ==========================================
-- SCRIPT DE DATOS DE PRUEBA: GYMSYNC (CORE)
-- Ejecutar en DataGrip
-- ==========================================

-- 1. Insertar 5 Gimnasios (Sedes)
INSERT INTO gyms (id, name, description, max_capacity, is_active, is_open, created_at, updated_at) VALUES
(1, 'Smart Fit Las Brisas', 'Gimnasio moderno con equipos de última generación.', 200, true, true, NOW(), NOW()),
(2, 'Premier Fitness Club', 'Club premium con piscina y sauna.', 150, true, true, NOW(), NOW()),
(3, 'Bio Fitness Busch', 'Enfocado en salud y clases grupales.', 120, true, true, NOW(), NOW()),
(4, 'Reyes Gym', 'Especializado en artes marciales y boxeo.', 80, true, true, NOW(), NOW()),
(5, 'Body Masters', 'Centro de alto rendimiento y crossfit.', 100, true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Reiniciar la secuencia de gyms (para evitar errores si insertas por app luego)
SELECT setval('gyms_id_seq', (SELECT MAX(id) FROM gyms));

-- 2. Insertar Ubicaciones (Gym Locations)
INSERT INTO gym_location (id, gym_id, address, city, latitude, longitude) VALUES
(1, 1, '4to Anillo y Av. Banzer, Las Brisas', 'Santa Cruz', -17.75540000, -63.16620000),
(2, 2, 'Equipetrol, Calle Enrique Finot', 'Santa Cruz', -17.76340000, -63.19620000),
(3, 3, 'Av. Busch y 2do Anillo', 'Santa Cruz', -17.77560000, -63.18870000),
(4, 4, 'Av. Melchor Pinto #355', 'Santa Cruz', -17.78120000, -63.17110000),
(5, 5, 'Av. Argentina #150', 'Santa Cruz', -17.79420000, -63.16660000)
ON CONFLICT (id) DO NOTHING;

SELECT setval('gym_location_id_seq', (SELECT MAX(id) FROM gym_location));

-- 3. Insertar Horarios (gym_schedules)
-- El esquema usa "gym_schedules" con "opens_at" y "closes_at". "day_of_week" es VARCHAR.
-- Usaremos '1', '2', etc. para que la App Móvil (que usa un array [0=domingo, 1=lunes...]) lo parsee correctamente.
INSERT INTO gym_schedules (gym_id, day_of_week, opens_at, closes_at) VALUES
(1, '1', '05:00:00', '23:00:00'),
(1, '2', '05:00:00', '23:00:00'),
(2, '1', '06:00:00', '22:00:00'),
(3, '1', '06:00:00', '22:00:00'),
(4, '1', '07:00:00', '21:00:00'),
(5, '1', '05:00:00', '23:00:00')
ON CONFLICT DO NOTHING;

-- Opcional: Insertar un usuario y un rol para que no esté vacío
INSERT INTO users (id, email, password_hash) VALUES 
(1, 'admin@gymsync.com', 'hash_falso_123') 
ON CONFLICT (id) DO NOTHING;
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO roles (id, name, description, hierarchy_level) VALUES 
(1, 'ADMIN', 'Administrador Global', 100) 
ON CONFLICT (id) DO NOTHING;
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
