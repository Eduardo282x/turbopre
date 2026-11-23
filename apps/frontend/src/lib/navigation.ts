import {
  BadgeCheck,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FolderKanban,
  Gauge,
  HandCoins,
  History,
  LayoutDashboard,
  ListChecks,
  Map,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { RoleId } from '@/features/preview/types';

export type NavBadge = 'tasks' | 'approvals' | 'requests' | 'quality';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: RoleId[];
  end?: boolean;
  badge?: NavBadge;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const ALL_ROLES: RoleId[] = [
  'GLOBAL',
  'SALES',
  'WORKSHOP',
  'ENGINEERING',
  'OPERATOR',
  'QUALITY',
  'PROJECT',
  'WAREHOUSE',
];

export const NAVIGATION: NavGroup[] = [
  {
    label: 'General',
    items: [
      {
        label: 'Centro de control',
        to: '/',
        icon: LayoutDashboard,
        roles: ['GLOBAL', 'WORKSHOP', 'ENGINEERING', 'OPERATOR', 'QUALITY', 'PROJECT'],
        end: true,
      },
      {
        label: 'Mis tareas',
        to: '/mis-tareas',
        icon: ListChecks,
        roles: ['ENGINEERING', 'OPERATOR', 'QUALITY'],
        badge: 'tasks',
      },
      {
        label: 'Aprobaciones',
        to: '/aprobaciones',
        icon: BadgeCheck,
        roles: ['GLOBAL', 'PROJECT'],
        badge: 'approvals',
      },
    ],
  },
  {
    label: 'Operación',
    items: [
      {
        label: 'Órdenes de servicio',
        to: '/ordenes-servicio',
        icon: ClipboardList,
        roles: ['GLOBAL', 'SALES', 'WORKSHOP'],
      },
      {
        label: 'Hojas de ruta',
        to: '/hojas-de-ruta',
        icon: FolderKanban,
        roles: ['GLOBAL', 'SALES', 'WORKSHOP', 'ENGINEERING', 'QUALITY', 'PROJECT'],
      },
      {
        label: 'Historial',
        to: '/historial',
        icon: History,
        roles: ['GLOBAL', 'SALES', 'ENGINEERING', 'QUALITY', 'PROJECT'],
      },
    ],
  },
  {
    label: 'Taller',
    items: [
      {
        label: 'Panel de taller',
        to: '/taller',
        icon: Factory,
        roles: ['GLOBAL', 'WORKSHOP'],
        end: true,
      },
      {
        label: 'Inspecciones',
        to: '/taller/inspecciones',
        icon: ClipboardCheck,
        roles: ['GLOBAL', 'WORKSHOP', 'ENGINEERING'],
      },
      {
        label: 'Repuestos',
        to: '/taller/repuestos',
        icon: Wrench,
        roles: ['GLOBAL', 'WORKSHOP', 'ENGINEERING', 'OPERATOR'],
        badge: 'requests',
      },
    ],
  },
  {
    label: 'Comercial',
    items: [
      {
        label: 'Panel de ventas',
        to: '/ventas',
        icon: ShoppingCart,
        roles: ['GLOBAL', 'SALES'],
        end: true,
      },
      {
        label: 'Clientes',
        to: '/ventas/clientes',
        icon: Building2,
        roles: ['GLOBAL', 'SALES'],
      },
    ],
  },
  {
    label: 'Proyectos',
    items: [
      {
        label: 'Proyectos',
        to: '/proyectos',
        icon: Briefcase,
        roles: ['GLOBAL', 'ENGINEERING'],
      },
    ],
  },
  {
    label: 'Almacén',
    items: [
      {
        label: 'Inventario',
        to: '/almacen/inventario',
        icon: Boxes,
        roles: ['GLOBAL', 'WAREHOUSE'],
      },
      {
        label: 'Solicitudes',
        to: '/almacen/solicitudes',
        icon: Package,
        roles: ['GLOBAL', 'WAREHOUSE'],
        badge: 'requests',
      },
      {
        label: 'Préstamos',
        to: '/almacen/prestamos',
        icon: HandCoins,
        roles: ['GLOBAL', 'WAREHOUSE'],
      },
      {
        label: 'Calibración',
        to: '/almacen/calibracion',
        icon: CalendarClock,
        roles: ['GLOBAL', 'WAREHOUSE'],
      },
    ],
  },
  {
    label: 'Análisis',
    items: [
      {
        label: 'Rendimiento',
        to: '/analitica/rendimiento',
        icon: BarChart3,
        roles: ['GLOBAL', 'ENGINEERING', 'PROJECT'],
      },
      {
        label: 'Mapa de planta',
        to: '/planta',
        icon: Map,
        roles: ['GLOBAL', 'WORKSHOP', 'PROJECT'],
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        label: 'Usuarios',
        to: '/administracion/usuarios',
        icon: Users,
        roles: ['GLOBAL'],
      },
      {
        label: 'Auditoría',
        to: '/administracion/auditoria',
        icon: ShieldCheck,
        roles: ['GLOBAL'],
      },
      {
        label: 'Configuración',
        to: '/ajustes',
        icon: Settings,
        roles: ALL_ROLES,
      },
    ],
  },
];

export const NAV_ITEMS = NAVIGATION.flatMap((group) => group.items);

export function getNavigationForRole(role: RoleId): NavGroup[] {
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export function getAllowedRoles(pathname: string): RoleId[] {
  const sorted = [...NAV_ITEMS].sort((a, b) => b.to.length - a.to.length);
  const match = sorted.find(
    (item) =>
      pathname === item.to ||
      (item.to !== '/' && pathname.startsWith(`${item.to}/`)),
  );
  return match?.roles ?? ALL_ROLES;
}

export function findNavItem(pathname: string): NavItem | undefined {
  const sorted = [...NAV_ITEMS].sort((a, b) => b.to.length - a.to.length);
  return sorted.find(
    (item) =>
      pathname === item.to ||
      (item.to !== '/' && pathname.startsWith(`${item.to}/`)),
  );
}

export const QUALITY_QUEUE_ICON = CheckCircle2;
export const PERFORMANCE_ICON = Gauge;
export { Factory as FACTORY_ICON };
