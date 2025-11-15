import { create } from "zustand";
import api from "../api/axios";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  user: null,
  token: localStorage.getItem('token'),

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    set({ isAuthenticated: true, token: res.data.token, user: res.data.user });
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    set({ isAuthenticated: true, token: res.data.token, user: res.data.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false, user: null, token: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    set({ isAuthenticated: !!token, token });
  }
}));

export default useAuthStore;