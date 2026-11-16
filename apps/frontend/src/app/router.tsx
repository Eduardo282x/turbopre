import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleGuard } from '@/components/auth/role-guard';
import { RouteLoading } from '@/components/common/route-loading';
import { Layout } from '@/components/layout/layout';
import { ALL_ROLES } from '@/lib/navigation';

const roles = {
  routes: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'QUALITY', 'SALES'] as const,
  routeHistory: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'QUALITY', 'SALES'] as const,
  tasks: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'QUALITY'] as const,
  approvals: ['GLOBAL', 'ENGINEERING'] as const,
  sales: ['GLOBAL', 'PLANNING', 'SALES'] as const,
  inspections: ['GLOBAL', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'] as const,
  spares: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'] as const,
  warehouse: ['GLOBAL', 'WAREHOUSE'] as const,
  quality: ['GLOBAL', 'QUALITY'] as const,
  analytics: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'SALES'] as const,
  plant: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR'] as const,
  admin: ['GLOBAL'] as const,
};

// Type helper to keep the role arrays literal and compatible with RoleId[].
const roleList = (value: readonly string[]) => [...value] as (typeof ALL_ROLES)[number][];

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
            element: <RoleGuard roles={roleList(ALL_ROLES)} />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { DashboardPage } = await import('@/pages/dashboard/dashboard-page');
                  return { Component: DashboardPage };
                },
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
                path: 'hojas-de-ruta',
                element: <RoleGuard roles={roleList(roles.routes)} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const { RouteSheetsPage } = await import('@/pages/route-sheets/route-sheets-page');
                      return { Component: RouteSheetsPage };
                    },
                  },
                  {
                    path: 'historial',
                    element: <RoleGuard roles={roleList(roles.routeHistory)} />,
                    children: [
                      {
                        index: true,
                        lazy: async () => {
                          const { RouteSheetHistoryPage } = await import(
                            '@/pages/route-sheets/route-sheet-history-page'
                          );
                          return { Component: RouteSheetHistoryPage };
                        },
                      },
                    ],
                  },
                  {
                    path: ':id',
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
                children: [
                  {
                    path: 'inspecciones',
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
                    path: 'repuestos',
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
                ],
              },
              {
                path: 'calidad',
                element: <RoleGuard roles={roleList(roles.quality)} />,
                children: [
                  {
                    path: 'tareas',
                    lazy: async () => {
                      const { QualityTasksPage } = await import('@/pages/quality/quality-tasks-page');
                      return { Component: QualityTasksPage };
                    },
                  },
                  {
                    path: 'visto-bueno',
                    lazy: async () => {
                      const { QualityApprovalsPage } = await import('@/pages/quality/quality-approvals-page');
                      return { Component: QualityApprovalsPage };
                    },
                  },
                  {
                    path: 'historial',
                    lazy: async () => {
                      const { QualityHistoryPage } = await import('@/pages/quality/quality-history-page');
                      return { Component: QualityHistoryPage };
                    },
                  },
                ],
              },
              {
                path: 'analitica',
                element: <RoleGuard roles={roleList(roles.analytics)} />,
                children: [
                  {
                    path: 'rendimiento',
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
                lazy: async () => {
                  const { SettingsPage } = await import('@/pages/settings/settings-page');
                  return { Component: SettingsPage };
                },
              },
            ],
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
