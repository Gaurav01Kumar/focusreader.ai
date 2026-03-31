// services/apiRequest.ts
import { useAuth } from "@clerk/clerk-react";
import axios, { AxiosError, type AxiosInstance } from "axios";

type APIError = {
  status: number;
  message: string;
  error?: any;
};

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

// Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true,
});

// 🔥 Set token function
export const setAuthToken = () => {
   const { getToken } = useAuth()
  if (getToken) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${getToken}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

// 401 handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log("Unauthorized request");
    }
    return Promise.reject(error);
  }
);

// Error handler
const handleApiError = (error: unknown): APIError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;

    return {
      status: error.response?.status || 500,
      message: data?.message || error.message || "An unknown error occurred",
      error: data?.error || error.toJSON?.() || error.message,
    };
  }

  return {
    status: 500,
    message: "An unknown error occurred",
    error,
  };
};

// API methods
export const apiRequest = {
  get: async <T>(url: string, options?: RequestOptions): Promise<T> => {
    try {
      const res = await apiClient.get<T>(url, options);
      return res.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  post: async <T, B = unknown>(
    url: string,
    body: B,
    options?: RequestOptions
  ): Promise<T> => {
    try {
      const res = await apiClient.post<T>(url, body, options);
      return res.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  put: async <T, B = unknown>(
    url: string,
    body: B,
    options?: RequestOptions
  ): Promise<T> => {
    try {
      const res = await apiClient.put<T>(url, body, options);
      return res.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async <T>(url: string, options?: RequestOptions): Promise<T> => {
    try {
      const res = await apiClient.delete<T>(url, options);
      return res.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};