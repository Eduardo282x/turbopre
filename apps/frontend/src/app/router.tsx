import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleGuard } from '@/components/auth/role-guard';
import { RouteLoading } from '@/components/common/route-loading';
import { Layout } from '@/components/layout/layout';
import { ALL_ROLES } from '@/lib/navigation';

const roles = {
  routes: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'QUALITY', 'SALES', 'FIELD', 'PROJECT', 'SECTION_CHIEF', 'NDT'] as const,
  routeHistory: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'QUALITY', 'SALES', 'PROJECT', 'SECTION_CHIEF'] as const,
  tasks: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'QUALITY', 'FIELD', 'SECTION_CHIEF', 'NDT', 'METROLOGY'] as const,
  approvals: ['GLOBAL', 'ENGINEERING', 'SECTION_CHIEF'] as const,
  sales: ['GLOBAL', 'PLANNING', 'SALES'] as const,
  inspections: ['GLOBAL', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'SECTION_CHIEF', 'NDT', 'FIELD'] as const,
  spares: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'SECTION_CHIEF', 'PROCUREMENT'] as const,
  warehouse: ['GLOBAL', 'WAREHOUSE', 'METROLOGY'] as const,
  quality: ['GLOBAL', 'QUALITY', 'NDT', 'SECTION_CHIEF'] as const,
  analytics: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'SALES', 'PROJECT', 'FIELD', 'SECTION_CHIEF', 'NDT'] as const,
  plant: ['GLOBAL', 'PLANNING', 'ENGINEERING', 'WORKSHOP', 'OPERATOR', 'FIELD', 'SECTION_CHIEF'] as const,
  admin: ['GLOBAL'] as const,
  serviceOrders: ['GLOBAL', 'PLANNING', 'SALES', 'ENGINEERING', 'WORKSHOP', 'QUALITY', 'FIELD', 'PROJECT', 'NDT', 'METROLOGY', 'HSE', 'PROCUREMENT', 'SECTION_CHIEF'] as const,
  shop: ['GLOBAL', 'WORKSHOP', 'SECTION_CHIEF', 'ENGINEERING', 'OPERATOR'] as const,
  field: ['GLOBAL', 'FIELD', 'PROJECT', 'HSE', 'WORKSHOP', 'ENGINEERING', 'SECTION_CHIEF'] as const,
  projects: ['GLOBAL', 'PROJECT', 'ENGINEERING', 'PROCUREMENT', 'HSE'] as const,
  supply: ['GLOBAL', 'PROCUREMENT', 'SALES', 'WAREHOUSE', 'PROJECT'] as const,
  qualityRecords: ['GLOBAL', 'QUALITY', 'NDT', 'ENGINEERING', 'SECTION_CHIEF'] as const,
  nonConformities: ['GLOBAL', 'QUALITY', 'NDT', 'ENGINEERING', 'HSE', 'SECTION_CHIEF'] as const,
  calibration: ['GLOBAL', 'WAREHOUSE', 'METROLOGY', 'QUALITY'] as const,
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
                path: 'expedientes',
                element: <RoleGuard roles={roleList(roles.serviceOrders)} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const { ExpedientesPage } = await import('@/pages/expedientes/expedientes-page');
                      return { Component: ExpedientesPage };
                    },
                  },
                  {
                    path: ':id',
                    lazy: async () => {
                      const { ExpedienteDetailPage } = await import('@/pages/expedientes/expediente-detail-page');
                      return { Component: ExpedienteDetailPage };
                    },
                  },
                ],
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
                    element: <RoleGuard roles={roleList(roles.shop)} />,
                    children: [
                      {
                        index: true,
                        lazy: async () => {
                          const { WorkshopDashboardPage } = await import('@/pages/workshop/workshop-dashboard-page');
                          return { Component: WorkshopDashboardPage };
                        },
                      },
                    ],
                  },
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
                path: 'campo',
                element: <RoleGuard roles={roleList(roles.field)} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const { FieldPage } = await import('@/pages/field/field-page');
                      return { Component: FieldPage };
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
                path: 'suministro',
                element: <RoleGuard roles={roleList(roles.supply)} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const { SupplyPage } = await import('@/pages/supply/supply-page');
                      return { Component: SupplyPage };
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
                    element: <RoleGuard roles={roleList(roles.calibration)} />,
                    children: [
                      {
                        index: true,
                        lazy: async () => {
                          const { CalibrationPage } = await import('@/pages/warehouse/calibration-page');
                          return { Component: CalibrationPage };
                        },
                      },
                    ],
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
                    path: 'registros',
                    element: <RoleGuard roles={roleList(roles.qualityRecords)} />,
                    children: [
                      {
                        index: true,
                        lazy: async () => {
                          const { QualityRecordsPage } = await import('@/pages/quality/quality-records-page');
                          return { Component: QualityRecordsPage };
                        },
                      },
                    ],
                  },
                  {
                    path: 'no-conformidades',
                    element: <RoleGuard roles={roleList(roles.nonConformities)} />,
                    children: [
                      {
                        index: true,
                        lazy: async () => {
                          const { NonConformitiesPage } = await import('@/pages/quality/nonconformities-page');
                          return { Component: NonConformitiesPage };
                        },
                      },
                    ],
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
