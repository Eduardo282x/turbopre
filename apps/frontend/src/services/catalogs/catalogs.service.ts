import type { ApiSuccess, OrganizationCatalog } from '@turbopre/shared';
import { api } from '../api';

export const catalogsService = {
  async getOrganization(): Promise<OrganizationCatalog> {
    const { data } = await api.get<ApiSuccess<OrganizationCatalog>>('/catalogs');
    return data.data;
  },
};
