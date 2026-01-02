import {
  UseQueryOptions,
  useQuery,
  UseMutationOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../utils/axios/userAxios";
import { queryKeys } from "../utils/lib/queryKeys";
import { ApiResponse, INotification, PaginatedData } from "../types/types";

export const useNotifications = (
  options?: UseQueryOptions<
    ApiResponse<PaginatedData<INotification>>,
    AxiosError
  >
) => {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<PaginatedData<INotification>>
      >("/notifications");

      return response.data;
    },
    ...options,
  });
};

export const useMarkNotificationRead = (
  notificationId: string,
  options?: UseMutationOptions<ApiResponse, AxiosError, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<ApiResponse>(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
};
