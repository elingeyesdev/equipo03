# GymSync

Sistema de gestión para gimnasios multi-sucursal. Cubre control de asistencia del personal, reservas de clientes, rutinas de entrenamiento, inventario de máquinas y reportes, todo desde una sola plataforma.

---

## Estructura del repositorio

```
equipo03-2/
├── apps/
│   ├── web/          # Panel de administración (React + Vite)
│   └── mobile/       # App para miembros (React Native + Expo)
└── packages/
    └── core/         # Lógica de negocio compartida
```

El backend reside en la rama llamada backend (`backend_gym_sync`).

---

## Stack

| Capa | Tecnología |
|---|---|
| Web | React 19, Vite, TypeScript, Tailwind CSS |
| Mobile | Expo 54, React Native 0.81, Zustand |
| Backend | NestJS 11, TypeORM, PostgreSQL |
| Auth | JWT + Passport |
| Tiempo real | Socket.io |
| Almacenamiento | Cloudinary |
| Notificaciones | Expo Push + Nodemailer |

---

## Requisitos previos

- Node.js 20+
- PostgreSQL 15+
- Expo CLI (`npm install -g expo-cli`)

---

## Configuración

### Backend

```bash
cd backend_gym_sync
cp .env.example .env
# Completar .env con los datos de la base de datos y JWT
npm install
npm run start:dev
```

Variables obligatorias en `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_DATABASE=bdd_gym_sync
JWT_SECRET=
PORT=3000
DROP_SCHEMA=false   # true solo la primera vez
```

Poblar la base de datos (primera vez):

```bash
npm run db:seed
```

### Web

```bash
cd apps/web
# Crear apps/web/.env con:
# VITE_API_URL=http://localhost:3000
npm install
npm run dev       # http://localhost:5173
```

### Mobile

```bash
cd apps/mobile
# Editar .env con la IP local del PC:
# EXPO_PUBLIC_API_BASE_URL=http://192.168.X.X:3000
npm install
npx expo start
```

El celular y el PC deben estar en la misma red WiFi.

---

## Scripts disponibles (raíz del monorepo)

```bash
npm run web         # Inicia el panel web
npm run mobile      # Inicia la app móvil
npm run test:core   # Corre los tests del paquete core
```

---

## Módulos principales

- **Control de Asistencia** — Registro de ingresos del personal por QR o manual, con filtros por estado, sede y rango de fechas.
- **Gestión de Reservas** — Reservas de clientes con check-in por QR desde recepción.
- **Usuarios y Roles** — RBAC con tres niveles: Super Admin (global), Gerente de Marca (multi-sucursal) y Recepcionista (sucursal única).
- **Catálogo de Servicios** — Actividades y servicios disponibles por sucursal.
- **Inventario de Máquinas** — Alta, baja y estado de equipamiento por sede.
- **Rutinas y Ejercicios** — Biblioteca de ejercicios con video y planes de entrenamiento asignables a miembros.
- **Reportes** — Exportación a PDF de asistencia, reservas y uso de servicios.
- **Dashboard** — Métricas de ocupación, ingresos y actividad en tiempo real.

---

## Variables de entorno — resumen

| Archivo | Variable | Descripción |
|---|---|---|
| `backend/.env` | `DB_*` | Conexión a PostgreSQL |
| `backend/.env` | `JWT_SECRET` | Clave para firmar tokens |
| `backend/.env` | `DROP_SCHEMA` | Recrear tablas al inicio (solo primera vez) |
| `backend/.env` | `SMTP_USER / SMTP_PASS` | Correo para notificaciones (opcional) |
| `apps/mobile/.env` | `EXPO_PUBLIC_API_BASE_URL` | IP local del backend |
| `apps/web/.env` | `VITE_API_URL` | URL del backend |

---

## Equipo 03

Proyecto universitario — Universidad del Valle, 2025.
