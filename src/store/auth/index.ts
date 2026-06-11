import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@/apis';

interface AuthStore {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: User | null;
  setInitialized: (value: boolean) => void;
  setUser: (user: User | null) => void;
}

const useAuthStore = create<AuthStore>()(
  devtools(
    immer(set => ({
      isAuthenticated: false,
      isInitialized: false,
      user: null,
      setInitialized: value => {
        set(state => {
          state.isInitialized = value;
        });
      },
      setUser: user => {
        set(state => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      }
    }))
  )
);

export { useAuthStore };
