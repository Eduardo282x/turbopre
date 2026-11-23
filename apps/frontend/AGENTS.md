# Frontend de TurboPre — convenciones

> Complementa el `AGENTS.md` de la raíz. Aquí solo lo específico de esta app.

## Contexto de producto

CAMI es el panel de gestión de mantenimiento industrial de TurboPre Services. La
columna vertebral es **Orden de Servicio → Inspección → Hoja de ruta → Anexos →
Calidad → Entrega**. Las pantallas giran en torno a órdenes de servicio, equipos,
inspecciones, tareas por proceso/puesto, repuestos y usuarios con distintos roles.

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
- La API responde `{ success, statusCode, message, data }`. Tipa la llamada como
  `ApiSuccess<T>` (de `@turbopre/shared`) y devuelve `response.data.data` desde el
  service; los componentes reciben el dato plano.
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
- El login es **real** contra `POST /api/auth/login` y usa `loginSchema` de
  `@turbopre/shared`. `ProtectedRoute` revalida la sesión con `/auth/me`.
- `useCurrentUser` (en `features/preview/store/preview-session.ts`) devuelve un
  usuario compatible con el modelo preview a partir del JWT. Mientras queden
  módulos sin migrar, los usuarios demo del seed usan los mismos IDs que la
  semilla del preview para que las tareas sigan cuadrando.
- En desarrollo/QA se muestran accesos rápidos y cambio de usuario; ambos hacen
  login real con los usuarios sembrados (`demo1234`). En producción no aparecen
  (ver `isPreviewMode`).

## Estado de la migración (Fase 2)

- **Conectado a la API**: login, `/auth/me`, sesión, usuarios, catálogos,
  clientes, sitios, equipos, proyectos y órdenes de servicio.
- **Sigue en preview** (`src/features/preview/`, zustand + `localStorage`):
  inspecciones, tareas, hojas de ruta, anexos, calidad, repuestos, inventario,
  solicitudes, préstamos, calibración, rendimiento, mapa de planta, auditoría y
  datos demo de configuración.
- Mientras inspección/hoja sigan en preview, `useServiceOrders` mezcla el estado
  y avance de la semilla preview para las ODS demo con IDs estables. Las ODS
  nuevas usan exclusivamente la API.
- Los roles son los canónicos del backend: Administrador (`ADMIN`), Ventas,
  Taller, Ingeniería (`ENGINEER`), Operador, Calidad, Gerente de Proyecto
  (`PROJECT_MANAGER`) y Almacén.
- La matriz de permisos vive en `@turbopre/shared`; `src/lib/permissions.ts`
  solo adapta los tipos provisionales.
- La columna vertebral es **ODS → Inspección → Hoja de ruta → Anexos → Calidad →
  Entrega**. La entidad de entrada es la **Orden de Servicio** (`ServiceOrder`).
- La hoja de ruta es una secuencia de tareas por **etapa**, **proceso** y
  **puesto**, sin el concepto de “partes”.
- Se retiraron campo, suministro, NDT, no conformidades, jefes de sección,
  metrología y Procura como rol. Procura es solo un destino de repuestos.
- Configuración → **Restablecer datos** vuelve a la semilla
  (`turbopre.cami.preview.v3`).
- La tabla reutilizable está en `src/components/table-kit/` y las gráficas en
  `src/components/charts/` (shadcn Chart + Recharts).
- Detalles y modelo provisional: `docs/preview-frontend.md`.
- Para continuar la migración: reemplazar los selectores del store preview por
  `services/<dominio>/` + TanStack Query, módulo por módulo.

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
