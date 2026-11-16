import type { AuthUser, LoginResponse } from '@turbopre/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  signIn: (payload: LoginResponse) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      signIn: ({ accessToken, user }) => set({ accessToken, user }),
      signOut: () => set({ accessToken: null, user: null }),
    }),
    { name: 'turbopre.auth' },
  ),
);
