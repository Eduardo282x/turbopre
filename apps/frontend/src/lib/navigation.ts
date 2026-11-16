import {
  BarChart3,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FolderKanban,
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

const ALL_ROLES: RoleId[] = [
  'GLOBAL',
  'PLANNING',
  'ENGINEERING',
  'SALES',
  'WORKSHOP',
  'OPERATOR',
  'WAREHOUSE',
  'QUALITY',
];

export const NAVIGATION: NavGroup[] = [
  {
    label: 'General',
    items: [
      {
        label: 'Centro de control',
        to: '/',
        icon: LayoutDashboard,
        roles: ALL_ROLES,
        end: true,
      },
      {
        label: 'Mis tareas',
        to: '/mis-tareas',
        icon: ListChecks,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'QUALITY'],
        badge: 'tasks',
      },
      {
        label: 'Aprobaciones',
        to: '/aprobaciones',
        icon: BadgeCheck,
        roles: ['GLOBAL', 'ENGINEERING'],
        badge: 'approvals',
      },
    ],
  },
  {
    label: 'Planificación',
    items: [
      {
        label: 'Hojas de ruta',
        to: '/hojas-de-ruta',
        icon: FolderKanban,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'QUALITY', 'SALES'],
      },
      {
        label: 'Historial',
        to: '/hojas-de-ruta/historial',
        icon: History,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'QUALITY', 'SALES'],
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
        roles: ['GLOBAL', 'PLANNING', 'SALES'],
        end: true,
      },
      {
        label: 'Clientes',
        to: '/ventas/clientes',
        icon: Building2,
        roles: ['GLOBAL', 'PLANNING', 'SALES'],
      },
    ],
  },
  {
    label: 'Taller',
    items: [
      {
        label: 'Inspecciones',
        to: '/taller/inspecciones',
        icon: ClipboardCheck,
        roles: ['GLOBAL', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'],
      },
      {
        label: 'Repuestos',
        to: '/taller/repuestos',
        icon: Wrench,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'],
        badge: 'requests',
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
    ],
  },
  {
    label: 'Calidad',
    items: [
      {
        label: 'Mis tareas',
        to: '/calidad/tareas',
        icon: ListChecks,
        roles: ['GLOBAL', 'QUALITY'],
        badge: 'tasks',
      },
      {
        label: 'Visto bueno',
        to: '/calidad/visto-bueno',
        icon: CheckCircle2,
        roles: ['GLOBAL', 'QUALITY'],
        badge: 'quality',
      },
      {
        label: 'Historial',
        to: '/calidad/historial',
        icon: History,
        roles: ['GLOBAL', 'QUALITY'],
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
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'SALES'],
      },
      {
        label: 'Mapa de planta',
        to: '/planta',
        icon: Map,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'],
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

export { ALL_ROLES };
export const FACTORY_ICON = Factory;
