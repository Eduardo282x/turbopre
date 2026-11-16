import type { HealthStatus } from '@turbopre/shared';
import { api } from '../api';

export const healthService = {
  async check(): Promise<HealthStatus> {
    const { data } = await api.get<HealthStatus>('/health');
    return data;
  },
};
