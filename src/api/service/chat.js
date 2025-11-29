import api from "../api";

export const sendMessage=async(data)=>{
    const res=await api.post("/api/message/send",data);
    return res.data.result;
}
export const getMessage = async (currentUserId, friendId) => {
  const res = await api.get("/api/message", {
    params: {
      currentUserId: currentUserId,
      id: friendId,
    }
  });

  return res.data.result;
};
