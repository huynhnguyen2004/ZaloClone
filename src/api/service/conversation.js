import api from "../api";
export const getOrCreateConversation = async (params) => {
  const res = await api.post("/api/conversations/private", null, {
    params
  });
  return res.data.result;
};
export const getMyConversations = async (userId) => {
  const res = await api.get("/api/conversations");
  return res.data.result;
};
