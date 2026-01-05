import { create } from 'zustand';

interface AdminAuthStore {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

export const useAdminAuth = create<AdminAuthStore>((set) => ({
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
    set({ token, isAuthenticated: !!token });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ token: null, isAuthenticated: false });
  },
}));

