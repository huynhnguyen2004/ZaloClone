import axios from "axios";
import { refresh } from "./service/refreshTokenService";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStorage";

export const API_BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =======================
// RESPONSE: HANDLE REFRESH
// =======================
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // nếu không có response → lỗi mạng
    if (!error.response) {
      return Promise.reject(error);
    }

    // bỏ qua refresh cho auth API
    if (
      originalRequest.url.includes("/api/auth/login") ||
      originalRequest.url.includes("/api/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // =======================
    // TOKEN HẾT HẠN
    // =======================
    console.log(error);
    
    if (error.response.data.status === 401&&error.response.data.code === "TOKEN_EXPIRED" && !originalRequest._retry) {
      originalRequest._retry = true;
      
      
      // nếu đang refresh → đưa vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await refresh();
        const newToken = res?.data?.result?.accessToken;

        if (!newToken) throw new Error("No token");

        setAccessToken(newToken);

        // chạy lại các request đang chờ
        queue.forEach((cb) => cb(newToken));
        queue = [];

        // retry request hiện tại
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (err) {
        // refresh fail → logout
        clearAccessToken();
        window.location.href = "/";
        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;