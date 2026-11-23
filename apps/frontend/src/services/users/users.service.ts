import type {
  ApiSuccess,
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserListItem,
} from '@turbopre/shared';
import { api } from '../api';

export const usersService = {
  async list(search?: string): Promise<UserListItem[]> {
    const { data } = await api.get<ApiSuccess<UserListItem[]>>('/users', {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  async create(input: CreateUserInput): Promise<UserListItem> {
    const { data } = await api.post<ApiSuccess<UserListItem>>('/users', input);
    return data.data;
  },

  async update(id: string, input: UpdateUserInput): Promise<UserListItem> {
    const { data } = await api.patch<ApiSuccess<UserListItem>>(`/users/${id}`, input);
    return data.data;
  },

  async resetPassword(id: string, input: ResetPasswordInput): Promise<void> {
    await api.post(`/users/${id}/password`, input);
  },
};
