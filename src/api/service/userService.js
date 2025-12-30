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
export const uploadCover = async (file, userId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const res = await api.post("/api/user/uploads/cover", formData);
  return res.data.result;
};
export const editInfor=async (userId,data)=>{
 const res=await api.put("/api/user/editInfor",data,{
  params:{
    userId:userId
  }
 })
 return res.data.result;
}
export const changePass=async (userId,data)=>{
 const res=await api.put("/api/user/editPass",data,{
  params:{
    userId:userId
  }
 })
 return res.data.result;
}
export const seenProfile = async (meId, otherId) => {
  const res = await api.get("/api/user/seen", {
    params: {
      meId: meId,
      otherId: otherId
    }
  });
  return res.data.result;
};
export const getAllCustomer=async(page,size)=>{
  const res=await api.get("/api/user/customer",null,{
    params:{
      page:page,
      size:size
    }
  }

  )
}
export const lockCustomer=async(userId)=>{
  const res=await api.put("/api/user/customer/lock",null,{
    params:{
      userId:userId
    }
  }

  )
}
export const unlockCustomer=async(userId)=>{
  const res=await api.put("/api/user/customer/unlock",null,{
    params:{
      userId:userId
    }
  }

  )
}



