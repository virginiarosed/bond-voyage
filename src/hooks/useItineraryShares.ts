import { UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "../utils/axios/userAxios";
import { queryKeys } from "../utils/lib/queryKeys";
import { ApiResponse } from "../types/types";

type ShareTokenResponse = ApiResponse<{ token: string }>;

export const useCreateItineraryShare = (
  options?: UseMutationOptions<ShareTokenResponse, AxiosError, { itineraryId: string }>
) => {
  return useMutation({
    mutationFn: async ({ itineraryId }) => {
      const response = await apiClient.post<ShareTokenResponse>(
        `/itineraries/${itineraryId}/shares`
      );
      return response.data;
    },
    ...options,
  });
};

export const useAcceptItineraryShare = (
  options?: UseMutationOptions<ApiResponse, AxiosError, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.post<ApiResponse>(
        `/itineraries/shares/${token}/accept`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.myBookings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bookings.sharedBookings(),
      });
    },
    ...options,
  });
};
