import { create } from "zustand";

interface Props {
  isAuthenticated: boolean;
  setIsAuthenticated: (b: boolean) => void;
}

const useAuthStore = create<Props>((set) => ({
  isAuthenticated: false,
  setIsAuthenticated: (b: boolean) => set({ isAuthenticated: b }),
}));

export default useAuthStore;
