import type {
  ApiSuccess,
  CreateProjectInput,
  ProjectRecord,
  UpdateProjectInput,
} from '@turbopre/shared';
import { api } from '../api';

export const projectsService = {
  async list(params?: {
    search?: string;
    status?: string;
    clientId?: string;
  }): Promise<ProjectRecord[]> {
    const { data } = await api.get<ApiSuccess<ProjectRecord[]>>('/projects', { params });
    return data.data;
  },

  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const { data } = await api.post<ApiSuccess<ProjectRecord>>('/projects', input);
    return data.data;
  },

  async update(id: string, input: UpdateProjectInput): Promise<ProjectRecord> {
    const { data } = await api.patch<ApiSuccess<ProjectRecord>>(`/projects/${id}`, input);
    return data.data;
  },
};
