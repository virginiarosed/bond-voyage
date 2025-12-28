import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import axios, { AxiosError, AxiosInstance } from "axios";
import { apiClient } from "../utils/axios/userAxios";
import { queryKeys } from "../utils/lib/queryKeys";
import { ApiResponse, AuthResponse, User } from "../types/types";

export const useRegister = (
  options?: UseMutationOptions<ApiResponse<AuthResponse>, AxiosError, any>
) => {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        data
      );
      if (response.data.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
      }
      return response.data;
    },
    ...options,
  });
};

export const useLogin = (
  options?: UseMutationOptions<ApiResponse<AuthResponse>, AxiosError, any>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        credentials
      );
      if (response.data.data?.accessToken && response.data.data?.refreshToken) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    },
    ...options,
  });
};

export const useLogout = (
  options?: UseMutationOptions<ApiResponse, AxiosError, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse>("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return response.data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
    ...options,
  });
};

export const useProfile = (
  options?: UseQueryOptions<ApiResponse<{ user: User }>, AxiosError>
) => {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ user: User }>>(
        "/auth/profile"
      );
      return response.data;
    },
    ...options,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<ApiResponse<{ user: User }>, AxiosError, any>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put<ApiResponse<{ user: User }>>(
        "/users/profile",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    },
    ...options,
  });
};

export const useChangePassword = (
  options?: UseMutationOptions<ApiResponse, AxiosError, any>
) => {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiClient.put<ApiResponse>(
        "/users/change-password",
        data
      );
      return response.data;
    },
    ...options,
  });
};

export const useSendOTP = (
  options?: UseMutationOptions<
    ApiResponse,
    AxiosError,
    { email: string; firstName: string }
  >
) => {
  return useMutation({
    mutationFn: async (data: { email: string; firstName: string }) => {
      const response = await apiClient.post<ApiResponse>(
        "/auth/send-otp",
        data
      );
      return response.data;
    },
    ...options,
  });
};

export const useVerifyOTP = (
  options?: UseMutationOptions<
    ApiResponse,
    AxiosError,
    { email: string; otp: string }
  >
) => {
  return useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await apiClient.post<ApiResponse>(
        "/auth/verify-otp",
        data
      );
      return response.data;
    },
    ...options,
  });
};

export const useResetPassword = (
  options?: UseMutationOptions<ApiResponse, AxiosError, any>
) => {
  return useMutation({
    mutationFn: async (data: {
      email: string;
      otp: string;
      newPassword: string;
    }) => {
      const response = await apiClient.post<ApiResponse>(
        "/auth/reset-password",
        data
      );
      return response.data;
    },
    ...options,
  });
};
