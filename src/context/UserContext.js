import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../api/service/userService';
import { logout as logoutApi } from '../api/service/authService';
import { useNavigate } from 'react-router-dom';

// Tạo UserContext
const UserContext = createContext();

// Custom hook để sử dụng UserContext
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

// UserProvider component
export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Hàm lấy thông tin user từ session token
    const fetchCurrentUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Kiểm tra xem có token trong sessionStorage không
            const token = sessionStorage.getItem('token');
            if (!token) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            // Gọi API để lấy thông tin user hiện tại
            const userData = await getCurrentUser();
            setCurrentUser(userData);
        } catch (err) {
            console.error('Error fetching current user:', err);
            setError(err.message || 'Không thể lấy thông tin người dùng');
            
            // Nếu token không hợp lệ, xóa token khỏi sessionStorage
            if (err.response?.status === 401) {
                sessionStorage.removeItem('token');
                setCurrentUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = async () => {
        try {
            if (currentUser?.id) {
                await logoutApi(currentUser.id);   
            }
        } catch (err) {
            console.error("Logout API error:", err);
        }

        sessionStorage.removeItem("token");
        setCurrentUser(null);
        setError(null);
        navigate("/");
    };

    // Effect để tự động lấy thông tin user khi component mount
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    // Giá trị context
    const contextValue = {
        currentUser,
        loading,
        error,
        fetchCurrentUser,
        logout,
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
