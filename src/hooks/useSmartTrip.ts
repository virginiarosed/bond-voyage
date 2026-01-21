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
  travelers: number;
  budget: number;
  preferences: string[];
  travelPace: "relaxed" | "moderate" | "packed" | "own_pace";
}

export interface SmartTripData {
  itinerary: Array<{
    day: number;
    date: string;
    title: string;
    activities: Array<{
      order: number;
      time: string;
      title: string;
      locationName: string;
      coordinates: {
        lat: number;
        lng: number;
      };
      description: string;
      iconKey: string;
    }>;
  }>;
  metadata: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    budget: number;
    travelPace: string;
    preferences: string[];
  };
}

export const useSmartTrip = (
  options?: UseMutationOptions<
    ApiResponse<SmartTripData>,
    Error,
    SmartTripPayload
  >
): UseMutationResult<ApiResponse<SmartTripData>, Error, SmartTripPayload> => {
  return useMutation({
    mutationFn: async (payload: SmartTripPayload) => {
      const { data } = await apiClient.post<ApiResponse<SmartTripData>>(
        "/ai/itinerary",
        payload
      );

      return data;
    },
    ...options,
  });
};
