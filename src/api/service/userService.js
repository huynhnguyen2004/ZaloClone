import api from "../api";

export const getCurrentUser = async () => {
  const res = await api.get("/api/user/me");
  return res.data.result;
};
export const search = async (params) => {
  const res = await api.get("/api/user/search", { params });
  return res.data.result; 
};






