import api from "../api";

export const getCurrentUser = async () => {
  const res = await api.get("/api/user/me");
  return res.data.result;
};

export const search = async (params) => {
  const res = await api.get("/api/user/search", { params });
  return res.data.result; 
};

// Upload avatar - cần truyền file và userId
export const uploadAvatar = async (file, userId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const res = await api.post("/api/user/uploads/avatar", formData);
  return res.data.result;
};






