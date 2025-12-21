import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { RouteOptimizationRequest } from "../types/types";
import { apiClient } from "../utils/axios/userAxios";

export const useOptimizeRoute = (
  options?: UseMutationOptions<any, AxiosError, RouteOptimizationRequest>
) => {
  return useMutation({
    mutationFn: async (data: RouteOptimizationRequest) => {
      const response = await apiClient.post("/routes/optimize", data);
      return response.data;
    },
    ...options,
  });
};
