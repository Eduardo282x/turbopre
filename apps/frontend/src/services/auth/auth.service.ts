import type { AuthUser, LoginInput, LoginResponse } from '@turbopre/shared';
import { api } from '../api';

export const authService = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', input);
    return data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me');
    return data;
  },
};
