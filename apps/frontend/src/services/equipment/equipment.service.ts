import type {
  ApiSuccess,
  CreateEquipmentInput,
  EquipmentRecord,
  UpdateEquipmentInput,
} from '@turbopre/shared';
import { api } from '../api';

export const equipmentService = {
  async list(params?: {
    clientId?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<EquipmentRecord[]> {
    const { data } = await api.get<ApiSuccess<EquipmentRecord[]>>('/equipment', { params });
    return data.data;
  },

  async create(input: CreateEquipmentInput): Promise<EquipmentRecord> {
    const { data } = await api.post<ApiSuccess<EquipmentRecord>>('/equipment', input);
    return data.data;
  },

  async update(id: string, input: UpdateEquipmentInput): Promise<EquipmentRecord> {
    const { data } = await api.patch<ApiSuccess<EquipmentRecord>>(`/equipment/${id}`, input);
    return data.data;
  },
};
