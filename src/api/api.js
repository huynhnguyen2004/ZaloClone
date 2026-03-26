import axios from "axios";
import { refesh } from "./service/refreshTokenService";
import { logout } from "./service/authService";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStorage";
import {
  enqueueFailedRequest,
  isRefreshInProgress,
  processRefreshQueue,
  setRefreshInProgress,
} from "./refreshState";

export const API_BASE_URL = "http://localhost:8080";

// Tạo instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// 🟦 INTERCEPTOR GỬI TOKEN LÊN SERVER
api.interceptors.request.use(
  async (config) => {
    const isLogoutRequest = config.url?.includes("/api/auth/logout");
    const shouldSkipRefreshByHeader = config.headers?.["X-Skip-Refresh"] === "true";
    const shouldSkipRefresh =
      config.url?.includes("/api/auth/login") ||
      config.url?.includes("/api/auth/register") ||
      config.url?.includes("/api/auth/send-otp") ||
      config.url?.includes("/api/auth/verify-otp") ||
      config.url?.includes("/api/auth/reset-password") ||
      isLogoutRequest ||
      shouldSkipRefreshByHeader ||
      config.url?.includes("/api/auth/refresh") ||
      config.url?.includes("/api/token/refresh");

    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    }

    if (shouldSkipRefresh) {
      return config;
    }

    if (isRefreshInProgress()) {
      return new Promise((resolve, reject) => {
        enqueueFailedRequest(resolve, reject);
      })
        .then((newToken) => {
          config.headers["Authorization"] = `Bearer ${newToken}`;
          return config;
        })
        .catch((error) => Promise.reject(error));
    }

    setRefreshInProgress(true);

    try {
      const refreshRes = await refesh();

      const newAccessToken = refreshRes?.data?.result?.accessToken;

      if (!newAccessToken) {
        throw new Error("No access token received");
      }

      setAccessToken(newAccessToken);
      processRefreshQueue(null, newAccessToken);
      config.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return config;
    } catch (error) {
      processRefreshQueue(error, null);
      return Promise.reject(error);
    } finally {
      setRefreshInProgress(false);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const originalRequest = error.config;

    // Bỏ qua interceptor cho các API auth
    if (
      originalRequest.url.includes("/api/auth/refresh") ||
      originalRequest.url.includes("/api/auth/logout") ||
      originalRequest.url.includes("/api/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (status === 401) {
      
      
      if (data?.message === "TOKEN_EXPIRED" && !originalRequest._retry) {
        if (isRefreshInProgress()) {
          // Nếu đang refresh, thêm request vào queue
          return new Promise((resolve, reject) => {
            enqueueFailedRequest(resolve, reject);
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        setRefreshInProgress(true);

        try {
          const res = await refesh();
          const newAccessToken = res?.data?.result?.accessToken;

         
      
          if (!newAccessToken) {
            throw new Error("No access token received");
          }

          setAccessToken(newAccessToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          processRefreshQueue(null, newAccessToken);

          return api(originalRequest);
        } catch (err) {
          processRefreshQueue(err, null);
          await logout();
          console.log(err);

          return Promise.reject(err);
        } finally {
          setRefreshInProgress(false);
        }
      }

      // Token invalid hoặc lỗi khác
      console.log("TOKEN_INVALID");
      await logout();
      return Promise.reject(error);
    }

    if (status === 403) {
      console.log("Tài khoản đã bị khóa");
      await logout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
