import api from "../api";

export const getDashboard = async () => {
    const res = await api.get("/api/admin/dashboard");
    return res.data.result;
};