import axios, { AxiosError, AxiosInstance } from "axios";
import { ApiResponse } from "../../types/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      console.log("🔴 401 Error detected, attempting token refresh...");

      if (isRefreshing) {
        console.log("⏳ Refresh already in progress, queueing request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      const accessToken = localStorage.getItem("accessToken");

      console.log("=== 🔍 TOKEN REFRESH DEBUG START ===");
      console.log("📦 Refresh token exists:", !!refreshToken);
      console.log("📦 Refresh token length:", refreshToken?.length || 0);
      console.log(
        "📦 Refresh token (first 30 chars):",
        refreshToken?.substring(0, 30) + "..."
      );
      console.log("📦 Access token exists:", !!accessToken);
      console.log(
        "📦 Access token (first 30 chars):",
        accessToken?.substring(0, 30) + "..."
      );
      console.log("🌐 Request URL:", `${BASE_URL}/auth/refresh-token`);
      console.log("📤 Request body:", {
        refreshToken: refreshToken ? "EXISTS" : "NULL",
      });

      if (!refreshToken) {
        console.error("❌ No refresh token available in localStorage");
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(new Error("No refresh token available"));
      }

      try {
        console.log("📡 Sending refresh token request...");

        const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            withCredentials: true,
          }
        );

        console.log("✅ Refresh request successful!");
        console.log("📥 Response data:", data);
        console.log("📥 New access token exists:", !!data.data?.accessToken);
        console.log(
          "📥 New access token (first 30 chars):",
          data.data?.accessToken?.substring(0, 30) + "..."
        );

        if (data.data?.accessToken) {
          const newAccessToken = data.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);

          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          console.log(
            "✅ Token refresh complete, retrying original request..."
          );
          console.log("=== 🔍 TOKEN REFRESH DEBUG END ===\n");

          return apiClient(originalRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
      } catch (refreshError: any) {
        console.error("=== ❌ TOKEN REFRESH FAILED ===");
        console.error("Status code:", refreshError.response?.status);
        console.error("Status text:", refreshError.response?.statusText);
        console.error("Error response data:", refreshError.response?.data);
        console.error("Error message:", refreshError.message);
        console.error("Request headers:", refreshError.config?.headers);
        console.error("Request data:", refreshError.config?.data);
        console.error("Full error:", refreshError);
        console.error("=== ❌ TOKEN REFRESH DEBUG END ===\n");

        processQueue(refreshError, null);
        isRefreshing = false;

        // Check if the refresh token itself was invalid/expired
        if (refreshError.response?.status === 401) {
          console.error(
            "🚫 Refresh token expired or invalid - redirecting to login"
          );
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export a test function to manually test refresh
export const testTokenRefresh = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  console.log("\n=== 🧪 MANUAL REFRESH TEST ===");
  console.log("Refresh token:", refreshToken);

  if (!refreshToken) {
    console.error("No refresh token found!");
    return;
  }

  // Test 1: Body method (current approach)
  try {
    console.log("\n📤 Test 1: Sending refresh token in body...");
    const response1 = await axios.post(
      `${BASE_URL}/auth/refresh-token`,
      { refreshToken },
      { withCredentials: true }
    );
    console.log("✅ Body method SUCCESS:", response1.data);
  } catch (e: any) {
    console.error("❌ Body method FAILED:");
    console.error("Status:", e.response?.status);
    console.error("Data:", e.response?.data);
  }

  // Test 2: Cookie-only method
  try {
    console.log("\n📤 Test 2: Sending with cookies only (no body)...");
    const response2 = await axios.post(
      `${BASE_URL}/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
    console.log("✅ Cookie method SUCCESS:", response2.data);
  } catch (e: any) {
    console.error("❌ Cookie method FAILED:");
    console.error("Status:", e.response?.status);
    console.error("Data:", e.response?.data);
  }

  // Test 3: Authorization header method
  try {
    console.log(
      "\n📤 Test 3: Sending refresh token in Authorization header..."
    );
    const response3 = await axios.post(
      `${BASE_URL}/auth/refresh-token`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    console.log("✅ Header method SUCCESS:", response3.data);
  } catch (e: any) {
    console.error("❌ Header method FAILED:");
    console.error("Status:", e.response?.status);
    console.error("Data:", e.response?.data);
  }

  console.log("=== 🧪 MANUAL REFRESH TEST END ===\n");
};
