import { apiClient } from "./axios/userAxios";
import { ApiResponse, ChatMessage, ChatMessagesResponse } from "../types/types";

export const BookingChatAPI = {
  async getMessages(
    bookingId: string,
    cursor?: string,
    limit = 30
  ): Promise<ChatMessagesResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);

    const response = await apiClient.get<ApiResponse<ChatMessagesResponse>>(
      `/bookings/${bookingId}/chat/messages?${params.toString()}`
    );

    if (!response.data.data) {
      throw new Error("No chat messages returned");
    }

    return response.data.data;
  },

  async sendMessage(
    bookingId: string,
    content: string,
    files?: File[]
  ): Promise<ChatMessage> {
    const formData = new FormData();
    formData.append("content", content);

    if (files) {
      files.forEach((file) => formData.append("files", file));
    }

    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      `/bookings/${bookingId}/chat/messages`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    if (!response.data.data) {
      throw new Error("No chat message returned");
    }

    return response.data.data;
  },

  async generateAiSuggestion(bookingId: string): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>(
      `/bookings/${bookingId}/chat/ai-suggest`
    );

    if (!response.data.data) {
      throw new Error("No AI suggestion returned");
    }

    return response.data.data;
  },

  async markAsRead(bookingId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      `/bookings/${bookingId}/chat/mark-read`
    );

    if (!response.data.data) {
      throw new Error("No read status returned");
    }

    return response.data.data;
  },

  async getUnreadCount(bookingId: string): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      `/bookings/${bookingId}/chat/unread-count`
    );

    if (!response.data.data) {
      throw new Error("No unread count returned");
    }

    return response.data.data;
  },
};
