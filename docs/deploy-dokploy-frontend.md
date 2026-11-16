# Deploy del frontend en Dokploy

Este repositorio incluye un `Dockerfile` en la raíz que compila **solo el
frontend** y sirve los archivos estáticos con Nginx.

## Configuración en Dokploy

Crea una aplicación de tipo **Dockerfile** con estos valores:

| Campo | Valor |
| --- | --- |
| Repository | Este repositorio |
| Branch | La rama que quieras desplegar |
| Build context | `.` (raíz del repositorio) |
| Dockerfile path | `Dockerfile` |
| Port | `80` |
| Health check path | `/` |
| Domain | Tu dominio o subdominio |

> Es importante usar la **raíz del repositorio** como build context. El
> Dockerfile necesita `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `apps/frontend` y
> `packages/shared`.

## Variables de entorno

El frontend es estático. Las variables `VITE_*` se leen **en tiempo de build**,
no en tiempo de ejecución.

- `VITE_API_URL`: opcional. Si se deja vacío, la app usa `/api` (modo preview
  actual, sin backend).
- Si más adelante conectas el backend, define `VITE_API_URL` como build arg en
  Dokploy y vuelve a desplegar.

## Qué hace el Dockerfile

1. Usa `node:22-alpine` e instala `pnpm@11.21.0`.
2. Instala dependencias solo para `frontend` y `@turbopre/shared`.
3. Compila `packages/shared`.
4. Compila el frontend con Vite.
5. Copia `apps/frontend/dist` a una imagen `nginx:1.27-alpine`.
6. Configura fallback SPA, compresión gzip, cache de assets y cabeceras de
   seguridad.

## Verificación después del deploy

- Abre `/login`.
- Inicia sesión con cualquier usuario del listado rápido; la contraseña demo es
  `demo1234`.
- Navega a `/expedientes`, `/taller`, `/campo`, `/proyectos` y `/suministro`.
- Recarga una ruta interna como `/expedientes/so-001` para validar el fallback
  SPA de Nginx.
- Si cambias la semilla o el esquema del preview, usa **Configuración →
  Restablecer datos** en la aplicación.

## Nota sobre el backend

Este Dockerfile no incluye NestJS ni PostgreSQL. El preview actual funciona con
`localStorage`. Cuando se integre el backend, puedes:

- desplegarlo como otro servicio en Dokploy y apuntar `VITE_API_URL` a su URL, o
- agregar un proxy `/api/` en `docker/nginx.frontend.conf` hacia el servicio
  interno del backend.
