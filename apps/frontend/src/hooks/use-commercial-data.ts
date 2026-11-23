import { useQuery } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['service-orders', 'list'],
    queryFn: () => serviceOrdersService.list(),
  });
}

export function useServiceOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['service-orders', 'detail', id],
    queryFn: () => serviceOrdersService.get(id as string),
    enabled: Boolean(id),
  });
}
