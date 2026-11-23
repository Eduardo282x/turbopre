import { useQuery } from '@tanstack/react-query';
import { inspectionsService } from '@/services/inspections/inspections.service';
import { tasksService } from '@/services/tasks/tasks.service';

export function useInspections() {
  return useQuery({
    queryKey: ['inspections', 'list'],
    queryFn: () => inspectionsService.list(),
  });
}

export function useInspection(id: string | undefined) {
  return useQuery({
    queryKey: ['inspections', 'detail', id],
    queryFn: () => inspectionsService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: () => tasksService.my(),
  });
}
