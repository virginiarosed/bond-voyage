import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import axios from "axios";
import { apiClient, BASE_URL } from "../utils/axios/userAxios";
import { ApiResponse } from "../types/types";

// Types for contact form data
interface SystemContactInput {
  name: string;
  email: string;
  message: string;
}

interface TravelAgencyContactInput {
  subject: string;
  message: string;
  senderName: string;
  senderEmail: string;
  attachments?: File[];
}

interface ContactResponse {
  sentAt: string;
  recipient: string;
  attachments?: number;
}

/**
 * Hook for sending contact form from landing page (public - no auth required)
 * POST /api/v1/contact/system
 */
export const useSendSystemContact = (
  options?: UseMutationOptions<
    ApiResponse<ContactResponse>,
    AxiosError,
    SystemContactInput
  >
) => {
  return useMutation({
    mutationFn: async (data: SystemContactInput) => {
      // Use axios directly without auth interceptor for public endpoint
      const response = await axios.post<ApiResponse<ContactResponse>>(
        `${BASE_URL}/contact/system`,
        data
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Hook for sending contact form from user dashboard (with file attachments)
 * POST /api/v1/contact/travel-agency
 */
export const useSendTravelAgencyContact = (
  options?: UseMutationOptions<
    ApiResponse<ContactResponse>,
    AxiosError,
    TravelAgencyContactInput
  >
) => {
  return useMutation({
    mutationFn: async (data: TravelAgencyContactInput) => {
      const formData = new FormData();
      formData.append("subject", data.subject);
      formData.append("message", data.message);
      formData.append("senderName", data.senderName);
      formData.append("senderEmail", data.senderEmail);

      // Append file attachments if any
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const response = await apiClient.post<ApiResponse<ContactResponse>>(
        "/contact/travel-agency",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    ...options,
  });
};