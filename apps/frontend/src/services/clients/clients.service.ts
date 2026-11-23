import type {
  ApiSuccess,
  ClientRecord,
  CreateClientInput,
  UpdateClientInput,
} from '@turbopre/shared';
import { api } from '../api';

export const clientsService = {
  async list(params?: { search?: string; includeInactive?: boolean }): Promise<ClientRecord[]> {
    const { data } = await api.get<ApiSuccess<ClientRecord[]>>('/clients', { params });
    return data.data;
  },

  async get(id: string): Promise<ClientRecord> {
    const { data } = await api.get<ApiSuccess<ClientRecord>>(`/clients/${id}`);
    return data.data;
  },

  async create(input: CreateClientInput): Promise<ClientRecord> {
    const { data } = await api.post<ApiSuccess<ClientRecord>>('/clients', input);
    return data.data;
  },

  async update(id: string, input: UpdateClientInput): Promise<ClientRecord> {
    const { data } = await api.patch<ApiSuccess<ClientRecord>>(`/clients/${id}`, input);
    return data.data;
  },
};
