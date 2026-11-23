import type {
  AnnexSelectionInput,
  ApiSuccess,
  CreateRouteSheetInput,
  CreateTaskInput,
  ReplaceRouteTasksInput,
  RouteSheetCommentInput,
  RouteSheetRecord,
  RouteSheetRejectInput,
  UpdateRouteSheetInput,
} from '@turbopre/shared';
import { api } from '../api';

export const routeSheetsService = {
  async list(params?: {
    search?: string;
    status?: string;
    serviceOrderId?: string;
  }): Promise<RouteSheetRecord[]> {
    const { data } = await api.get<ApiSuccess<RouteSheetRecord[]>>('/route-sheets', {
      params,
    });
    return data.data;
  },

  async get(id: string): Promise<RouteSheetRecord> {
    const { data } = await api.get<ApiSuccess<RouteSheetRecord>>(`/route-sheets/${id}`);
    return data.data;
  },

  async create(input: CreateRouteSheetInput): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      '/route-sheets',
      input,
    );
    return data.data;
  },

  async update(id: string, input: UpdateRouteSheetInput): Promise<RouteSheetRecord> {
    const { data } = await api.patch<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}`,
      input,
    );
    return data.data;
  },

  async replaceTasks(
    id: string,
    input: ReplaceRouteTasksInput,
  ): Promise<RouteSheetRecord> {
    const { data } = await api.put<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/tasks`,
      input,
    );
    return data.data;
  },

  async addTask(id: string, input: CreateTaskInput): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/tasks`,
      input,
    );
    return data.data;
  },

  async submit(id: string): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/submit`,
    );
    return data.data;
  },

  async approve(
    id: string,
    input: RouteSheetCommentInput = {},
  ): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/approve`,
      input,
    );
    return data.data;
  },

  async reject(id: string, input: RouteSheetRejectInput): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/reject`,
      input,
    );
    return data.data;
  },

  async finalizeAnnexes(
    id: string,
    input: RouteSheetCommentInput = {},
  ): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/finalize-annexes`,
      input,
    );
    return data.data;
  },

  async requestAnnexChanges(
    id: string,
    input: RouteSheetRejectInput,
  ): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/request-annex-changes`,
      input,
    );
    return data.data;
  },

  async approveQuality(
    id: string,
    input: RouteSheetCommentInput = {},
  ): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/approve-quality`,
      input,
    );
    return data.data;
  },

  async rejectQuality(
    id: string,
    input: RouteSheetRejectInput,
  ): Promise<RouteSheetRecord> {
    const { data } = await api.post<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/reject-quality`,
      input,
    );
    return data.data;
  },

  async toggleAnnex(
    id: string,
    taskId: string,
    input: AnnexSelectionInput,
  ): Promise<RouteSheetRecord> {
    const { data } = await api.patch<ApiSuccess<RouteSheetRecord>>(
      `/route-sheets/${id}/tasks/${taskId}/annex`,
      input,
    );
    return data.data;
  },
};
