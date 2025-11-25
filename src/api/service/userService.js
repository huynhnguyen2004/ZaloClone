import api from "../api";

export const getCurrentUser = async () => {
  const res = await api.get("/api/user/me");
  return res.data.result;
};





