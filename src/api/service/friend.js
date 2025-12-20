import api from "../api";

// nếu BE dùng POST /api/friend/send with body { senderId, receiverId }
export const sendFriendRequest = async (senderId, receiverId) => {
  return api.post("/api/friendrequest/send", { senderId, receiverId });
};

// Nếu BE expects requestId in body for accept
export const acceptFriendRequest = async (id) => {
  // adjust if backend route is /api/friend/accept/{id}
  return api.post("/api/friendrequest/accepted", { id});
  // OR if backend uses path var:
  // return api.post(`/api/friend/accept/${requestId}`);
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
export const unRequestFriend=async (id)=>{
  return api.put("/api/friendrequest/cancele",
    null,
    {params:{id:id}});
}
export const rejectFriendRequest=async (id)=>{
  return api.put("/api/friendrequest/reject",
    null,
    {params:{id:id}});
}