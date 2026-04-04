// services/apiRequest.ts
import axios, { AxiosError,type AxiosInstance } from "axios";

type APIError = {
  status: number;
  message: string;
  error?: any;
};

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

// ✅ Global Axios instance with credentials and optional baseURL
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "", // optional
  withCredentials: true,
});

// ✅ Global 401 handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Optional: clear storage if needed
      // localStorage.clear();
      // sessionStorage.clear();

      // Redirect to login
     // window.location.href = "/login";
        const redirectUrl = encodeURIComponent(window.location.href);
    // window.location.href = `/auth/redirect/init/?redirectUrl=${redirectUrl}`;
     
    }

    return Promise.reject(error);
  }
);

// ✅ Error handler function
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

// ✅ Main exported request object
export const apiRequest = {
  get: async <T>(url: string, options?: RequestOptions): Promise<T> => {
    try {
      const res = await apiClient.get<T>(url, {
        headers: options?.headers,
        params: options?.params,
      });
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
      const res = await apiClient.post<T>(url, body, {
        headers: options?.headers,
        params: options?.params,
      });
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
      const res = await apiClient.put<T>(url, body, {
        headers: options?.headers,
        params: options?.params,
      });
      return res.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  delete: async <T>(url: string, options?: RequestOptions): Promise<T> => {
    try {
      const res = await apiClient.delete<T>(url, {
        headers: options?.headers,
        params: options?.params,
      });
      return res.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
