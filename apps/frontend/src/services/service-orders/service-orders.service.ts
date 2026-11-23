import type {
  ApiSuccess,
  CreateServiceOrderInput,
  DeliverServiceOrderInput,
  ServiceOrderRecord,
  UpdateServiceOrderInput,
} from '@turbopre/shared';
import { api } from '../api';

export const serviceOrdersService = {
  async list(params?: {
    search?: string;
    status?: string;
    clientId?: string;
    priority?: string;
  }): Promise<ServiceOrderRecord[]> {
    const { data } = await api.get<ApiSuccess<ServiceOrderRecord[]>>('/service-orders', {
      params,
    });
    return data.data;
  },

  async get(id: string): Promise<ServiceOrderRecord> {
    const { data } = await api.get<ApiSuccess<ServiceOrderRecord>>(`/service-orders/${id}`);
    return data.data;
  },

  async create(input: CreateServiceOrderInput): Promise<ServiceOrderRecord> {
    const { data } = await api.post<ApiSuccess<ServiceOrderRecord>>(
      '/service-orders',
      input,
    );
    return data.data;
  },

  async update(id: string, input: UpdateServiceOrderInput): Promise<ServiceOrderRecord> {
    const { data } = await api.patch<ApiSuccess<ServiceOrderRecord>>(
      `/service-orders/${id}`,
      input,
    );
    return data.data;
  },

  async cancel(id: string): Promise<ServiceOrderRecord> {
    const { data } = await api.post<ApiSuccess<ServiceOrderRecord>>(
      `/service-orders/${id}/cancel`,
    );
    return data.data;
  },

  async deliver(id: string, input: DeliverServiceOrderInput = {}): Promise<ServiceOrderRecord> {
    const { data } = await api.post<ApiSuccess<ServiceOrderRecord>>(
      `/service-orders/${id}/deliver`,
      input,
    );
    return data.data;
  },
};
