import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deriveServiceOrderWorkflowStatus } from '@turbopre/shared';
import { usePreviewStore } from '@/features/preview/store/preview-store';
import { previewRouteStatusToApi } from '@/lib/preview-status';
import { clientsService } from '@/services/clients/clients.service';
import { equipmentService } from '@/services/equipment/equipment.service';
import { projectsService } from '@/services/projects/projects.service';
import { serviceOrdersService } from '@/services/service-orders/service-orders.service';
import { sitesService } from '@/services/sites/sites.service';

export function useClients() {
  return useQuery({
    queryKey: ['clients', 'list'],
    queryFn: () => clientsService.list(),
  });
}

export function useSites() {
  return useQuery({
    queryKey: ['sites', 'list'],
    queryFn: () => sitesService.list(),
  });
}

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment', 'list'],
    queryFn: () => equipmentService.list(),
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => projectsService.list(),
  });
}

export function useServiceOrders() {
  const query = useQuery({
    queryKey: ['service-orders', 'list'],
    queryFn: () => serviceOrdersService.list(),
  });
  const db = usePreviewStore((state) => state.db);

  const data = useMemo(() => {
    const orders = query.data ?? [];

    return orders.map((order) => {
      const previewOrder = db.serviceOrders.find((item) => item.id === order.id);
      const previewRoute = previewOrder?.routeSheetId
        ? db.routeSheets.find((route) => route.id === previewOrder.routeSheetId)
        : undefined;

      return {
        ...order,
        inspectionId: order.inspectionId ?? previewOrder?.inspectionId ?? null,
        routeSheetId: order.routeSheetId ?? previewOrder?.routeSheetId ?? null,
        workflowStatus: deriveServiceOrderWorkflowStatus({
          status: order.status,
          inspectionStatus: order.inspectionStatus,
          routeSheetStatus: previewRoute
            ? previewRouteStatusToApi(previewRoute.status)
            : null,
        }),
      };
    });
  }, [query.data, db]);

  return { ...query, data };
}

export function useServiceOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['service-orders', 'detail', id],
    queryFn: () => serviceOrdersService.get(id as string),
    enabled: Boolean(id),
  });
}
