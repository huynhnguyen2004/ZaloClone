import api from "../api";

export const sendFriendRequest = async (params) => {
  return api.post("/api/friendrequest/send",null, {params});
};


export const acceptFriend = async (params) => {
  const res = await api.put("/api/friendrequest/accept", null, {params});
 
  return res.data.result;
};

export const getAllFriendRequest=async(params)=>{
  return api.get("/api/friendrequest",{params})
    
}
export const getAllFriend=async(params)=>{
  return api.get("/api/friends",{params})
}


export const unFriend = async (params) => {
  return api.delete("/api/friends/unfriend", {params});
};
export const unRequestFriend=async (params)=>{
  return api.put("/api/friendrequest/cancele",
    null,
    {params});
}
export const rejectFriendRequest=async (params)=>{
  return api.put("/api/friendrequest/reject",
    null,
    {params});
}