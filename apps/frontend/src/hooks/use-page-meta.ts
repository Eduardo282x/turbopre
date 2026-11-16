import { useLocation } from 'react-router';
import { findNavItem } from '@/lib/navigation';

const SUBTITLES: Record<string, string> = {
  '/': 'Resumen general del taller, hojas de ruta y carga por área.',
  '/mis-tareas': 'Fases asignadas a tu área y pendientes por ejecutar.',
  '/aprobaciones': 'Hojas de ruta pendientes de revisión técnica.',
  '/hojas-de-ruta': 'Orquestación de componentes, partes, repuestos y fases.',
  '/hojas-de-ruta/historial': 'Hojas de ruta aprobadas, ejecutadas y entregadas.',
  '/ventas': 'Estado de las hojas de ruta y compromisos de entrega.',
  '/ventas/clientes': 'Cartera de clientes y su actividad reciente.',
  '/taller/inspecciones': 'Solicitudes y fases de inspección de las áreas.',
  '/taller/repuestos': 'Solicitudes de repuestos para las hojas activas.',
  '/almacen/inventario': 'Existencias, ubicaciones y disponibilidad.',
  '/almacen/solicitudes': 'Pedidos de taller e ingeniería pendientes de despacho.',
  '/almacen/prestamos': 'Entregas y devoluciones de herramientas.',
  '/calidad/tareas': 'Fases de calidad y evidencias pendientes de revisión.',
  '/calidad/visto-bueno': 'Hojas de ruta pendientes del visto bueno final.',
  '/calidad/historial': 'Equipos aprobados y listos para entrega.',
  '/analitica/rendimiento': 'Tiempos, carga y productividad por área.',
  '/planta': 'Ubicación física de las hojas de ruta activas.',
  '/administracion/usuarios': 'Usuarios, roles y áreas operativas.',
  '/administracion/auditoria': 'Registro histórico de acciones del sistema.',
  '/ajustes': 'Perfil, tema, datos de prueba y preferencias.',
};

export interface PageMeta {
  title: string;
  subtitle: string;
}

export function usePageMeta(): PageMeta {
  const { pathname } = useLocation();
  if (pathname.startsWith('/hojas-de-ruta/') && pathname !== '/hojas-de-ruta/historial') {
    return {
      title: 'Detalle de hoja de ruta',
      subtitle: 'Partes, repuestos, fases, evidencias y auditoría del expediente.',
    };
  }
  const item = findNavItem(pathname);
  return {
    title: item?.label ?? 'TurboPre',
    subtitle: SUBTITLES[item?.to ?? pathname] ?? 'Sistema de gestión de componentes de turbinas.',
  };
}
