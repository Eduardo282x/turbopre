import type {
  ApiSuccess,
  CompleteTaskInput,
  TaskContext,
  TaskRecord,
} from '@turbopre/shared';
import { api } from '../api';

export const tasksService = {
  async my(): Promise<TaskContext[]> {
    const { data } = await api.get<ApiSuccess<TaskContext[]>>('/tasks/my');
    return data.data;
  },

  async complete(id: string, input: CompleteTaskInput): Promise<TaskRecord> {
    const { data } = await api.post<ApiSuccess<TaskRecord>>(
      `/tasks/${id}/complete`,
      input,
    );
    return data.data;
  },
};
