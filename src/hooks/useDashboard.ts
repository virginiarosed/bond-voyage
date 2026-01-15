import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiResponse, DashboardStats } from "../types/types";
import { apiClient } from "../utils/axios/userAxios";
import { queryKeys } from "../utils/lib/queryKeys";

interface DashboardParams {
  year?: number;
}

// Admin dashboard stats - calls /dashboard/stats (admin only)
export const useDashboardStats = (
  params?: DashboardParams,
  options?: UseQueryOptions<ApiResponse<DashboardStats>, AxiosError>
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(params?.year),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        "/dashboard/stats",
        {
          params,
        }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// User dashboard stats - calls /users/me/stats (for regular users)
export const useUserDashboardStats = (
  params?: DashboardParams,
  options?: UseQueryOptions<ApiResponse<DashboardStats>, AxiosError>
) => {
  return useQuery({
    queryKey: ["user", "dashboard", "stats", params?.year],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        "/users/me/stats",
        {
          params,
        }
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};
