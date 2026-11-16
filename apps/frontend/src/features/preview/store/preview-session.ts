import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { usePreviewStore } from './preview-store';

interface PreviewSessionState {
  userId: string | null;
  signIn: (userId: string) => void;
  signOut: () => void;
  switchUser: (userId: string) => void;
}

export const usePreviewSession = create<PreviewSessionState>()(
  persist(
    (set) => ({
      userId: null,
      signIn: (userId) => set({ userId }),
      signOut: () => set({ userId: null }),
      switchUser: (userId) => set({ userId }),
    }),
    { name: 'turbopre.preview.session' },
  ),
);

export function useCurrentUser(): User | null {
  const userId = usePreviewSession((state) => state.userId);
  return usePreviewStore((state) =>
    userId ? state.db.users.find((user) => user.id === userId) ?? null : null,
  );
}
