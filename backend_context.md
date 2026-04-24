# Contexto del Backend de GymSync (API Rest & PostgreSQL)

Este documento es el **contexto arquitectónico e infraestructural del backend de GymSync**. Su propósito es servir de referencia para conectar la aplicación frontend (App/Web) con la base de datos real y sus endpoints, abandonando los datos "hardcodeados".

## 🏗️ Resumen de la Arquitectura
- **Framework Principal:** NestJS.
- **Base de Datos:** PostgreSQL (Normalizada, relacional).
- **ORM:** TypeORM.
- **Diseño:** Arquitectura Hexagonal / Domain-Driven Design (DDD) dividido en módulos de dominio.
- **Documentación de API:** Swagger (OpenAPI) disponible para revisar el contrato de los endpoints.

---

## 🗄️ Esquema de Base de Datos: Las 33 Tablas

El sistema cuenta exactamente con **33 tablas relacionales** organizadas en **15 módulos de dominio** lógicos. Cada módulo encapsula su propia lógica y expone las entidades necesarias.

A continuación, la distribución completa de las tablas (entidades) por módulo:

### 1. Módulo: `Users` (Gestión de Usuarios)
- **`users`** (`user.entity.ts`): Tabla central de identidades y credenciales.
- **`user_profiles`** (`user-profile.entity.ts`): Información personal detallada de los usuarios (nombres, género, fecha de nacimiento, etc.).

### 2. Módulo: `Roles` (Control de Acceso y RBAC)
- **`roles`** (`role.entity.ts`): Definición de roles (Admin, Member, Trainer, etc.).
- **`permissions`** (`permission.entity.ts`): Permisos atómicos del sistema.
- **`role_permissions`** (`role-permission.entity.ts`): Tabla pivote entre roles y permisos.
- **`user_roles`** (`user-role.entity.ts`): Tabla pivote entre usuarios y roles.

### 3. Módulo: `Gyms` (Gestión de Sedes)
- **`gyms`** (`gym.entity.ts`): Información general de los gimnasios/franquicias.
- **`gym_locations`** (`gym-location.entity.ts`): Direcciones físicas y coordenadas de cada sede.
- **`gym_schedules`** (`gym-schedule.entity.ts`): Horarios operativos de las sedes.

### 4. Módulo: `Activities` (Clases y Actividades Grupales)
- **`gym_activities`** (`gym-activity.entity.ts`): Catálogo de actividades (Zumba, Yoga, Spinning, etc.).
- **`gym_activity_schedules`** (`gym-activity-schedule.entity.ts`): Programación temporal de las clases, instructores asignados y capacidad máxima.
- **`gym_activity_attendance`** (`gym-activity-attendance.entity.ts`): Registro de asistencia a las clases.

### 5. Módulo: `Exercises` (Catálogo de Ejercicios)
- **`exercise_catalogs`** (`exercise-catalog.entity.ts`): Diccionario global de ejercicios con sus descripciones y grupos musculares objetivo.

### 6. Módulo: `Routines` (Plantillas de Rutinas)
- **`routines`** (`routine.entity.ts`): Plantillas de rutinas genéricas o personalizadas.
- **`routine_exercises`** (`routine-exercise.entity.ts`): Relación de qué ejercicios pertenecen a qué rutina, series, repeticiones base y tiempos de descanso.

### 7. Módulo: `Training` (Entrenamiento Personalizado)
- **`user_trainings`** (`user-training.entity.ts`): Asignación de rutinas/entrenamientos a un usuario específico.
- **`user_training_goals`** (`user-training-goals.entity.ts`): Objetivos del usuario (pérdida de peso, hipertrofia).
- **`user_training_preferences`** (`user-training-preferences.entity.ts`): Preferencias (días de entrenamiento, equipo disponible).
- **`user_training_restrictions`** (`user-training-restriction.entity.ts`): Restricciones médicas o lesiones.
- **`workout_sessions`** (`workout-session.entity.ts`): Instancias reales cuando un usuario ejecuta un entrenamiento.
- **`workout_sets`** (`workout-set.entity.ts`): Registro exacto de series, repeticiones y peso levantado en una sesión específica.
- **`emergency_contacts`** (`emergency-contact.entity.ts`): Contactos de emergencia para un deportista.

### 8. Módulo: `Subscriptions` (Planes y Pagos)
- **`subscription_plans`** (`subscription-plan.entity.ts`): Planes disponibles en el gimnasio (Básico, Pro, Anual, etc.).
- **`user_subscriptions`** (`user-subscription.entity.ts`): Suscripción activa o histórica del usuario.
- **`subscription_payments`** (`subscription-payment.entity.ts`): Historial de transacciones de pago.

### 9. Módulo: `Reservations` (Reservas de Clases)
- **`reservations`** (`reservation.entity.ts`): Reserva explícita de un usuario a un `gym_activity_schedule` específico.

### 10. Módulo: `Waitlist` (Lista de Espera)
- **`waitlist_entries`** (`waitlist-entry.entity.ts`): Usuarios aguardando cupo en una clase llena.

### 11. Módulo: `Checkins` (Control de Acceso)
- **`check_ins`** (`check-in.entity.ts`): Registro de entrada física (y salida) al gimnasio mediante código QR o biometría.

### 12. Módulo: `Metrics` (Mediciones Físicas)
- **`physical_metrics_history`** (`physical-metrics-history.entity.ts`): Historial de peso, grasa corporal, masa muscular y otras mediciones.

### 13. Módulo: `Notifications`
- **`notifications`** (`notification.entity.ts`): Historial de alertas enviadas (push, email, in-app).
- **`notification_templates`** (`notification-template.entity.ts`): Plantillas HTML/texto de mensajes.
- **`user_notification_preferences`** (`user-notification-preference.entity.ts`): Configuración de opt-in/opt-out por usuario.

### 14. Módulo: `System`
- **`system_settings`** (`system-setting.entity.ts`): Configuraciones globales dinámicas del backend.

### 15. Módulo: `Auth`
- *(Sin tablas directas, maneja la generación/validación de JWT y lógica de login, conectándose al módulo `Users`)*.

---

## 🔗 Instrucciones Clave para la IA del Frontend (App/Web)

Si estás leyendo esto para conectar el frontend al backend, sigue estos lineamientos:

1. **Abandona la Data Simulada:** El proyecto ya no depende de archivos de estado local o mocks manuales. Toda la data (Catálogo de Gimnasios, Sedes, Actividades y Autenticación) debe extraerse vía peticiones HTTP (`fetch` / `axios` / Zustand Async Actions) hacia los endpoints NestJS.
2. **Autenticación (JWT):** Todas las solicitudes a endpoints protegidos deben incluir en los headers el token provisto por la ruta de autenticación del backend (`Authorization: Bearer <token>`).
3. **Flujo de Modelos (Ejemplo):** 
   - Para mostrar los gimnasios, consume el módulo `Gyms` (y sus ubicaciones vinculadas). 
   - Para mostrar clases, consume `Activities` con sus `gym_activity_schedules`.
   - El estado en la app (ej: *Zustand*, *Redux*) ahora solo almacenará lo que responde el backend, sirviendo como caché/UI reactiva.
4. **Relaciones (TypeORM):** Recuerda que al realizar consultas (e.g. GET `/gyms`), el backend por defecto devolverá objetos anidados (Ej: un `Gym` vendrá con un arreglo de `GymLocations` si la relación está pedida). Adapta las interfaces/tipos TypeScript del frontend para mapear exactamente a estas estructuras (puedes basarte en este documento).

---
*Este contexto abarca el total de las 33 entidades mapeadas a PostgreSQL.*
