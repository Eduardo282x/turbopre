import { useQuery } from '@tanstack/react-query';
import { routeSheetsService } from '@/services/route-sheets/route-sheets.service';

export function useRouteSheets(params?: {
  search?: string;
  status?: string;
  serviceOrderId?: string;
}) {
  return useQuery({
    queryKey: [
      'route-sheets',
      'list',
      params?.search ?? '',
      params?.status ?? '',
      params?.serviceOrderId ?? '',
    ],
    queryFn: () => routeSheetsService.list(params),
  });
}

export function useRouteSheet(id: string | undefined) {
  return useQuery({
    queryKey: ['route-sheets', 'detail', id],
    queryFn: () => routeSheetsService.get(id as string),
    enabled: Boolean(id),
  });
}
