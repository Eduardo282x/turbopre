# TurboPre

Monorepo de **TurboPre**: panel de administración con frontend en React (Vite) y API en NestJS,
orquestado con **Turborepo** y **pnpm workspaces**.

```
TurboPre/
├─ apps/
│  ├─ frontend/     React 19 · Vite 8 · TypeScript · Tailwind 4 · shadcn/ui
│  └─ backend/      NestJS 12 · Prisma 7 · PostgreSQL · JWT
├─ packages/
│  └─ shared/       esquemas zod y tipos compartidos (@turbopre/shared)
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Requisitos

- Node.js `>= 20.19` (probado con 24.19)
- pnpm `11.x` (`npm i -g pnpm`)
- PostgreSQL (opcional mientras `AUTH_DEMO=true`)

## Puesta en marcha

```bash
pnpm install            # instala todo el workspace y genera el cliente Prisma
cp apps/backend/.env.example apps/backend/.env
pnpm dev                # frontend en :5173 y API en :3000
```

Abre <http://localhost:5173> e inicia sesión con el usuario demo:

| Correo | Contraseña |
| --- | --- |
| `admin@turbopre.dev` | `Admin123!` |

> El login demo no toca la base de datos. Se controla con `AUTH_DEMO` en `apps/backend/.env`.

## Scripts (raíz)

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta `shared` (watch), frontend y backend a la vez. |
| `pnpm build` | Compila `shared` y luego ambas apps. |
| `pnpm lint` | oxlint en los tres paquetes. |
| `pnpm check-types` | `tsc` en los tres paquetes. |
| `pnpm dev:web` / `pnpm dev:api` | Solo una de las apps. |
| `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio` | Comandos de Prisma en el backend. |

## Endpoints disponibles

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Estado de la API (usado por el dashboard). |
| `POST` | `/api/auth/login` | Login con `{ email, password }` → `{ accessToken, user }`. |
| `GET` | `/api/auth/me` | Usuario del token (`Authorization: Bearer …`). |

## Integración con PostgreSQL (pendiente)

El esquema de Prisma y el módulo de acceso a datos ya están listos, pero **la base de datos todavía
no está conectada**. Para completarla:

1. Crea el rol y la base (con tu usuario administrador de PostgreSQL):

   ```bash
   psql -U postgres -c "CREATE USER turbopre WITH PASSWORD 'turbopre' CREATEDB;"
   psql -U postgres -c "CREATE DATABASE turbopre OWNER turbopre;"
   ```

   En Windows, `psql` está normalmente en `C:\Program Files\PostgreSQL\18\bin\psql.exe`.

2. Ajusta `DATABASE_URL` en `apps/backend/.env`:

   ```env
   DATABASE_URL="postgresql://turbopre:turbopre@localhost:5432/turbopre?schema=public"
   ```

3. Genera la migración inicial y el usuario semilla:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

4. Cambia `AUTH_DEMO=false` y reinicia `pnpm dev`.

El modelo `User` vive en `apps/backend/prisma/schema.prisma` y el cliente generado se escribe en
`apps/backend/src/generated/prisma` (se regenera con `pnpm install` o `pnpm db:generate`).

## Frontend

```
apps/frontend/src/
├─ app/           providers (Query + Toaster + Tooltip) y router
├─ components/
│  ├─ ui/         componentes de shadcn/ui
│  ├─ layout/     layout, sidebar y header
│  └─ auth/       ProtectedRoute
├─ pages/         auth/login-page · home/home-page · settings · not-found
├─ services/      api.ts (axios) + <dominio>/<dominio>.service.ts
├─ stores/        zustand (sesión con persist)
└─ lib/           query-client, utils, formatters, api-error
```

- Alias `@/*` → `src/*` (configurado en `tsconfig.app.json` y `vite.config.ts`).
- En desarrollo la API se consume por `/api` mediante el proxy de Vite hacia `http://localhost:3000`.
  Para apuntar a otra URL define `VITE_API_URL` en `apps/frontend/.env`.
- El interceptor de Axios añade el `Bearer` y cierra la sesión ante un `401`.

## Backend

```
apps/backend/src/
├─ main.ts        prefijo /api, CORS, StandardSchemaValidationPipe
├─ auth/          login, /me, guard JWT y usuario demo
├─ health/        GET /api/health
└─ prisma/        PrismaService (inicialización perezosa) y módulo global
```

La validación usa `StandardSchemaValidationPipe` de Nest 12 con los esquemas zod de
`@turbopre/shared`, así que el mismo contrato vale para el formulario y para la API.

## Notas

- pnpm bloquea scripts de instalación: los permitidos están en `allowBuilds` de `pnpm-workspace.yaml`.
- `@turbopre/shared` se compila a `dist` (ESM + tipos). `pnpm dev` lo deja en modo watch.
- shadcn/ui usa el preset `radix-nova` (estilo `new-york`, color base `neutral`); añade más
  componentes con `pnpm dlx shadcn@latest add <componente>` desde `apps/frontend`.
