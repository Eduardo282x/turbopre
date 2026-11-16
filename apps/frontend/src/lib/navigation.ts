import {
  BarChart3,
  BadgeCheck,
  Boxes,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Factory,
  FileCheck2,
  FolderKanban,
  Gauge,
  HandCoins,
  History,
  LayoutDashboard,
  ListChecks,
  Map,
  MapPinned,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
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
  'FIELD',
  'PROJECT',
  'NDT',
  'METROLOGY',
  'HSE',
  'PROCUREMENT',
  'SECTION_CHIEF',
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
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'QUALITY', 'FIELD', 'SECTION_CHIEF', 'NDT', 'METROLOGY'],
        badge: 'tasks',
      },
      {
        label: 'Aprobaciones',
        to: '/aprobaciones',
        icon: BadgeCheck,
        roles: ['GLOBAL', 'ENGINEERING', 'SECTION_CHIEF'],
        badge: 'approvals',
      },
    ],
  },
  {
    label: 'Expedientes',
    items: [
      {
        label: 'Expedientes de servicio',
        to: '/expedientes',
        icon: ClipboardList,
        roles: ALL_ROLES,
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
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'QUALITY', 'SALES', 'FIELD', 'PROJECT', 'SECTION_CHIEF', 'NDT'],
      },
      {
        label: 'Historial',
        to: '/hojas-de-ruta/historial',
        icon: History,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'QUALITY', 'SALES', 'PROJECT', 'SECTION_CHIEF'],
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
        label: 'Panel de taller',
        to: '/taller',
        icon: Factory,
        roles: ['GLOBAL', 'WORKSHOP', 'SECTION_CHIEF', 'ENGINEERING', 'OPERATOR'],
        end: true,
      },
      {
        label: 'Inspecciones',
        to: '/taller/inspecciones',
        icon: ClipboardCheck,
        roles: ['GLOBAL', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'SECTION_CHIEF', 'NDT', 'FIELD'],
      },
      {
        label: 'Repuestos',
        to: '/taller/repuestos',
        icon: Wrench,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'SECTION_CHIEF', 'PROCUREMENT'],
        badge: 'requests',
      },
    ],
  },
  {
    label: 'Campo',
    items: [
      {
        label: 'Servicios de campo',
        to: '/campo',
        icon: MapPinned,
        roles: ['GLOBAL', 'FIELD', 'PROJECT', 'HSE', 'WORKSHOP', 'ENGINEERING', 'SECTION_CHIEF'],
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
        roles: ['GLOBAL', 'PROJECT', 'ENGINEERING', 'PROCUREMENT', 'HSE'],
      },
    ],
  },
  {
    label: 'Suministro',
    items: [
      {
        label: 'Suministro',
        to: '/suministro',
        icon: Truck,
        roles: ['GLOBAL', 'PROCUREMENT', 'SALES', 'WAREHOUSE', 'PROJECT'],
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
        roles: ['GLOBAL', 'WAREHOUSE', 'METROLOGY'],
      },
      {
        label: 'Solicitudes',
        to: '/almacen/solicitudes',
        icon: Package,
        roles: ['GLOBAL', 'WAREHOUSE', 'METROLOGY'],
        badge: 'requests',
      },
      {
        label: 'Préstamos',
        to: '/almacen/prestamos',
        icon: HandCoins,
        roles: ['GLOBAL', 'WAREHOUSE', 'METROLOGY'],
      },
      {
        label: 'Calibración',
        to: '/almacen/calibracion',
        icon: CalendarClock,
        roles: ['GLOBAL', 'WAREHOUSE', 'METROLOGY', 'QUALITY'],
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
        roles: ['GLOBAL', 'QUALITY', 'NDT', 'SECTION_CHIEF'],
        badge: 'tasks',
      },
      {
        label: 'Visto bueno',
        to: '/calidad/visto-bueno',
        icon: CheckCircle2,
        roles: ['GLOBAL', 'QUALITY', 'NDT'],
        badge: 'quality',
      },
      {
        label: 'Registros NDT / pruebas',
        to: '/calidad/registros',
        icon: FileCheck2,
        roles: ['GLOBAL', 'QUALITY', 'NDT', 'ENGINEERING', 'SECTION_CHIEF'],
      },
      {
        label: 'No conformidades',
        to: '/calidad/no-conformidades',
        icon: Gauge,
        roles: ['GLOBAL', 'QUALITY', 'NDT', 'ENGINEERING', 'HSE', 'SECTION_CHIEF'],
      },
      {
        label: 'Historial',
        to: '/calidad/historial',
        icon: History,
        roles: ['GLOBAL', 'QUALITY', 'NDT'],
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
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'SALES', 'PROJECT', 'FIELD', 'SECTION_CHIEF', 'NDT'],
      },
      {
        label: 'Mapa de planta',
        to: '/planta',
        icon: Map,
        roles: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'FIELD', 'SECTION_CHIEF'],
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
