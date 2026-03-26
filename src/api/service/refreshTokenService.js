import axios from "axios";

export const refresh = () => {
  return axios.post(
    "http://localhost:8080/api/auth/refresh",
    {},
    { withCredentials: true }
  );
};