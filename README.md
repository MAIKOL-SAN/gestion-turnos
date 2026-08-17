# Gestion de turnos

MVP web para administrar personas, administradores y turnos de trabajo o colaboracion. Usa Next.js, TypeScript, Tailwind CSS y PostgreSQL en Supabase. No requiere Docker ni servidor propio.

## Requisitos

- Node.js 20 o superior.
- npm.
- Proyecto gratuito en Supabase.

## Instalacion local

```bash
npm install
cp .env.example .env.local
```

En Windows PowerShell puedes crear `.env.local` copiando el contenido de `.env.example`.

## Configuracion de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Abre `Project Settings > Database`.
3. Copia el connection string de PostgreSQL.
4. Pega el valor en `DATABASE_URL` dentro de `.env.local`.
5. Deja `DATABASE_SSL="true"` para Supabase.
6. Genera un secreto largo para `AUTH_SECRET`.

## Migraciones

Ejecuta:

```bash
npm run db:migrate
```

La migracion crea:

- `users`
- `person_profiles`
- `shifts`
- `shift_registrations`
- `audit_logs`
- triggers de cupo y concurrencia
- tabla `schema_migrations`

## Primer SUPER_ADMIN

Configura estas variables en `.env.local`:

```bash
SUPER_ADMIN_NAME="Administrador principal"
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="una-contrasena-segura"
```

Luego ejecuta:

```bash
npm run db:create-super-admin
```

## Ejecutar localmente

```bash
npm run dev
```

Abre `http://localhost:3000`.

Flujo principal:

1. Crea el primer `SUPER_ADMIN`.
2. Inicia sesion como administrador.
3. Crea un turno en `/admin/shifts/new`.
4. Registra una persona en `/register`.
5. La persona entra a `/shifts`, se inscribe y ve sus turnos en `/my-shifts`.
6. Al llenarse el cupo, PostgreSQL bloquea nuevas inscripciones y el estado pasa a `FULL`.
7. Al cancelar una inscripcion confirmada, se libera el cupo y el turno vuelve a `OPEN` si aplica.

## Deploy en Vercel

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. Configura las variables de entorno de produccion:
   - `DATABASE_URL`
   - `DATABASE_SSL`
   - `AUTH_SECRET`
4. Ejecuta `npm run db:migrate` contra la base de datos de Supabase.
5. Ejecuta `npm run db:create-super-admin` una vez para crear el primer administrador.
6. Despliega.

## Seguridad y reglas de negocio

- Las contrasenas se almacenan con bcrypt.
- Las sesiones usan cookie `httpOnly` firmada con `AUTH_SECRET`.
- La cedula es unica y validada en base de datos.
- Los datos medicos (`blood_type`, `eps`) solo aparecen en perfil propio y vistas administrativas.
- Los roles son `PERSON`, `ADMIN` y `SUPER_ADMIN`.
- Un `ADMIN` puede crear otros `ADMIN`.
- Solo un `SUPER_ADMIN` puede crear, promover o desactivar `SUPER_ADMIN`.
- El cupo se protege con transaccion en servidor y triggers `FOR UPDATE` en PostgreSQL.
- Una persona no puede tener dos inscripciones confirmadas en el mismo turno.
- Para evitar abuso de cancelacion y reserva, una persona puede reintentar inscribirse en el mismo turno solo hasta dos cancelaciones previas.

## Estructura

```text
migrations/                 SQL de base de datos
scripts/                    migracion y creacion del SUPER_ADMIN
src/app/                    rutas de Next.js
src/app/actions/            server actions
src/components/             layout, UI y formularios
src/lib/                    auth, db, validacion, datos y formatos
```

## Pendiente P1/P2

Incluido en este MVP: dashboard, calendario simple, asistencia, auditoria, filtros y busqueda.

Futuro recomendado:

- Notificaciones por correo o WhatsApp.
- Lista de espera.
- QR para asistencia.
- Exportacion CSV/Excel.
- Estadisticas de horas.
- Turnos recurrentes.
- Sedes y tipos de actividad.
