-- ==============================================================================
-- GYMSYNC PRO - DATABASE SEED SCRIPT (PostgreSQL) - ALIGNED TO FINAL SCHEMA
-- ==============================================================================

-- Limpiar datos previos
TRUNCATE TABLE check_ins CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE gym_location CASCADE;
TRUNCATE TABLE gyms CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE users CASCADE;

-- 1. Insertar Roles
INSERT INTO roles (id, name, hierarchy_level, is_system_role) VALUES 
(1, 'SUPER_ADMIN', 10, true),
(2, 'GERENTE', 5, true),
(3, 'USER', 1, false);

-- 2. Insertar Gimnasios
INSERT INTO gyms (id, name, description, max_capacity) VALUES 
(1, 'Smart Fit', 'Gimnasio de alta tecnología en Santa Cruz', 200),
(2, 'Premier', 'Exclusividad y confort en Equipetrol', 150),
(3, 'Bio Fitness', 'Enfoque en salud integral', 100),
(4, 'Reyes Gym', 'Entrenamiento de alto rendimiento', 80),
(5, 'Megatlon', 'Espacio amplio y variado', 300);

-- 3. Insertar Ubicaciones de Gimnasios (Normalización)
INSERT INTO gym_location (gym_id, address, city, latitude, longitude) VALUES 
(1, 'Av. Banzer 4to Anillo', 'Santa Cruz', -17.750000, -63.170000),
(2, 'Equipetrol Norte', 'Santa Cruz', -17.760000, -63.180000),
(3, 'Doble Vía a La Guardia', 'Santa Cruz', -17.800000, -63.190000),
(4, 'Plan 3000', 'Santa Cruz', -17.810000, -63.150000),
(5, 'Av. Cristo Redentor', 'Santa Cruz', -17.730000, -63.160000);

-- 4. Insertar Usuarios
INSERT INTO users (id, email, password_hash) VALUES 
(99, 'admin@gymsync.com', '$2b$10$brwOuyJMK3wAtuAhwhPOMu7/x5SHWZF30pgiWv52C2j2CNYL7dNKi'),
(100, 'gerente@smartfit.com', '$2b$10$brwOuyJMK3wAtuAhwhPOMu7/x5SHWZF30pgiWv52C2j2CNYL7dNKi'),
(1, 'ana@ejemplo.com', '$2b$10$brwOuyJMK3wAtuAhwhPOMu7/x5SHWZF30pgiWv52C2j2CNYL7dNKi'),
(2, 'carlos@ejemplo.com', '$2b$10$brwOuyJMK3wAtuAhwhPOMu7/x5SHWZF30pgiWv52C2j2CNYL7dNKi');

-- 5. Insertar Perfiles de Usuario (first_name, last_name)
INSERT INTO user_profiles (user_id, first_name, last_name, gender) VALUES 
(99, 'Admin', 'Global', 'Other'),
(100, 'Gerente', 'SmartFit', 'Male'),
(1, 'Ana', 'García', 'Female'),
(2, 'Carlos', 'Ruiz', 'Male');

-- 6. Asignar Roles
INSERT INTO user_roles (user_id, role_id, gym_id) VALUES 
(99, 1, NULL),
(100, 2, 1),
(1, 3, NULL),
(2, 3, NULL);

-- 7. Insertar 50 Check-ins (Historial de Auditoría)
DO $$ 
DECLARE
  v_gym_id INT;
  v_user_id INT;
  v_status VARCHAR(20);
  i INT;
BEGIN
  FOR i IN 1..50 LOOP
    v_gym_id := floor(random() * 5) + 1;
    v_user_id := floor(random() * 2) + 1;
    IF random() > 0.1 THEN v_status := 'COMPLETED'; ELSE v_status := 'DENIED'; END IF;

    INSERT INTO check_ins (user_id, gym_id, check_in_time, method, status)
    VALUES (v_user_id, v_gym_id, CURRENT_TIMESTAMP - (random() * interval '7 days'), 'QR', v_status);
  END LOOP;
END $$;
