# Frontend de TurboPre — convenciones

> Complementa el `AGENTS.md` de la raíz. Aquí solo lo específico de esta app.

## Contexto de producto

La interfaz es el panel de gestión de **hojas de ruta** de una empresa de
componentes de turbinas. Las pantallas de negocio girarán en torno a hojas de
ruta, componentes, partes, repuestos, áreas/fases y usuarios con distintos roles.
El equipo tiene un **mockup** que se adaptará más adelante: cuando llegue, léelo y
pregunta antes de reescribir rutas, navegación o formularios existentes.

Antes de crear pantallas nuevas, confirma con el usuario: ruta, roles con acceso,
estados que se muestran, acciones disponibles y qué datos son reales vs. mock.

## Estructura

```
src/
├─ app/            providers, router
├─ components/
│  ├─ ui/          shadcn/ui (no editar a mano)
│  ├─ layout/      layout, sidebar, header
│  └─ auth/        ProtectedRoute
├─ pages/<dominio>/   una carpeta por dominio (ej. hojas-de-ruta/)
├─ services/       api.ts + <dominio>/<dominio>.service.ts
├─ stores/         zustand (solo estado global de cliente)
├─ lib/            query-client, utils, formatters, api-error
└─ hooks/
```

- Alias `@/*` → `src/*`.
- Rutas con `createBrowserRouter` y `lazy` por página (no importes páginas de
  forma estática en `app/router.tsx`).
- Toda ruta privada va dentro de `<ProtectedRoute />` + `<Layout />`.

## Datos y estado

- **Server state** con TanStack Query: `queryKey` por dominio
  (`['hojas-de-ruta', 'list', filtros]`), mutaciones que invalidan la key
  correspondiente. No guardes respuestas de API en zustand.
- **HTTP** solo a través de `services/api.ts` y de `services/<dominio>/…service.ts`.
  Nunca `fetch`/axios suelto dentro de un componente.
- **Global state** con zustand (sesión, preferencias). Usa selectores
  (`useAuthStore((s) => s.user)`).
- Tipos y esquemas de validación vienen de `@turbopre/shared`; no dupliques
  interfaces de request/response.

## Formularios

- `react-hook-form` + `zodResolver` con el esquema de `@turbopre/shared`.
- shadcn v4 **no** tiene `Form`: usa `Controller` + `Field`, `FieldLabel`,
  `FieldDescription` y `FieldError`, como en `pages/auth/login-page.tsx`.
- Errores de API con `getApiErrorMessage()` (`lib/api-error.ts`) y `toast` de
  sonner para feedback.

## Estilos

- Tailwind 4 con tokens semánticos (`bg-background`, `text-muted-foreground`,
  `border-border`). Evita colores hex sueltos salvo casos de marca justificados.
- Usa `cn` desde `@/lib/utils` (re-exporta el paquete oficial `cn`).
- Componentes nuevos de shadcn: `pnpm dlx shadcn@latest add <componente>` desde
  `apps/frontend`. No edites `src/components/ui/*` a mano; si hace falta un
  cambio, envuélvelo en un componente propio.
- No añadas otra librería de UI, iconos o estilos sin preguntar (`lucide-react` y
  `react-icons` ya están disponibles).

## Autenticación

- El token vive en `useAuthStore` (persistido) y el interceptor de Axios lo
  adjunta. Ante un `401` el interceptor cierra sesión y redirige a `/login`.
- El login real está pendiente de conectar a PostgreSQL; hoy funciona contra el
  usuario demo del backend (`admin@turbopre.dev / Admin123!`).

## Entorno

- En desarrollo, `/api` se proxya a `http://localhost:3000` (ver `vite.config.ts`).
- En QA, Vercel reescribe `/api/*` al backend de Render; no hace falta
  `VITE_API_URL` (si se define, tiene prioridad y debe incluir `/api`).

## Verificación

```bash
pnpm --filter frontend check-types
pnpm --filter frontend lint
pnpm --filter frontend build
pnpm dev   # y probar la pantalla en :5173
```

Si tocas el flujo de login o el layout, verifica también que un `401` saque al
usuario a `/login` y que las rutas privadas no rendericen sin sesión.
