import { useLocation } from 'react-router';
import { findNavItem } from '@/lib/navigation';

const SUBTITLES: Record<string, string> = {
  '/': 'Resumen de órdenes de servicio, inspecciones, hojas de ruta y carga por proceso.',
  '/ordenes-servicio': 'Órdenes creadas por Ventas: cliente, equipo, alcance y prioridad.',
  '/mis-tareas': 'Hojas completas donde tienes tareas; solo tu tarea de la etapa activa se puede marcar lista.',
  '/aprobaciones': 'Hojas de ruta pendientes de la aprobación del Gerente.',
  '/hojas-de-ruta': 'Secuencia de tareas por etapa y puesto. La inspección aprobada se copia como primeros pasos.',
  '/historial': 'Órdenes de servicio y hojas de ruta con su estado y fechas clave.',
  '/ventas': 'Órdenes de servicio, compromisos de entrega y estado de los clientes.',
  '/ventas/clientes': 'Cartera de clientes y su actividad reciente.',
  '/taller': 'Inspecciones, procesos de taller y carga de trabajo por puesto.',
  '/taller/inspecciones': 'Inspecciones creadas desde la ODS y tareas por proceso, puesto y etapa.',
  '/taller/repuestos': 'Solicitudes multi-línea: Almacén o Procura según disponibilidad.',
  '/proyectos': 'Cartera de proyectos de ingeniería y su avance por hitos.',
  '/almacen/inventario': 'Existencias, ubicaciones y disponibilidad.',
  '/almacen/solicitudes': 'Solicitudes de taller por despachar o recibir de Procura.',
  '/almacen/prestamos': 'Entregas y devoluciones de herramientas.',
  '/almacen/calibracion': 'Instrumentos, certificados y vencimientos de calibración.',
  '/analitica/rendimiento': 'Carga y tiempos por proceso y puesto.',
  '/planta': 'Ubicación física de las hojas activas según su etapa actual.',
  '/administracion/usuarios': 'Usuarios, roles y puestos de trabajo.',
  '/administracion/auditoria': 'Registro histórico de acciones del sistema.',
  '/ajustes': 'Perfil, tema y datos de demostración.',
};

export interface PageMeta {
  title: string;
  subtitle: string;
}

export function usePageMeta(): PageMeta {
  const { pathname } = useLocation();

  if (pathname.startsWith('/ordenes-servicio/')) {
    return {
      title: 'Detalle de la orden de servicio',
      subtitle: 'Cliente, equipo, inspección, hoja de ruta e historial.',
    };
  }
  if (pathname === '/hojas-de-ruta/nueva') {
    return {
      title: 'Nueva hoja de ruta',
      subtitle: 'Cabezal, inspección de origen y tareas por etapa y puesto.',
    };
  }
  if (pathname.startsWith('/hojas-de-ruta/') && pathname !== '/hojas-de-ruta') {
    return {
      title: 'Detalle de la hoja de ruta',
      subtitle: 'Cabezal, tareas, repuestos, anexos, calidad e historial.',
    };
  }
  if (pathname.startsWith('/taller/inspecciones/')) {
    return {
      title: 'Detalle de la inspección',
      subtitle: 'Hallazgos, tareas por etapa y aprobación de Taller.',
    };
  }

  const item = findNavItem(pathname);
  return {
    title: item?.label ?? 'CAMI',
    subtitle: SUBTITLES[item?.to ?? pathname] ?? 'Control Automatizado de Mantenimiento Industrial.',
  };
}
