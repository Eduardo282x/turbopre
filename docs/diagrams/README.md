# Diagramas CAMI

Diagramas de proceso del sistema CAMI/TurboPre en formato Mermaid.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `01-general-flow.mmd` | Flujo macro: ODS → Inspección → Hoja de ruta → Anexos → Calidad → Entrega. |
| `02-service-order-states.mmd` | Estados de la Orden de Servicio (ODS). |
| `03-inspection-states.mmd` | Estados de la inspección. |
| `04-route-sheet-states.mmd` | Estados de la hoja de ruta. |
| `05-task-execution.mmd` | Ejecución de tareas y bloqueo por etapa. |
| `06-annexes-quality.mmd` | Revisión de anexos, Calidad y entrega. |
| `07-warehouse-flow.mmd` | Solicitudes, préstamos, stock y calibración. |
| `08-route-creation-sequence.mmd` | Secuencia de creación y aprobación de la hoja de ruta. |
| `09-execution-delivery-sequence.mmd` | Secuencia de ejecución, anexos, Calidad y entrega. |

## Cómo usarlos

1. Abre [Mermaid Live Editor](https://mermaid.live) o el editor Mermaid de tu preferencia.
2. Copia el contenido completo del archivo `.mmd`.
3. Pégalo en el editor.

También puedes insertarlo en Markdown:

````markdown
```mermaid
flowchart TD
  A --> B
```
````

## Modelo de datos

El archivo `../dbdiagram-es.dbml` contiene la traducción del esquema Prisma a
DBML en español para pegarlo en [dbdiagram.io](https://dbdiagram.io).
