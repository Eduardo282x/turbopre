# TurboPre — Frontend preview (sin backend)

Este documento describe el modo preview del frontend adaptado desde
`apps/frontend/reference/`. **No hay conexión al backend**: los datos viven en
`localStorage` y se pueden restablecer desde Configuración.

## Alcance

- Login de vidrio con selector rápido de usuarios y roles.
- Shell con sidebar agrupado, topbar, reloj, temas y cambio de usuario.
- **Expediente de servicio** como entidad central para taller, campo, proyectos y suministro.
- Dashboard, hojas de ruta, partes, fases, repuestos, inspecciones,
  aprobaciones, tareas, almacén, calidad/NDT, análisis, mapa de planta,
  usuarios, auditoría y configuración.
- Tabla reutilizable propia (búsqueda, orden, paginado y acciones por fila).
- Gráficas con shadcn Chart + Recharts.
- Temas `dark` (por defecto), `light` y `pastel`.

## Modelo provisional

El modelo del preview está aislado en `src/features/preview/` y **no** define el
esquema definitivo de Prisma:

- `ExpedienteServicio` (`ServiceOrder`): código, modo (`SHOP`, `FIELD`, `PROJECT`,
  `SUPPLY`), estado, cliente, activo, sitio, alcance, prioridad y fechas.
- `Activo` (`Asset`): tipo, fabricante, modelo, serie, tag, potencia, tecnología
  y ubicación.
- `HojaDeRuta`: plan de ejecución con partes, fases, repuestos y recursos.
- `Parte`: nombre, cantidad, estado y área actual.
- `Fase`: parte, área, orden, tipo (`WORK`, `INSPECTION`, `QUALITY`), estado,
  responsable, fechas, observaciones y evidencia.
- `Repuesto`: nombre, código, cantidad, estado, área y hoja.
- `RegistroCalidad`: tipo (NDT, eléctrica, dimensional, balanceo, recubrimiento,
  tratamiento térmico, visual, final), método, norma, criterio, resultado,
  inspector y certificado.
- `NoConformidad`: hallazgo, severidad, estado, acción correctiva y responsable.
- `TrabajoCampo` (`FieldJob`): sitio, permisos, AST, cuadrilla, contenedores,
  grúas, movilización y reporte.
- `Proyecto`: fase, hitos y avance.
- `OrdenSuministro`: ítems, proveedor, OC, fechas y estado.
- `PlantillaServicio`: secuencia de fases por tipo de alcance.
- `Instrumento/Inventario`: QR, marcado láser, atmósfera controlada,
  certificado y calibración.
- `Usuario`: rol y área operativa.
- `Cliente`, `Préstamo` y `Auditoría`.

## Secciones y modos

Se modelan las diez secciones reales del taller: izamiento y ensamble,
mecanizado mayor, mecanizado menor, balanceo, soldaduras especiales,
generadores eléctricos, tratamiento térmico y recubrimientos, metrología,
almacén de materiales y administración. También se incluyen las disciplinas de
campo (gas, vapor, generadores, ingeniería/NDT) y las áreas de proyectos y
suministro.

Los modos del expediente son:

- **Taller**: recepción, diagnóstico, planificación, ejecución por sección,
  calidad/NDT, pruebas finales y entrega.
- **Campo**: permisos, AST, cuadrilla, movilización, ejecución, reporte y
  desmovilización.
- **Proyecto**: ingeniería, procura, construcción, precomisionamiento y
  comisionamiento.
- **Suministro**: cotización, compra, inspección de recepción, despacho y
  entrega.

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
`Servicios de Taller`, `Jefe de Sección`, `Operador` (Turbinas, Soldadura,
Mecanizado o Generadores), `Almacén`, `Calidad`, `Inspector NDT`,
`Metrólogo`, `Supervisor de Campo`, `Gerente de Proyecto`, `Seguridad y
Ambiente` y `Procura`.

La navegación y el acceso directo por URL se controlan desde
`src/lib/navigation.ts` y `src/components/auth/role-guard.tsx`.

## Rutas principales

| Ruta | Módulo |
| --- | --- |
| `/` | Centro de control |
| `/expedientes` | Expedientes de servicio |
| `/expedientes/:id` | Detalle: activo, hoja, calidad, NC y operación |
| `/mis-tareas` | Tareas por área/rol |
| `/aprobaciones` | Aprobación técnica |
| `/hojas-de-ruta` | Hojas de ruta |
| `/hojas-de-ruta/:id` | Detalle: partes, fases, repuestos, evidencias y auditoría |
| `/hojas-de-ruta/historial` | Historial |
| `/ventas` | Panel comercial |
| `/ventas/clientes` | Clientes |
| `/taller` | Panel de taller y secciones |
| `/taller/inspecciones` | Inspecciones |
| `/taller/repuestos` | Solicitudes de repuestos |
| `/campo` | Servicios de campo y movilizaciones |
| `/proyectos` | Proyectos electromecánicos |
| `/suministro` | Suministro de componentes |
| `/almacen/inventario` | Inventario |
| `/almacen/solicitudes` | Despacho de solicitudes |
| `/almacen/prestamos` | Préstamos y devoluciones |
| `/almacen/calibracion` | Calibración de instrumentos |
| `/calidad/tareas` | Tareas de calidad |
| `/calidad/visto-bueno` | Visto bueno final |
| `/calidad/registros` | Registros NDT y pruebas |
| `/calidad/no-conformidades` | No conformidades |
| `/calidad/historial` | Historial de calidad |
| `/analitica/rendimiento` | Rendimiento de planta |
| `/planta` | Mapa de planta |
| `/administracion/usuarios` | Usuarios |
| `/administracion/auditoria` | Auditoría |
| `/ajustes` | Perfil, tema y reset |

## Calidad, campo, proyectos y suministro

- **Calidad/NDT**: registros con método, norma, criterio, resultado, inspector y
  certificado. Se incluyen VT, PT, MT, UT, Phased Array y Eddy Current, además
  de pruebas eléctricas, dimensionales, balanceo, recubrimientos y tratamiento
  térmico.
- **No conformidades**: severidad, estado, acción correctiva y cierre.
- **Campo**: sitio, permisos, AST, cuadrilla, contenedores, grúas, movilización,
  desmovilización y reporte.
- **Proyectos**: fases de ingeniería, procura, construcción, precomisionamiento
  y comisionamiento, con hitos y avance.
- **Suministro**: ítems, proveedor, orden de compra, fecha esperada y entrega.
- **Calibración**: instrumentos con certificado, vencimiento y estado
  (`Vigente`, `Por vencer`, `Vencida`).

## Datos de prueba

- Semilla en `src/features/preview/data/seed.ts`.
- Store en `src/features/preview/store/preview-store.ts` (zustand + persist).
- Sesión en `src/features/preview/store/preview-session.ts`.
- La semilla incluye casos alineados a la web: Siemens W501 FD3, Rolls Royce
  Avon, Elliot, GE 7E/7FA, reparación de rotor de vapor, rebobinado de
  generador, balanceo, NDT, campo, proyecto y suministro.
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
