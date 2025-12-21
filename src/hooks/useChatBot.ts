import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiResponse, ChatbotResponse, ChatbotRequest } from "../types/types";
import { apiClient } from "../utils/axios/userAxios";

export const useRoameoChatbot = (
  options?: UseMutationOptions<
    ApiResponse<ChatbotResponse>,
    AxiosError,
    ChatbotRequest
  >
) => {
  return useMutation({
    mutationFn: async (data: ChatbotRequest) => {
      const response = await apiClient.post<ApiResponse<ChatbotResponse>>(
        "/chatbots/roameo",
        data
      );
      return response.data;
    },
    ...options,
  });
};

export const useRoamanChatbot = (
  options?: UseMutationOptions<any, AxiosError, ChatbotRequest>
) => {
  return useMutation({
    mutationFn: async (data: ChatbotRequest) => {
      const response = await apiClient.post("/chatbots/roaman", data);
      return response.data;
    },
    ...options,
  });
};
