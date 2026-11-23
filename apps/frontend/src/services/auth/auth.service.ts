import type { ApiSuccess, AuthUser, LoginInput, LoginResponse } from '@turbopre/shared';
import { api } from '../api';

export const authService = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await api.post<ApiSuccess<LoginResponse>>('/auth/login', input);
    return data.data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await api.get<ApiSuccess<AuthUser>>('/auth/me');
    return data.data;
  },
};
