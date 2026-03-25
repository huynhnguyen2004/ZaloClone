import api from "../api";
export const login=(data)=>api.post("/api/auth/login",data);
export const register=(data)=>api.post("/api/auth/register",data);
export const logout=(config)=>api.put("/api/auth/logout", null, config);
export const sendOtp=(data)=>api.post("/api/auth/send-otp",data);
export const verifyOtp=(data)=>api.post("/api/auth/verify-otp",data);
export const resetPassword=(data)=>api.post("/api/auth/reset-password",data)
