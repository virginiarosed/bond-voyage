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
  options?: UseMutationOptions<ApiResponse, AxiosError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch<ApiResponse>(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all);
      queryClient.setQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all, (old) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((n) => n.id === notificationId ? { ...n, isRead: true } : n),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
};

export const useMarkNotificationUnread = (
  options?: UseMutationOptions<ApiResponse, AxiosError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch<ApiResponse>(
        `/notifications/${notificationId}/unread`
      );
      return response.data;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all);
      queryClient.setQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all, (old) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((n) => n.id === notificationId ? { ...n, isRead: false } : n),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
};

export const useDeleteNotification = (
  options?: UseMutationOptions<ApiResponse, AxiosError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.delete<ApiResponse>(
        `/notifications/${notificationId}`
      );
      return response.data;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all);
      queryClient.setQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all, (old) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((n) => n.id !== notificationId),
            meta: { ...old.data.meta, total: old.data.meta.total - 1 },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
};

export const useMarkAllNotificationsRead = (
  options?: UseMutationOptions<ApiResponse, AxiosError, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<ApiResponse>(
        "/notifications/mark-all-read"
      );
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all);
      queryClient.setQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all, (old) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: { ...old.data, items: old.data.items.map((n) => ({ ...n, isRead: true })) },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
};

export const useClearAllReadNotifications = (
  options?: UseMutationOptions<ApiResponse, AxiosError, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<ApiResponse>(
        "/notifications/clear-read"
      );
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all);
      queryClient.setQueryData<ApiResponse<PaginatedData<INotification>>>(queryKeys.notifications.all, (old) => {
        if (!old?.data?.items) return old;
        const remaining = old.data.items.filter((n) => !n.isRead);
        return {
          ...old,
          data: { ...old.data, items: remaining, meta: { ...old.data.meta, total: remaining.length } },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.notifications.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
};