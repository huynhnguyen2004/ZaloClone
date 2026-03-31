import api from "../api";
export const getAllNotification=async(params)=>{
    return api.get("/api/notifications",{params});

}