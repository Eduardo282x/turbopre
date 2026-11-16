# TurboPre — Frontend preview (sin backend)

Este documento describe el modo preview del frontend adaptado desde
`apps/frontend/reference/`. **No hay conexión al backend**: los datos viven en
`localStorage` y se pueden restablecer desde Configuración.

## Alcance

- Login de vidrio con selector rápido de usuarios y roles.
- Shell con sidebar agrupado, topbar, reloj, temas y cambio de usuario.
- Dashboard, hojas de ruta, partes, fases, repuestos, inspecciones,
  aprobaciones, tareas, almacén, calidad, análisis, mapa de planta,
  usuarios, auditoría y configuración.
- Tabla reutilizable propia (búsqueda, orden, paginado y acciones por fila).
- Gráficas con shadcn Chart + Recharts.
- Temas `dark` (por defecto), `light` y `pastel`.

## Modelo provisional

El modelo del preview está aislado en `src/features/preview/` y **no** define el
esquema definitivo de Prisma:

- `HojaDeRuta`: código, componente, cliente, estado, prioridad, fechas.
- `Componente`: nombre, serial y tipo.
- `Parte`: nombre, cantidad, estado y área actual.
- `Fase`: parte, área, orden, tipo (`WORK`, `INSPECTION`, `QUALITY`), estado,
  responsable, fechas, observaciones y evidencia.
- `Repuesto`: nombre, código, cantidad, estado, área y hoja.
- `Usuario`: rol y área operativa.
- `Cliente`, `Inventario`, `Préstamo` y `Auditoría`.

## Tabla reutilizable

`DataTable<T>` vive en `src/components/table-kit/table.tsx`. Recibe datos,
columnas, búsqueda, filtros, acciones por fila y paginado:

```tsx
<DataTable
  data={routes}
  columns={columns}
  getRowId={(route) => route.id}
  search={{ placeholder: 'Buscar…', getText: (route) => route.code }}
  filters={<Select … />}
  actions={[
    { label: 'Ver', icon: Eye, onSelect: handleView },
    { label: 'Editar', icon: Pencil, onSelect: handleEdit },
    { label: 'Eliminar', icon: Trash2, variant: 'destructive', onSelect: handleDelete },
  ]}
  pageSize={10}
  onRowClick={handleView}
/>
```

Incluye ordenamiento opcional por columna (`sortable` + `sortValue`), estado
vacío, loading, acciones ocultables por fila y confirmaciones destructivas con
`ConfirmDialog`.

## Ciclo de vida acordado

`Borrador → En revisión → Aprobada → En ejecución → En calidad → Lista para entrega → Entregada`

- Planificación y Diseño crea la hoja, las partes y sus secuencias de áreas.
- Ingeniería revisa y aprueba; un rechazo devuelve a borrador.
- Taller y Operadores ejecutan las fases. Una fase se bloquea hasta que la
  anterior de la misma parte esté completada.
- Almacén abastece los repuestos.
- Calidad da el visto bueno final o devuelve a ejecución.
- Ventas consulta estados y confirma la entrega.

## Roles del preview

`Usuario Global`, `Planificación y Diseño`, `Ingeniería`, `Ventas`,
`Servicios de Taller`, `Operador` (con área: Turbinas, Soldadura, Mecanizado o
Generadores), `Almacén` y `Calidad`.

La navegación y el acceso directo por URL se controlan desde
`src/lib/navigation.ts` y `src/components/auth/role-guard.tsx`.

## Rutas principales

| Ruta | Módulo |
| --- | --- |
| `/` | Centro de control |
| `/mis-tareas` | Tareas por área/rol |
| `/aprobaciones` | Aprobación técnica |
| `/hojas-de-ruta` | Hojas de ruta |
| `/hojas-de-ruta/:id` | Detalle: partes, fases, repuestos, evidencias y auditoría |
| `/hojas-de-ruta/historial` | Historial |
| `/ventas` | Panel comercial |
| `/ventas/clientes` | Clientes |
| `/taller/inspecciones` | Inspecciones |
| `/taller/repuestos` | Solicitudes de repuestos |
| `/almacen/inventario` | Inventario |
| `/almacen/solicitudes` | Despacho de solicitudes |
| `/almacen/prestamos` | Préstamos y devoluciones |
| `/calidad/tareas` | Tareas de calidad |
| `/calidad/visto-bueno` | Visto bueno final |
| `/calidad/historial` | Historial de calidad |
| `/analitica/rendimiento` | Rendimiento de planta |
| `/planta` | Mapa de planta |
| `/administracion/usuarios` | Usuarios |
| `/administracion/auditoria` | Auditoría |
| `/ajustes` | Perfil, tema y reset |

## Datos de prueba

- Semilla en `src/features/preview/data/seed.ts`.
- Store en `src/features/preview/store/preview-store.ts` (zustand + persist).
- Sesión en `src/features/preview/store/preview-session.ts`.
- El botón **Restablecer datos** de Configuración vuelve a la semilla.
- El login acepta cualquier contraseña de 4+ caracteres para los usuarios
  existentes; la contraseña demo mostrada es `demo1234`.

## Cómo pasar al backend real

1. Definir el modelo y los contratos en `packages/shared`.
2. Reemplazar los selectores del store preview por consultas TanStack Query en
   `services/<dominio>/`.
3. Mantener `RoleGuard` y la configuración de navegación, pero cambiar la sesión
   de `usePreviewSession` por `useAuthStore`/JWT.
4. Eliminar o aislar `features/preview` cuando los endpoints estén disponibles.

## Assets

Los assets usados por la interfaz se copiaron a `src/assets/brand/`:

- `logo.png`
- `fondo.jpg`
- `plano.jpg`

La carpeta `apps/frontend/reference/` se conserva intacta como fuente del mockup.
