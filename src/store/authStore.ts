import { create } from "zustand";
import api from "../api/axios";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  //  register: (data: any) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  phoneNumber: string;
  password: string;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    set({ user, token: accessToken, isAuthenticated: true });
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    const { user, accessToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    set({ user, token: accessToken, isAuthenticated: true });
  },

  forgotPassword: async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));

export default useAuthStore;