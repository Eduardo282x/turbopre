import type {
  ApiSuccess,
  CreateSiteInput,
  SiteRecord,
  UpdateSiteInput,
} from '@turbopre/shared';
import { api } from '../api';

export const sitesService = {
  async list(params?: {
    clientId?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<SiteRecord[]> {
    const { data } = await api.get<ApiSuccess<SiteRecord[]>>('/sites', { params });
    return data.data;
  },

  async create(input: CreateSiteInput): Promise<SiteRecord> {
    const { data } = await api.post<ApiSuccess<SiteRecord>>('/sites', input);
    return data.data;
  },

  async update(id: string, input: UpdateSiteInput): Promise<SiteRecord> {
    const { data } = await api.patch<ApiSuccess<SiteRecord>>(`/sites/${id}`, input);
    return data.data;
  },
};
