import type {
  ApiSuccess,
  CreateInspectionInput,
  CreateTaskInput,
  InspectionRecord,
  RejectInspectionInput,
  UpdateInspectionInput,
  UpdateTaskInput,
} from '@turbopre/shared';
import { api } from '../api';

export const inspectionsService = {
  async list(params?: {
    search?: string;
    status?: string;
    serviceOrderId?: string;
  }): Promise<InspectionRecord[]> {
    const { data } = await api.get<ApiSuccess<InspectionRecord[]>>('/inspections', {
      params,
    });
    return data.data;
  },

  async get(id: string): Promise<InspectionRecord> {
    const { data } = await api.get<ApiSuccess<InspectionRecord>>(`/inspections/${id}`);
    return data.data;
  },

  async create(input: CreateInspectionInput): Promise<InspectionRecord> {
    const { data } = await api.post<ApiSuccess<InspectionRecord>>('/inspections', input);
    return data.data;
  },

  async update(id: string, input: UpdateInspectionInput): Promise<InspectionRecord> {
    const { data } = await api.patch<ApiSuccess<InspectionRecord>>(
      `/inspections/${id}`,
      input,
    );
    return data.data;
  },

  async addTask(id: string, input: CreateTaskInput): Promise<InspectionRecord> {
    const { data } = await api.post<ApiSuccess<InspectionRecord>>(
      `/inspections/${id}/tasks`,
      input,
    );
    return data.data;
  },

  async updateTask(
    id: string,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<InspectionRecord> {
    const { data } = await api.patch<ApiSuccess<InspectionRecord>>(
      `/inspections/${id}/tasks/${taskId}`,
      input,
    );
    return data.data;
  },

  async deleteTask(id: string, taskId: string): Promise<InspectionRecord> {
    const { data } = await api.delete<ApiSuccess<InspectionRecord>>(
      `/inspections/${id}/tasks/${taskId}`,
    );
    return data.data;
  },

  async approve(id: string): Promise<InspectionRecord> {
    const { data } = await api.post<ApiSuccess<InspectionRecord>>(
      `/inspections/${id}/approve`,
    );
    return data.data;
  },

  async reject(id: string, input: RejectInspectionInput): Promise<InspectionRecord> {
    const { data } = await api.post<ApiSuccess<InspectionRecord>>(
      `/inspections/${id}/reject`,
      input,
    );
    return data.data;
  },
};
