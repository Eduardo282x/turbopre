import type { ApiSuccess, HealthStatus } from '@turbopre/shared';
import { api } from '../api';

export const healthService = {
  async check(): Promise<HealthStatus> {
    const { data } = await api.get<ApiSuccess<HealthStatus>>('/health');
    return data.data;
  },
};
