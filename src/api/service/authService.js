import api from "../api";
export const login=(data)=>api.post("/api/auth/login",data);
export const register=(data)=>api.post("/api/user/register",data);
export const logout=(id)=>api.put(`/api/auth/logout/${id}`);