import { createBrowserRouter, Navigate } from 'react-router';
import type { RoleId } from '@/features/preview/types';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleGuard } from '@/components/auth/role-guard';
import { RouteLoading } from '@/components/common/route-loading';
import { Layout } from '@/components/layout/layout';
import { ALL_ROLES } from '@/lib/navigation';

const roles = {
  all: ALL_ROLES,
  serviceOrders: ['ADMIN', 'SALES', 'WORKSHOP'] as const,
  routeList: ['ADMIN', 'SALES', 'WORKSHOP', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER'] as const,
  routeView: ['ADMIN', 'SALES', 'WORKSHOP', 'ENGINEER', 'OPERATOR', 'QUALITY', 'PROJECT_MANAGER'] as const,
  routeManage: ['ADMIN', 'ENGINEER'] as const,
  tasks: ['ENGINEER', 'OPERATOR', 'QUALITY'] as const,
  approvals: ['ADMIN', 'PROJECT_MANAGER'] as const,
  history: ['ADMIN', 'SALES', 'ENGINEER', 'QUALITY', 'PROJECT_MANAGER'] as const,
  sales: ['ADMIN', 'SALES'] as const,
  workshop: ['ADMIN', 'WORKSHOP'] as const,
  inspections: ['ADMIN', 'WORKSHOP', 'ENGINEER'] as const,
  inspectionView: ['ADMIN', 'WORKSHOP', 'ENGINEER', 'OPERATOR', 'QUALITY'] as const,
  spares: ['ADMIN', 'WORKSHOP', 'ENGINEER', 'OPERATOR'] as const,
  projects: ['ADMIN', 'ENGINEER'] as const,
  warehouse: ['ADMIN', 'WAREHOUSE'] as const,
  analytics: ['ADMIN', 'ENGINEER', 'PROJECT_MANAGER'] as const,
  plant: ['ADMIN', 'WORKSHOP', 'PROJECT_MANAGER'] as const,
  admin: ['ADMIN'] as const,
};

const roleList = (value: readonly RoleId[]): RoleId[] => [...value];

export const router = createBrowserRouter([
  {
    path: '/login',
    HydrateFallback: RouteLoading,
    lazy: async () => {
      const { LoginPage } = await import('@/pages/auth/login-page');
      return { Component: LoginPage };
    },
  },
  {
    element: <ProtectedRoute />,
    HydrateFallback: RouteLoading,
    children: [
      {
        element: <Layout />,
        children: [
          {
            element: <RoleGuard roles={roleList(roles.all)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { DashboardPage } = await import('@/pages/dashboard/dashboard-page');
                  return { Component: DashboardPage };
                },
              },
            ],
          },
          {
            path: 'ordenes-servicio',
            element: <RoleGuard roles={roleList(roles.serviceOrders)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { ServiceOrdersPage } = await import('@/pages/service-orders/service-orders-page');
                  return { Component: ServiceOrdersPage };
                },
              },
              {
                path: ':id',
                lazy: async () => {
                  const { ServiceOrderDetailPage } = await import(
                    '@/pages/service-orders/service-order-detail-page'
                  );
                  return { Component: ServiceOrderDetailPage };
                },
              },
            ],
          },
          {
            path: 'expedientes',
            element: <Navigate to="/ordenes-servicio" replace />,
          },
          {
            path: 'expedientes/:id',
            element: <RoleGuard roles={roleList(roles.serviceOrders)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { ServiceOrderDetailPage } = await import(
                    '@/pages/service-orders/service-order-detail-page'
                  );
                  return { Component: ServiceOrderDetailPage };
                },
              },
            ],
          },
          {
            path: 'hojas-de-ruta',
            element: <RoleGuard roles={roleList(roles.routeList)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { RouteSheetsPage } = await import('@/pages/route-sheets/route-sheets-page');
                  return { Component: RouteSheetsPage };
                },
              },
            ],
          },
          {
            path: 'hojas-de-ruta/nueva',
            element: <RoleGuard roles={roleList(roles.routeManage)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { RouteSheetEditorPage } = await import(
                    '@/pages/route-sheets/route-sheet-editor-page'
                  );
                  return { Component: RouteSheetEditorPage };
                },
              },
            ],
          },
          {
            path: 'hojas-de-ruta/:id',
            element: <RoleGuard roles={roleList(roles.routeView)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { RouteSheetDetailPage } = await import(
                    '@/pages/route-sheets/route-sheet-detail-page'
                  );
                  return { Component: RouteSheetDetailPage };
                },
              },
            ],
          },
          {
            path: 'hojas-de-ruta/historial',
            element: <Navigate to="/historial?tab=rutas" replace />,
          },
          {
            path: 'mis-tareas',
            element: <RoleGuard roles={roleList(roles.tasks)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { MyTasksPage } = await import('@/pages/tasks/my-tasks-page');
                  return { Component: MyTasksPage };
                },
              },
            ],
          },
          {
            path: 'aprobaciones',
            element: <RoleGuard roles={roleList(roles.approvals)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { ApprovalsPage } = await import('@/pages/approvals/approvals-page');
                  return { Component: ApprovalsPage };
                },
              },
            ],
          },
          {
            path: 'historial',
            element: <RoleGuard roles={roleList(roles.history)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { HistoryPage } = await import('@/pages/history/history-page');
                  return { Component: HistoryPage };
                },
              },
            ],
          },
          {
            path: 'ventas',
            element: <RoleGuard roles={roleList(roles.sales)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { SalesDashboardPage } = await import('@/pages/sales/sales-dashboard-page');
                  return { Component: SalesDashboardPage };
                },
              },
              {
                path: 'clientes',
                lazy: async () => {
                  const { ClientsPage } = await import('@/pages/sales/clients-page');
                  return { Component: ClientsPage };
                },
              },
            ],
          },
          {
            path: 'taller',
            element: <RoleGuard roles={roleList(roles.workshop)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { WorkshopDashboardPage } = await import(
                    '@/pages/workshop/workshop-dashboard-page'
                  );
                  return { Component: WorkshopDashboardPage };
                },
              },
            ],
          },
          {
            path: 'taller/inspecciones',
            element: <RoleGuard roles={roleList(roles.inspections)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { InspectionsPage } = await import('@/pages/workshop/inspections-page');
                  return { Component: InspectionsPage };
                },
              },
            ],
          },
          {
            path: 'taller/inspecciones/:id',
            element: <RoleGuard roles={roleList(roles.inspectionView)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { InspectionDetailPage } = await import(
                    '@/pages/workshop/inspection-detail-page'
                  );
                  return { Component: InspectionDetailPage };
                },
              },
            ],
          },
          {
            path: 'taller/repuestos',
            element: <RoleGuard roles={roleList(roles.spares)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { SparePartsPage } = await import('@/pages/workshop/spare-parts-page');
                  return { Component: SparePartsPage };
                },
              },
            ],
          },
          {
            path: 'proyectos',
            element: <RoleGuard roles={roleList(roles.projects)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { ProjectsPage } = await import('@/pages/projects/projects-page');
                  return { Component: ProjectsPage };
                },
              },
            ],
          },
          {
            path: 'almacen',
            element: <RoleGuard roles={roleList(roles.warehouse)} />,
            children: [
              {
                path: 'inventario',
                lazy: async () => {
                  const { InventoryPage } = await import('@/pages/warehouse/inventory-page');
                  return { Component: InventoryPage };
                },
              },
              {
                path: 'solicitudes',
                lazy: async () => {
                  const { RequestsPage } = await import('@/pages/warehouse/requests-page');
                  return { Component: RequestsPage };
                },
              },
              {
                path: 'prestamos',
                lazy: async () => {
                  const { LoansPage } = await import('@/pages/warehouse/loans-page');
                  return { Component: LoansPage };
                },
              },
              {
                path: 'calibracion',
                lazy: async () => {
                  const { CalibrationPage } = await import('@/pages/warehouse/calibration-page');
                  return { Component: CalibrationPage };
                },
              },
            ],
          },
          {
            path: 'analitica/rendimiento',
            element: <RoleGuard roles={roleList(roles.analytics)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { PlantPerformancePage } = await import(
                    '@/pages/analytics/plant-performance-page'
                  );
                  return { Component: PlantPerformancePage };
                },
              },
            ],
          },
          {
            path: 'planta',
            element: <RoleGuard roles={roleList(roles.plant)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { PlantMapPage } = await import('@/pages/plant/plant-map-page');
                  return { Component: PlantMapPage };
                },
              },
            ],
          },
          {
            path: 'administracion',
            element: <RoleGuard roles={roleList(roles.admin)} />,
            children: [
              {
                path: 'usuarios',
                lazy: async () => {
                  const { UsersPage } = await import('@/pages/admin/users-page');
                  return { Component: UsersPage };
                },
              },
              {
                path: 'auditoria',
                lazy: async () => {
                  const { AuditPage } = await import('@/pages/admin/audit-page');
                  return { Component: AuditPage };
                },
              },
            ],
          },
          {
            path: 'ajustes',
            element: <RoleGuard roles={roleList(roles.all)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { SettingsPage } = await import('@/pages/settings/settings-page');
                  return { Component: SettingsPage };
                },
              },
            ],
          },
          {
            path: 'calidad/*',
            element: <Navigate to="/hojas-de-ruta" replace />,
          },
          {
            path: 'campo',
            element: <Navigate to="/" replace />,
          },
          {
            path: 'suministro',
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const { NotFoundPage } = await import('@/pages/not-found-page');
      return { Component: NotFoundPage };
    },
  },
]);
