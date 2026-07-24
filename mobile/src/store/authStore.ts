import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  home_city?: string | null;
  total_trips?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  setToken: async (token) => {
    try {
      if (token) {
        await SecureStore.setItemAsync('roadbuddy_token', token);
      } else {
        await SecureStore.deleteItemAsync('roadbuddy_token');
      }
      set({ token });
    } catch (e) {
      console.error('Error saving token', e);
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('roadbuddy_token');
      set({ token: null, user: null });
    } catch (e) {
      console.error('Error deleting token during logout', e);
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('roadbuddy_token');
      if (token) {
        set({ token });
        // Fetch current profile to verify token validity and get user profile
        try {
          const res = await client.get('/api/users/me');
          set({ user: res.data });
        } catch (err) {
          console.log('Token verification failed, clearing token');
          await get().logout();
        }
      }
    } catch (e) {
      console.error('Error loading token on initialization', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
