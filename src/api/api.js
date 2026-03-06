import axios from "axios";
import { refesh } from "./service/refreshTokenService";
import { logout } from "./service/authService";

// Địa chỉ API backend của bạn
export const API_BASE_URL = "http://localhost:8080";

const getToken = () => {
  return sessionStorage.getItem("token");
};

// Tạo instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Flag và queue để xử lý refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Logout trực tiếp bằng axios (không qua interceptor)
const logoutDirect = async () => {
  try {
    await axios.put(`${API_BASE_URL}/api/auth/logout`, null, {
      
      withCredentials: true,
    });
  } catch (err) {
    console.warn("Logout error:", err);
  }
};

// Xử lý clear session và redirect
const handleLogout = async () => {
  await logoutDirect();
  sessionStorage.removeItem("token");
  window.location.href = "/";
};

// 🟦 INTERCEPTOR GỬI TOKEN LÊN SERVER
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
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
        if (isRefreshing) {
          // Nếu đang refresh, thêm request vào queue
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await refesh();
          const newAccessToken = res?.data?.result?.accessToken;

         
      
          if (!newAccessToken) {
            throw new Error("No access token received");
          }

          sessionStorage.setItem("token", newAccessToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);

          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
         await logout();
          console.log(err);
          
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      // Token invalid hoặc lỗi khác
      console.log("TOKEN_INVALID");
      // await handleLogout();
      await logout();
      return Promise.reject(error);
    }

    if (status === 403) {
      console.log("Tài khoản đã bị khóa");
      await logout();
      // await handleLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
