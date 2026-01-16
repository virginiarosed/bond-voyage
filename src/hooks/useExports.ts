import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import { apiClient } from "../utils/axios/userAxios";

const getFileNameFromDisposition = (response: AxiosResponse, fallback: string) => {
  const disposition = response.headers["content-disposition"] as string | undefined;
  if (!disposition) return fallback;
  const match = disposition.match(/filename=([^;]+)/i);
  if (!match?.[1]) return fallback;
  return match[1].replace(/"/g, "").trim();
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

type ExportFormat = "pdf" | "csv";

interface ExportParams {
  format: ExportFormat;
  [key: string]: string | undefined;
}

const createExportHook = (
  endpoint: string,
  defaultFilename: string
) => {
  return (
    options?: UseMutationOptions<void, AxiosError, ExportParams>
  ) => {
    return useMutation({
      mutationFn: async (params: ExportParams) => {
        const { format, ...queryParams } = params;
        const response = await apiClient.get<Blob>(endpoint, {
          params: { format, ...queryParams },
          responseType: "blob",
        });

        const fallback = `${defaultFilename}_${new Date()
          .toISOString()
          .split("T")[0]}.${format}`;
        const filename = getFileNameFromDisposition(response, fallback);
        const contentType = response.headers["content-type"] ||
          (format === "pdf" ? "application/pdf" : "text/csv");
        const blob = new Blob([response.data], { type: contentType });

        downloadBlob(blob, filename);
      },
      ...options,
    });
  };
};

// Bookings export (active bookings)
export const useExportBookings = createExportHook("/exports/bookings", "bookings_export");

// History export (completed/cancelled bookings)
export const useExportHistory = createExportHook("/exports/history", "history_export");

// Users export
export const useExportUsers = createExportHook("/exports/users", "users_export");

// Activity logs export
export const useExportActivityLogs = createExportHook("/exports/activity-logs", "activity_logs_export");

// Itineraries export
export const useExportItineraries = createExportHook("/exports/itineraries", "itineraries_export");
