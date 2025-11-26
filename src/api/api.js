import axios from "axios";

// Địa chỉ API backend của bạn
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";


const getToken = () => {
  return sessionStorage.getItem("token");
};

// Tạo instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây
});

// 🟦 INTERCEPTOR GỬI TOKEN LÊN SERVER
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);




export default api;
