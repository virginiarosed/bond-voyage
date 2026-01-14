import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { ApiResponse } from "../types/types";
import { apiClient } from "../utils/axios/userAxios";

export interface SmartTripPayload {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
  preference: string[];
  accomodationType: string; // what is this
  travelPace: "drive" | "walk";
}

export const useSmartTrip = (
  options?: UseMutationOptions<ApiResponse, Error, SmartTripPayload>
): UseMutationResult<ApiResponse, Error, SmartTripPayload> => {
  return useMutation({
    mutationFn: (data: SmartTripPayload) =>
      apiClient.post("/user/smart-trip", data),
    ...options,
  });
};
