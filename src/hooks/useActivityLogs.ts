import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiResponse, ActivityLog } from "../types/types";
import { apiClient } from "../utils/axios/userAxios";
import { queryKeys } from "../utils/lib/queryKeys";

interface ActivityLogsParams {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useActivityLogs = (
  params?: ActivityLogsParams,
  options?: UseQueryOptions<ApiResponse<ActivityLog[]>, AxiosError>
) => {
  return useQuery({
    queryKey: queryKeys.activityLogs.list(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ActivityLog[]>>(
        "/activity-logs",
        {
          params,
        }
      );
      return response.data;
    },
    ...options,
  });
};

// Hook for paginated activity logs (server-side pagination)
export const usePaginatedActivityLogs = (
  params: {
    page: number;
    limit: number;
    actorId?: string;
    action?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  options?: UseQueryOptions<ApiResponse<ActivityLog[]>, AxiosError>
) => {
  return useQuery({
    queryKey: ["activityLogs", "paginated", params],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ActivityLog[]>>(
        "/activity-logs",
        {
          params: {
            page: params.page,
            limit: params.limit,
            actorId: params.actorId,
            action: params.action || params.category,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
          },
        }
      );
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    ...options,
  });
};
