# TurboPre — contexto e instrucciones del proyecto

> Archivo de instrucciones para agentes. Se combina con `apps/backend/AGENTS.md`
> (notas del CLI de Nest 12) y `apps/frontend/AGENTS.md` (convenciones del frontend).
> Léelos antes de tocar esa parte del código.

## 1. Qué es TurboPre

TurboPre es el sistema de gestión de una empresa dedicada a la **fabricación, el
mantenimiento y el desarrollo de componentes de turbinas**.

El objetivo es **centralizar el proceso productivo en un solo sistema**: hoy el
seguimiento vive disperso, y la pieza central que se quiere gestionar es la
**hoja de ruta**.

## 2. El dominio: la hoja de ruta

Una **hoja de ruta** es el punto de partida de un trabajo. En ella se indica:

- qué **componente** se va a realizar,
- cuáles son las **partes** que hay que fabricar para ese componente,
- qué **repuestos** puede llegar a necesitar,
- por cuáles **áreas** debe pasar el componente y en qué orden,
- en qué **fase/estado** se encuentra cada parte del proceso.

La necesidad principal es **visualizar el avance** del componente por las fases y
saber quién tiene la pelota en cada momento.

Glosario de trabajo (el modelo definitivo **no** está decidido todavía):

| Término | Significado |
| --- | --- |
| Hoja de ruta | Documento/orquestador que define partes, repuestos y áreas por las que pasa un componente. |
| Componente | Pieza o conjunto final que se fabrica, mantiene o desarrolla para una turbina. |
| Parte | Cada pieza individual que compone el componente y que se fabrica por separado. |
| Repuesto | Material o pieza de recambio asociada al componente o a una parte. |
| Área / rol | Etapa organizativa que interviene en el proceso (ver sección 3). |
| Fase | Etapa concreta dentro de un área por la que pasa una parte (estado, responsable, fechas). |

> No inventes entidades, campos ni reglas de negocio. El esquema actual de Prisma
> (`User` con `ADMIN | STAFF`) es **un marcador de posición**, no el modelo final.

## 3. Áreas y roles del sistema

Estos son los roles que el negocio mencionó. Su alcance exacto está **por
confirmar**:

| Área / rol | Participación esperada (por validar) |
| --- | --- |
| Planificación y Diseño | Crea/diseña la hoja de ruta, define partes y repuestos. |
| Turbinas | Recibe y trabaja componentes del área de turbinas. |
| Soldadura | Ejecuta fases de soldadura. |
| Mecanizado | Ejecuta fases de mecanizado. |
| Generadores | Trabaja componentes de generadores. |
| Ingenieros | Revisan, aprueban y hacen seguimiento; usuarios del asistente de IA. |
| Usuario Global | Visión completa del sistema (administración / dirección). |
| Operadores | Ejecutan fases y reportan avance. |
| Almacén | Gestiona repuestos, consumos y existencias. |
| Ventas | Consulta estado y compromete entregas. |
| Taller | Ejecuta trabajos y reporta novedades. |

Implicaciones que **no** debes asumir sin preguntar: jerarquía de permisos, quién
puede crear/aprobar/cerrar una hoja de ruta, si un usuario puede tener varios
roles, y si las áreas son un catálogo fijo o configurable.

## 4. Visión funcional

Deseable a futuro (nada de esto está implementado todavía):

- CRUD de hojas de ruta, componentes, partes y repuestos.
- Trazabilidad por fase: responsable, fechas, estado, observaciones.
- Visualización del proceso productivo. Se evaluó **BPMN** para modelar y mostrar
  el flujo; la idea evolucionó hacia un **asistente de IA** que ayude al ingeniero
  a tomar decisiones y hacer seguimiento. **Ambas ideas están en evaluación**: si
  se retoman, pregunta cuál es la prioridad y con qué datos se alimentaría la IA.
- Reportes, exportaciones y notificaciones (módulos pendientes de definir).

## 5. Estado actual del repositorio

- Monorepo Turborepo + pnpm con `apps/frontend`, `apps/backend` y `packages/shared`.
- Auth JWT contra PostgreSQL; `pnpm db:seed` crea catálogos, el administrador
  (`admin` / `admin1234`) y, fuera de producción, un usuario demo por rol
  (contraseña `demo1234`). Endpoints: `/api/health`, `/api/auth/*`, `/api/users`,
  `/api/catalogs`.
- Prisma 7 con el modelo de dominio completo en `apps/backend/prisma/schema.prisma`;
  la documentación funcional y los diagramas están en `docs/domain-model.md`.
- Deploy de QA preparado: `apps/frontend/vercel.json` y `render.yaml`.
- **Conectado**: login, sesión JWT, `/auth/me`, usuarios, catálogos, clientes,
  sitios, equipos, proyectos y órdenes de servicio.
- **Pendiente**: migrar inspecciones, tareas, hojas de ruta, anexos, calidad,
  almacén, planta, analítica y auditoría desde el preview en `localStorage` a la
  API, fase por fase.

## 6. Antes de implementar dominio: pregunta

> El esquema inicial ya se implementó a partir de `doc.md`; ver
> `docs/domain-model.md`. Estas preguntas siguen vigentes para nuevos requisitos
> o cambios de alcance.

Este proyecto se está definiendo mientras se construye. Antes de crear tablas,
migraciones, endpoints o pantallas de negocio, **haz estas preguntas** (las que
apliquen) y espera respuesta:

1. ¿Qué campos mínimos definen una hoja de ruta y cuál es su ciclo de vida
   (estados y transiciones)?
2. ¿Quién crea, quién aprueba y quién puede modificar cada fase?
3. ¿La hoja de ruta referencia un componente existente o se crea junto con él?
4. ¿Cómo se relacionan componente ↔ partes ↔ repuestos (cantidades, sustitutos,
   inventario, consumos)?
5. ¿Las áreas son un catálogo fijo o configurable? ¿Una parte pasa por varias
   áreas en un orden definido o depende del componente?
6. ¿Se registran tiempos, operarios, máquinas o consumos por fase?
7. ¿Qué puede ver y hacer cada rol, y qué significa exactamente "Usuario Global"?
8. ¿Qué preguntas debe resolver el asistente de IA y con qué datos?
9. ¿Se retoma BPMN, se descarta o convive con el asistente?
10. ¿Qué debe estar funcionando en el primer release para que el negocio lo use?

Reglas de trabajo:

- **No inventes reglas de negocio** ni nombres de entidades: propón y confirma.
- Si un requisito contradice el código existente, pregunta antes de refactorizar.
- Toda decisión de dominio relevante debe quedar escrita (README, comentario o
  `docs/`), no solo en el chat.

## 7. Stack y estructura

```
TurboPre/
├─ apps/frontend/     React 19 · Vite 8 · TS · Tailwind 4 · shadcn/ui
├─ apps/backend/      NestJS 12 · Prisma 7 · PostgreSQL · JWT
├─ packages/shared/   @turbopre/shared: esquemas zod y tipos compartidos
├─ turbo.json · pnpm-workspace.yaml · render.yaml
└─ apps/frontend/vercel.json
```

## 8. Comandos

| Comando | Uso |
| --- | --- |
| `pnpm install` | Instala el workspace y genera el cliente Prisma. |
| `pnpm dev` | Frontend :5173 + API :3000 + `shared` en watch. |
| `pnpm check-types` | `tsc` en los tres paquetes. |
| `pnpm lint` | oxlint en los tres paquetes. |
| `pnpm build` | Compila `shared` y luego ambas apps. |
| `pnpm --filter frontend add <pkg>` | Dependencia solo del frontend. |
| `pnpm --filter backend add <pkg>` | Dependencia solo del backend. |
| `pnpm db:migrate` / `db:seed` / `db:studio` | Prisma en el backend. |

## 9. Convenciones

- **Contratos primero**: los esquemas zod y los tipos de request/response viven en
  `packages/shared` y los consumen ambas apps. Si cambias un contrato, recompila
  `shared` (`pnpm --filter @turbopre/shared build`).
- **Idioma**: identificadores, archivos y commits en inglés; textos de interfaz,
  mensajes de error y documentación para el negocio en español.
- **Backend**: ESM (imports relativos con `.js`), validación con
  `StandardSchemaValidationPipe` + zod, `PrismaService` extiende `PrismaClient`
  con pool de `pg` y conexión al arranque. Nunca edites
  `apps/backend/src/generated/prisma`.
- **Frontend**: rutas lazy, server state con TanStack Query, estado global con
  zustand, llamadas HTTP solo a través de `services/<dominio>/`. Detalles en
  `apps/frontend/AGENTS.md`.
- **Antes de decir "listo"**: `pnpm check-types`, `pnpm lint` y `pnpm build`
  deben pasar; si tocaste el backend, prueba `/api/health` y el login.

## 10. Entornos y deploy de QA

- **Frontend**: Vercel con Root Directory `apps/frontend`. El `vercel.json`
  proxya `/api/*` al backend de Render (así no hay CORS) y hace fallback SPA.
- **Backend**: Render como Web Service desde la raíz del repo (no `apps/backend`,
  Render oculta los archivos fuera del root directory). `render.yaml` define el
  build, el start, el health check y las variables.
- **Variables críticas en QA**: `JWT_SECRET` real, `DATABASE_URL` y
  `CORS_ORIGIN` (soporta comas y comodines `https://*.vercel.app`).
- Tras cambiar el host del backend hay que actualizar el `destination` del
  rewrite en `apps/frontend/vercel.json` y redeployar el frontend.

## 11. Gotchas del entorno

- pnpm 11 bloquea scripts de instalación: los permitidos están en `allowBuilds`
  de `pnpm-workspace.yaml`.
- TypeScript 7 eliminó `baseUrl`: los alias usan solo `paths`.
- shadcn v4 no tiene componente `Form`: se usan `Controller` + `Field`.
- Prisma 7 exige driver adapter (`@prisma/adapter-pg`) y genera el cliente en
  `src/generated/prisma`.
- El login requiere `DATABASE_URL` y que se haya ejecutado `pnpm db:seed`. El
  administrador semilla es `admin` / `admin1234`; los usuarios demo de QA usan
  `demo1234`. No hay usuario demo en memoria.
