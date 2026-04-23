import api from "../api";
export const getOrCreateConversation = async (params) => {
  const res = await api.post("/api/conversations/private", null, {
    params
  });
  return res.data.result;
};
export const createGroup=async(data)=>{
  const res=await api.post("/api/conversation/group",data);
  return res.data.result;
}
export const getMyConversations = async ({ size = 20, lastMessageId } = {}) => {
  const res = await api.get("/api/conversations", {
    params: {
      size,
      ...(lastMessageId != null && { lastMessageId }),
    },
  });
  return res.data.result;
};
