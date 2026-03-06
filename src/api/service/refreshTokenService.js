import axios from "axios";

export const refesh = () => {
  return axios.post(
    "http://localhost:8080/api/token/refresh",
    {},
    { withCredentials: true }
  );
};