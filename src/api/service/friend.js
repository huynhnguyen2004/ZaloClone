import api from "../api";

// nếu BE dùng POST /api/friend/send with body { senderId, receiverId }
export const sendFriendRequest = async (senderId, receiverId) => {
  return api.post("/api/friendrequest/send", { senderId, receiverId });
};

// Nếu BE expects requestId in body for accept
export const acceptFriend = async (meId, otherId) => {
  const res = await api.put("/api/friendrequest/accept", null, {
    params: { meId, otherId }
  });
  return res.data.result;
};

export const getAllFriendSend=async(params)=>{
  return api.get("/api/friendrequest",{params})
}
export const getAllFriend=async(params)=>{
  return api.get("/api/friends",{params})
}


export const unFriend = async (params) => {
  return api.delete("/api/friends/unfriend", {params});
};
export const unRequestFriend=async (meId,userId)=>{
  return api.put("/api/friendrequest/cancele",
    null,
    {params:{
      meId:meId,
      userId:userId
    }});
}
export const rejectFriendRequest=async (meId,userId)=>{
  return api.put("/api/friendrequest/reject",
    null,
    {params:{
      meId:meId,
      userId:userId
    }});
}