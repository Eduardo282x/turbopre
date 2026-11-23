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
- PostgreSQL

## Puesta en marcha

```bash
pnpm install            # instala todo el workspace y genera el cliente Prisma
cp apps/backend/.env.example apps/backend/.env
# ajusta DATABASE_URL en apps/backend/.env
pnpm db:migrate         # crea las tablas
pnpm db:seed            # crea catálogos y el administrador
pnpm dev                # frontend en :5173 y API en :3000
```

Abre <http://localhost:5173> e inicia sesión con el usuario administrador semilla:

| Usuario | Contraseña |
| --- | --- |
| `admin` | `Admin123!` |

> El administrador y los catálogos se crean con `pnpm db:seed`. No hay modo demo:
> el login siempre valida contra PostgreSQL.

## Scripts (raíz)

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta `shared` (watch), frontend y backend a la vez. |
| `pnpm build` | Compila `shared` y luego ambas apps. |
| `pnpm lint` | oxlint en los tres paquetes. |
| `pnpm check-types` | `tsc` en los tres paquetes. |
| `pnpm --filter backend test` | Pruebas unitarias del backend (Vitest). |
| `pnpm --filter backend test:e2e` | Pruebas e2e del backend (levanta la app en un puerto libre). |
| `pnpm dev:web` / `pnpm dev:api` | Solo una de las apps. |
| `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio` | Comandos de Prisma en el backend. |

## Endpoints disponibles

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Estado de la API; `data` contiene `{ status, service, version, uptime, timestamp }`. |
| `POST` | `/api/auth/login` | Login con `{ username, password }`; `data` contiene `{ accessToken, user }`. |
| `GET` | `/api/auth/me` | Usuario del token (`Authorization: Bearer …`); `data` contiene el usuario. |

### Formato de respuesta

Todas las rutas, incluidas las de error, responden con el mismo sobre:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operación exitosa",
  "data": {}
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "username: El nombre de usuario debe tener al menos 3 caracteres",
  "data": {
    "errors": ["username: El nombre de usuario debe tener al menos 3 caracteres"]
  }
}
```

- El mensaje de éxito se puede personalizar con `@ApiMessage('...')` en el handler.
- Los errores no exponen stack traces ni mensajes internos de Prisma.
- En el frontend, los services tipan `ApiSuccess<T>` y devuelven `data.data`.

## Base de datos PostgreSQL

El esquema de dominio y el cliente de Prisma ya están listos. Para crear la base
en local:

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

3. Genera la migración inicial, los catálogos y el administrador:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

El modelo de dominio completo vive en `apps/backend/prisma/schema.prisma` y su
documentación funcional y diagramas en `docs/domain-model.md`. El cliente generado
se escribe en `apps/backend/src/generated/prisma` (se regenera con `pnpm install`
o `pnpm db:generate`).

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
  Para apuntar a otra URL define `VITE_API_URL` en `apps/frontend/.env`. En QA, Vercel
  reescribe `/api/*` al backend (ver [Deploy de QA](#deploy-de-qa-vercel--render)).
- El interceptor de Axios añade el `Bearer` y cierra la sesión ante un `401`.

## Backend

```
apps/backend/src/
├─ main.ts         prefijo /api, CORS, StandardSchemaValidationPipe
├─ auth/           login, /me, guard JWT y servicio contra PostgreSQL
├─ common/         filtro global de excepciones y decoradores
├─ interceptors/   sobre estándar de respuestas exitosas
├─ health/         GET /api/health
└─ prisma/         PrismaService (pool de pg, conexión al arranque) y módulo global
```

La validación usa `StandardSchemaValidationPipe` de Nest 12 con los esquemas zod de
`@turbopre/shared`, así que el mismo contrato vale para el formulario y para la API.

## Deploy de QA (Vercel + Render)

El monorepo se despliega como **dos servicios independientes** desde el mismo repositorio.
Requisito: el proyecto debe estar en GitHub con al menos un commit.

### Frontend en Vercel

| Ajuste | Valor |
| --- | --- |
| Root Directory | `apps/frontend` |
| Framework | Vite |
| Build Command | `cd ../.. && pnpm turbo run build --filter=frontend` |
| Output Directory | `dist` |
| Install Command | `pnpm install --frozen-lockfile` |

`apps/frontend/vercel.json` ya deja configurado:

- rewrite de `/api/*` hacia el backend de Render (así **no hay CORS** y funciona en
  cualquier URL de preview),
- fallback SPA a `/index.html`, necesario porque el router usa `createBrowserRouter`.

> Antes del primer deploy cambia `https://turbopre-api.onrender.com` del rewrite por la
> URL real del servicio de Render. Si el host cambia después, edita el archivo y
> redeploya el frontend.
>
> En Vercel, la opción **“Include files outside the root directory in the Build Step”**
> debe quedar activada para que `packages/shared` esté disponible en el build.

Si prefieres llamar a la API directamente en lugar de usar el proxy, define
`VITE_API_URL=https://<api>/api` en Vercel y agrega el dominio del frontend a
`CORS_ORIGIN` del backend. Recuerda que `VITE_API_URL` se inlinea en tiempo de build.

### Backend en Render

Opción A (recomendada): **New → Blueprint**, seleccionar el repositorio y Render lee
`render.yaml`.
Opción B: crear un **Web Service** manual con runtime Node.

| Ajuste | Valor |
| --- | --- |
| Root Directory | *(vacío: raíz del repositorio)* |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm turbo run build --filter=backend` |
| Start Command | `node apps/backend/dist/main.js` |
| Health Check Path | `/api/health` |

Variables de entorno: `NODE_VERSION=24`, `NODE_ENV=production`,
`JWT_SECRET`, `CORS_ORIGIN` y `DATABASE_URL` (Render Postgres). **No definas `PORT`**:
lo inyecta Render y la API ya lo lee.

> ⚠️ No configures `apps/backend` como Root Directory en Render: Render no expone los
> archivos que quedan fuera de ese directorio y el build necesita el workspace completo
> (`pnpm-workspace.yaml`, el lockfile y `packages/shared`).

Migraciones: en plan pago, descomenta `preDeployCommand` en `render.yaml`; en plan free,
ejecútalas manualmente apuntando a la base de QA:

```bash
pnpm --filter backend exec prisma migrate deploy
```

### Orden de despliegue y verificación

1. Desplegar el backend y comprobar `GET https://<api>/api/health`.
2. Copiar esa URL al rewrite de `apps/frontend/vercel.json` y desplegar el frontend.
3. Probar login real, recarga directa de `/ajustes` (fallback SPA) y una llamada a `/api/*`.
4. Revisar `CORS_ORIGIN`: acepta varios orígenes separados por comas y comodines de un
   nivel, por ejemplo `https://turbopre.vercel.app,https://*.vercel.app`.

### Limitaciones del plan gratuito

- Render free duerme el servicio por inactividad: el primer request (y el proxy de Vercel)
  puede tardar decenas de segundos.
- La base gratuita de Render expira a los 30 días.
- Para QA continuo conviene un plan pago y habilitar las migraciones en el pre-deploy.

## Documentación para agentes

- `AGENTS.md` (raíz): contexto del negocio — hojas de ruta, áreas/roles, alcance — y las
  preguntas obligatorias antes de modelar el dominio.
- `apps/frontend/AGENTS.md`: convenciones de React, shadcn, datos y estilos.
- `apps/backend/AGENTS.md`: notas del CLI de Nest 12 (ESM, Vitest, validación con zod).

OpenCode carga estos archivos automáticamente. Para trabajar en varias áreas, abre la
sesión desde la raíz del monorepo.

## Notas

- pnpm bloquea scripts de instalación: los permitidos están en `allowBuilds` de `pnpm-workspace.yaml`.
- `@turbopre/shared` se compila a `dist` (ESM + tipos). `pnpm dev` lo deja en modo watch.
- shadcn/ui usa el preset `radix-nova` (estilo `new-york`, color base `neutral`); añade más
  componentes con `pnpm dlx shadcn@latest add <componente>` desde `apps/frontend`.
