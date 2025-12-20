import api from "../api";
export const getOrCreateConversation = async (userA, userB) => {
  const res = await api.post(
    "/api/conversations/private",
    null,
    {
      params: {
        userA,
        userB,
      },
    }
  );
  return res.data.result;
}
export const getMyConversations = async (userId) => {
  const res = await api.get("/api/conversations/my", {
    params: { userId }
  });
  return res.data.result;
};
