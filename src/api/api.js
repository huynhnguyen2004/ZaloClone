import axios from "axios";

// Địa chỉ API backend của bạn
export const API_BASE_URL =
   process.env.REACT_APP_API_BASE_URL||"http://localhost:8080" ;




const getToken = () => {
  return sessionStorage.getItem("token");
};

// Tạo instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây
  withCredentials:true
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
     if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // 🔥 TOKEN HẾT HẠN / KHÔNG HỢP LỆ
    if (status === 401) {
      console.log("Token hết hạn hoặc không hợp lệ");

      sessionStorage.removeItem("token");
      window.location.href = "/";
    }

    // 🔥 USER BỊ ADMIN KHÓA
    if (status === 403) {
      console.log("Tài khoản đã bị khóa");

      alert("Tài khoản của bạn đã bị khóa!");
      sessionStorage.removeItem("token");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
  
)



export default api;
