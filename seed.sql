-- ==========================================
-- SCRIPT DE DATOS DE PRUEBA: GYMSYNC (CORE)
-- Generado para 33 tablas con integridad referencial.
-- ==========================================

-- TRUNCATE TODAS LAS TABLAS Y REINICIAR IDs
TRUNCATE 
system_settings,
users,
user_profiles,
roles,
permissions,
role_permissions,
gyms,
user_roles,
gym_location,
gym_schedules,
gym_activities,
gym_activity_schedules,
gym_activity_attendance,
exercise_catalogs,
routines,
routine_exercises,
user_trainings,
user_training_goals,
user_training_preferences,
user_training_restrictions,
emergency_contacts,
workout_sessions,
workout_sets,
subscription_plans,
user_subscriptions,
subscription_payments,
reservations,
waitlist_entries,
check_ins,
physical_metrics_history,
notification_templates,
notifications,
user_notification_preferences
RESTART IDENTITY CASCADE;

-- ==========================================
-- 1. CONFIGURACIÓN DEL SISTEMA
-- ==========================================
INSERT INTO system_settings (setting_key, setting_value) VALUES
('APP_VERSION', '{"version": "1.0.0"}'),
('MAINTENANCE_MODE', '{"enabled": false}');

-- ==========================================
-- 2. USUARIOS (Password universal: 12345678)
-- ==========================================
INSERT INTO users (id, email, password_hash) VALUES
(1, 'superadmin@gymsync.com', '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6'),
(2, 'gerente@gymsync.com', '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6'),
(3, 'user@gymsync.com', '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6'),
(4, 'entrenador@gymsync.com', '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6'),
(5, 'user2@gymsync.com', '$2b$10$Lc89GmoUEk7rKwF5Q0P2Nunqku0EKwKS0zZnvL8HlJYXlg3v5y9V6');

INSERT INTO user_profiles (user_id, first_name, last_name, date_of_birth) VALUES
(1, 'Super', 'Admin', '1980-01-01'),
(2, 'Gerente', 'Gym', '1985-05-05'),
(3, 'Juan', 'Perez', '1995-10-10'),
(4, 'Carlos', 'Trainer', '1990-08-08'),
(5, 'Maria', 'Gomez', '1998-03-03');

-- ==========================================
-- 3. ROLES Y PERMISOS (RBAC)
-- ==========================================
INSERT INTO roles (id, name, hierarchy_level, is_system_role) VALUES
(1, 'SUPER_ADMIN', 100, true),
(2, 'GERENTE', 80, true),
(3, 'USER', 10, true),
(4, 'ENTRENADOR', 50, true);

INSERT INTO permissions (id, name, resource, action, is_active) VALUES
(1, 'MANAGE_ALL', 'ALL', 'MANAGE', true),
(2, 'MANAGE_GYM', 'GYM', 'MANAGE', true),
(3, 'VIEW_CLASSES', 'CLASSES', 'VIEW', true),
(4, 'TRAIN_USERS', 'TRAINING', 'MANAGE', true);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4);

-- ==========================================
-- 4. GIMNASIOS (SEDES Y UBICACIONES)
-- ==========================================
INSERT INTO gyms (id, name, description, max_capacity, is_active, is_open) VALUES
(1, 'Smart Fit Las Brisas', 'Gimnasio moderno con equipos de última generación.', 200, true, true),
(2, 'Premier Fitness Club', 'Club premium con piscina y sauna.', 150, true, true);

INSERT INTO gym_location (gym_id, address, city, latitude, longitude) VALUES
(1, '4to Anillo y Av. Banzer, Las Brisas', 'Santa Cruz', -17.75540000, -63.16620000),
(2, 'Equipetrol, Calle Enrique Finot', 'Santa Cruz', -17.76340000, -63.19620000);

INSERT INTO gym_schedules (gym_id, day_of_week, opens_at, closes_at, is_holiday) VALUES
(1, '1', '05:00:00', '23:00:00', false),
(1, '2', '05:00:00', '23:00:00', false),
(2, '1', '06:00:00', '22:00:00', false),
(2, '2', '06:00:00', '22:00:00', false);

-- ==========================================
-- 5. ASIGNACIÓN DE ROLES (USER_ROLES)
-- ==========================================
INSERT INTO user_roles (user_id, role_id, gym_id) VALUES
(1, 1, NULL), -- SuperAdmin global
(2, 2, 1),    -- Gerente Gym 1
(3, 3, 1),    -- User Gym 1
(4, 4, 1),    -- Entrenador Gym 1
(5, 3, 2);    -- User Gym 2

-- ==========================================
-- 6. ACTIVIDADES Y CLASES (GYM ACTIVITIES)
-- ==========================================
INSERT INTO gym_activities (id, gym_id, name, description, default_duration_min) VALUES
(1, 1, 'Zumba', 'Clase de baile intenso.', 60),
(2, 1, 'Spinning', 'Ciclismo indoor de alta intensidad.', 45),
(3, 2, 'Yoga', 'Clase relajante para flexibilidad.', 60);

INSERT INTO gym_activity_schedules (id, gym_activity_id, instructor_id, day_of_week, start_time, end_time, max_attendees) VALUES
(1, 1, 4, '1', '18:00:00', '19:00:00', 30),
(2, 2, 4, '2', '07:00:00', '07:45:00', 20),
(3, 3, 4, '1', '19:00:00', '20:00:00', 15);

INSERT INTO gym_activity_attendance (gym_activity_schedule_id, user_id, status) VALUES
(1, 3, 'CONFIRMED'),
(2, 3, 'ATTENDED');

-- ==========================================
-- 7. CATÁLOGO DE EJERCICIOS Y RUTINAS
-- ==========================================
INSERT INTO exercise_catalogs (id, name, muscle_group, difficulty_level, equipment_required) VALUES
(1, 'Sentadilla Libre', 'Piernas', 'INTERMEDIO', 'Barra y Discos'),
(2, 'Press de Banca', 'Pecho', 'INTERMEDIO', 'Banco y Barra'),
(3, 'Dominadas', 'Espalda', 'AVANZADO', 'Barra de Dominadas'),
(4, 'Plancha', 'Core', 'PRINCIPIANTE', 'Ninguno');

INSERT INTO routines (id, name, trainer_id, assigned_user_id, gym_id, difficulty_level, is_template) VALUES
(1, 'Fuerza Total Base', 4, NULL, 1, 'INTERMEDIO', true),
(2, 'Iniciación al Gym', 4, 3, 1, 'PRINCIPIANTE', false);

INSERT INTO routine_exercises (id, routine_id, exercise_id, order_position, sets_recommended, reps_recommended, rest_seconds_between_sets) VALUES
(1, 1, 1, 1, 4, '10-12', 90),
(2, 1, 2, 2, 4, '8-10', 90),
(3, 2, 4, 1, 3, '60 seg', 30);

-- ==========================================
-- 8. ENTRENAMIENTO DE USUARIOS
-- ==========================================
INSERT INTO user_trainings (user_id) VALUES (3), (5);

INSERT INTO user_training_goals (user_training_id, primary_goal, experience_level) VALUES
(1, 'HIPERTROFIA', 'INTERMEDIO'),
(2, 'PERDIDA_DE_PESO', 'PRINCIPIANTE');

INSERT INTO user_training_preferences (user_training_id, preferred_training_types, available_days_per_week) VALUES
(1, '["PESAS", "FUNCIONAL"]', 4),
(2, '["CARDIO", "ZUMBA"]', 3);

INSERT INTO user_training_restrictions (user_id, restriction_type) VALUES
(3, 'NINGUNA');

INSERT INTO emergency_contacts (user_id, full_name, relationship, phone_number, is_primary) VALUES
(3, 'Madre Perez', 'MADRE', '77777777', true);

INSERT INTO workout_sessions (id, routine_id, user_id, gym_id, status) VALUES
(1, 2, 3, 1, 'COMPLETED'),
(2, 1, 3, 1, 'IN_PROGRESS');

INSERT INTO workout_sets (session_id, routine_exercise_id, set_number, reps_completed, weight_used_kg) VALUES
(1, 3, 1, 1, 0),
(1, 3, 2, 1, 0);

-- ==========================================
-- 9. SUSCRIPCIONES Y PAGOS
-- ==========================================
INSERT INTO subscription_plans (id, name, price_monthly, max_gyms_access) VALUES
(1, 'Plan Básico', 150.00, 1),
(2, 'Plan Pro', 250.00, 5);

INSERT INTO user_subscriptions (id, user_id, plan_id, home_gym_id, status, start_date, end_date) VALUES
(1, 3, 1, 1, 'ACTIVE', '2026-05-01', '2026-06-01'),
(2, 5, 2, 2, 'ACTIVE', '2026-04-15', '2026-05-15');

INSERT INTO subscription_payments (subscription_id, amount, payment_method, status) VALUES
(1, 150.00, 'CARD', 'COMPLETED'),
(2, 250.00, 'CASH', 'COMPLETED');

-- ==========================================
-- 10. RESERVAS Y LISTA DE ESPERA
-- ==========================================
INSERT INTO reservations (id, user_id, gym_activity_schedule_id, reservation_date, status) VALUES
(1, 3, 1, '2026-05-10', 'CONFIRMED'),
(2, 5, 3, '2026-05-12', 'CONFIRMED');

INSERT INTO waitlist_entries (reservation_id, user_id, gym_activity_schedule_id, position_in_queue, status) VALUES
(NULL, 5, 1, 1, 'WAITING');

-- ==========================================
-- 11. AUDITORÍA Y CHECK-INS (Min. 5 históricos)
-- ==========================================
INSERT INTO check_ins (user_id, gym_id, check_in_time, check_out_time, access_method, status) VALUES
(3, 1, '2026-05-01 07:00:00', '2026-05-01 08:30:00', 'QR', 'COMPLETED'),
(3, 1, '2026-05-02 07:15:00', '2026-05-02 08:45:00', 'QR', 'COMPLETED'),
(3, 1, '2026-05-03 07:10:00', '2026-05-03 08:40:00', 'QR', 'COMPLETED'),
(5, 2, '2026-05-01 18:00:00', '2026-05-01 19:30:00', 'BIOMETRIC', 'COMPLETED'),
(5, 2, '2026-05-03 18:15:00', '2026-05-03 19:45:00', 'BIOMETRIC', 'COMPLETED');

-- ==========================================
-- 12. MÉTRICAS FÍSICAS
-- ==========================================
INSERT INTO physical_metrics_history (user_id, gym_id, weight_kg, body_fat_percentage) VALUES
(3, 1, 75.5, 18.0),
(3, 1, 74.0, 17.5);

-- ==========================================
-- 13. NOTIFICACIONES
-- ==========================================
INSERT INTO notification_templates (id, code, title_template, body_template) VALUES
(1, 'WELCOME', 'Bienvenido a GymSync', 'Hola {{name}}, gracias por registrarte.');

INSERT INTO notifications (user_id, template_id, title, body, status) VALUES
(3, 1, 'Bienvenido a GymSync', 'Hola Juan, gracias por registrarte.', 'SENT'),
(5, 1, 'Bienvenido a GymSync', 'Hola Maria, gracias por registrarte.', 'SENT');

INSERT INTO user_notification_preferences (user_id, enable_push, promotional_content) VALUES
(3, true, false),
(5, true, true);

-- FINALIZADO: Todo generado correctamente con integridad.
