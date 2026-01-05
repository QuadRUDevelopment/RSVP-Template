import { create } from 'zustand';

interface AdminAuthStore {
  token: string | null;
  refreshToken: string | null;
  user: { id: string; email: string } | null;
  isAuthenticated: boolean;
  setToken: (token: string | null, refreshToken?: string | null, user?: { id: string; email: string } | null) => void;
  logout: () => void;
}

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_refresh_token');
};

const getStoredUser = (): { id: string; email: string } | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('admin_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const useAdminAuth = create<AdminAuthStore>((set) => ({
  token: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  user: getStoredUser(),
  isAuthenticated: !!getStoredToken(),
  setToken: (token, refreshToken = null, user = null) => {
    if (token) {
      localStorage.setItem('admin_token', token);
      if (refreshToken) {
        localStorage.setItem('admin_refresh_token', refreshToken);
      }
      if (user) {
        localStorage.setItem('admin_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
    }
    set({ 
      token, 
      refreshToken: refreshToken || null,
      user: user || null,
      isAuthenticated: !!token 
    });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));

