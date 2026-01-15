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
import { ApiResponse, Feedback } from "../types/types";

// Hook for users to get their own feedback (GET /feedback/my)
export const useMyFeedback = (
  params?: any,
  options?: UseQueryOptions<ApiResponse<Feedback[]>, AxiosError>
) => {
  return useQuery({
    queryKey: queryKeys.feedback.list({ ...params, my: true }),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Feedback[]>>(
        "/feedback/my",
        { params }
      );
      return response.data;
    },
    ...options,
  });
};

// Hook for admins to get all feedback (GET /feedback) - requires ADMIN role
export const useFeedbackList = (
  params?: any,
  options?: UseQueryOptions<ApiResponse<Feedback[]>, AxiosError>
) => {
  return useQuery({
    queryKey: queryKeys.feedback.list(params),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Feedback[]>>(
        "/feedback",
        { params }
      );
      return response.data;
    },
    ...options,
  });
};

export const useSubmitFeedback = (
  options?: UseMutationOptions<ApiResponse<Feedback>, AxiosError, any>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const response = await apiClient.post<ApiResponse<Feedback>>(
        "/feedback",
        data
      );
      return response.data;
    },
    onSuccess: (newFeedback) => {
      // Optimistically add the new feedback to the user's feedback list
      const myFeedbackKey = queryKeys.feedback.list({ my: true });
      queryClient.setQueryData<ApiResponse<Feedback[]>>(
        myFeedbackKey,
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: [newFeedback.data as Feedback, ...oldData.data],
          };
        }
      );
      // Also invalidate to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
    ...options,
  });
};

export const useRespondToFeedback = (
  options?: UseMutationOptions<
    ApiResponse<Feedback>,
    AxiosError,
    { feedbackId: string; response: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { feedbackId: string; response: string }) => {
      const response = await apiClient.patch<ApiResponse<Feedback>>(
        `/feedback/${data.feedbackId}/respond`,
        { response: data.response }
      );
      return response.data;
    },
    // Optimistic update - immediately show the response in the UI
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.feedback.all });

      // Snapshot the previous value
      const adminFeedbackKey = queryKeys.feedback.list(undefined);
      const previousData =
        queryClient.getQueryData<ApiResponse<Feedback[]>>(adminFeedbackKey);

      // Optimistically update the cache
      queryClient.setQueryData<ApiResponse<Feedback[]>>(
        adminFeedbackKey,
        (oldData) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((feedback) =>
              feedback.id === variables.feedbackId
                ? {
                    ...feedback,
                    response: variables.response,
                    respondedAt: new Date().toISOString(),
                  }
                : feedback
            ),
          };
        }
      );

      // Return context with the previous data for rollback
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        const adminFeedbackKey = queryKeys.feedback.list(undefined);
        queryClient.setQueryData(adminFeedbackKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
    ...options,
  });
};
