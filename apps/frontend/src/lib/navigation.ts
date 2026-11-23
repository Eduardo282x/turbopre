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
  'ADMIN',
  'SALES',
  'WORKSHOP',
  'ENGINEER',
  'OPERATOR',
  'QUALITY',
  'PROJECT_MANAGER',
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
        roles: ['ADMIN', 'WORKSHOP', 'ENGINEER', 'OPERATOR', 'QUALITY', 'PROJECT_MANAGER'],
        end: true,
      },
      {
        label: 'Mis tareas',
        to: '/mis-tareas',
        icon: ListChecks,
        roles: ['ENGINEER', 'OPERATOR', 'QUALITY'],
        badge: 'tasks',
      },
      {
        label: 'Aprobaciones',
        to: '/aprobaciones',
        icon: BadgeCheck,
        roles: ['ADMIN', 'PROJECT_MANAGER'],
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
        roles: ['ADMIN', 'SALES', 'WORKSHOP'],
      },
      {
        label: 'Hojas de ruta',
        to: '/hojas-de-ruta',
        icon: FolderKanban,
        roles: ['ADMIN', 'SALES', 'WORKSHOP', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER'],
      },
      {
        label: 'Historial',
        to: '/historial',
        icon: History,
        roles: ['ADMIN', 'SALES', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER'],
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
        roles: ['ADMIN', 'WORKSHOP'],
        end: true,
      },
      {
        label: 'Inspecciones',
        to: '/taller/inspecciones',
        icon: ClipboardCheck,
        roles: ['ADMIN', 'WORKSHOP', 'ENGINEER'],
      },
      {
        label: 'Repuestos',
        to: '/taller/repuestos',
        icon: Wrench,
        roles: ['ADMIN', 'WORKSHOP', 'ENGINEER', 'OPERATOR'],
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
        roles: ['ADMIN', 'SALES'],
        end: true,
      },
      {
        label: 'Clientes',
        to: '/ventas/clientes',
        icon: Building2,
        roles: ['ADMIN', 'SALES'],
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
        roles: ['ADMIN', 'ENGINEER'],
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
        roles: ['ADMIN', 'WAREHOUSE'],
      },
      {
        label: 'Solicitudes',
        to: '/almacen/solicitudes',
        icon: Package,
        roles: ['ADMIN', 'WAREHOUSE'],
        badge: 'requests',
      },
      {
        label: 'Préstamos',
        to: '/almacen/prestamos',
        icon: HandCoins,
        roles: ['ADMIN', 'WAREHOUSE'],
      },
      {
        label: 'Calibración',
        to: '/almacen/calibracion',
        icon: CalendarClock,
        roles: ['ADMIN', 'WAREHOUSE'],
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
        roles: ['ADMIN', 'ENGINEER', 'PROJECT_MANAGER'],
      },
      {
        label: 'Mapa de planta',
        to: '/planta',
        icon: Map,
        roles: ['ADMIN', 'WORKSHOP', 'PROJECT_MANAGER'],
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
        roles: ['ADMIN'],
      },
      {
        label: 'Auditoría',
        to: '/administracion/auditoria',
        icon: ShieldCheck,
        roles: ['ADMIN'],
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
