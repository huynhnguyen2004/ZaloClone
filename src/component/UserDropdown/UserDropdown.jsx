import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    BiUser, 
    BiCog, 
    BiLogOut, 
    BiShield,
    BiMoon,
    BiSun,
    BiHelpCircle,
    BiInfoCircle,
    BiLock,
    BiShow,
    BiHide,
    BiCheck,
    BiX,
    BiCheckCircle,
    BiErrorCircle
} from "react-icons/bi";
import { acceptFriend, rejectFriendRequest, unRequestFriend } from "../../api/service/friend";
import { changePass } from "../../api/service/userService";
import { sendSocketData } from "../../api/websocket";
import { getAvatarUrl } from "../../utils/avatarHelper";
import "./UserDropdown.css";
import { UserContext } from "../../context/userContext";

function UserDropdown() {
    const navigate = useNavigate();
    const { currentUser, logout,isUserOnline} =  useContext(UserContext);;
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
    const [passwordErrors, setPasswordErrors] = useState({});
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleMenuClick = (action) => {
        setIsOpen(false);
        
        switch (action) {
            case 'profile':
                navigate('/profile');
                break;
            case 'settings':
                console.log('Open settings');
                break;
            case 'privacy':
                console.log('Open privacy settings');
                break;
            case 'help':
                console.log('Open help');
                break;
            case 'about':
                console.log('Open about');
                break;
            case 'logout':
                logout();
                break;
            case 'darkmode':
                setIsDarkMode(!isDarkMode);
                break;
            default:
                break;
        }
    };

   
    // Mở modal đổi mật khẩu
    const handleOpenChangePassword = () => {
        setIsOpen(false);
        setShowChangePassword(true);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordErrors({});
        setPasswordMessage({ type: "", text: "" });
    };

    // Đóng modal đổi mật khẩu
    const handleCloseChangePassword = () => {
        if (!passwordLoading) {
            setShowChangePassword(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPassword({ current: false, new: false, confirm: false });
            setPasswordErrors({});
            setPasswordMessage({ type: "", text: "" });
        }
    };

    // Xử lý thay đổi input mật khẩu
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        // Clear error khi user bắt đầu nhập
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // Toggle hiển thị mật khẩu
    const toggleShowPassword = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Tính độ mạnh mật khẩu
    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, text: "", color: "" };
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, text: "Yếu", color: "#ef4444" };
        if (score <= 2) return { level: 2, text: "Trung bình", color: "#f59e0b" };
        if (score <= 3) return { level: 3, text: "Khá", color: "#3b82f6" };
        return { level: 4, text: "Mạnh", color: "#22c55e" };
    };

    
    // Validate form đổi mật khẩu
    const validatePasswordForm = () => {
        const errors = {};
        
        if (!passwordData.currentPassword) {
            errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
        }
        
        if (!passwordData.newPassword) {
            errors.newPassword = "Vui lòng nhập mật khẩu mới";
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
        } else if (passwordData.newPassword === passwordData.currentPassword) {
            errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
        }
        
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
        } else if (passwordData.confirmPassword !== passwordData.newPassword) {
            errors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }
        
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Gửi yêu cầu đổi mật khẩu
    const handleSubmitChangePassword = async () => {
        if (!validatePasswordForm()) return;
        
        try {
            setPasswordLoading(true);
            setPasswordMessage({ type: "", text: "" });
            
            await changePass(currentUser.id, {
                oldPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
            
            // Đóng modal sau 2s nếu thành công
            setTimeout(() => {
                handleCloseChangePassword();
            }, 2000);
            
        } catch (err) {
            console.error("Change password error:", err);
            const errorMsg = err.response?.data?.messenge;
            setPasswordMessage({ type: "error", text: errorMsg });
        } finally {
            setPasswordLoading(false);
        }
    };

    const passwordStrength = getPasswordStrength(passwordData.newPassword);

    return (
        <div className="user-dropdown" ref={dropdownRef}>
            {/* User Avatar Button */}
            <button 
                className="user-dropdown-trigger"
                onClick={handleToggle}
                title={currentUser?.firstname}
            >
                <div className="user-avatar-small">
                    <img src={getAvatarUrl(currentUser?.avatarUrl)} alt="Avatar" />
                </div>
                
                {currentUser?.firstname && (
                    <span className="user-name-text">{currentUser.firstname}</span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="dropdown-menu">
                    {/* User Info Section */}
                    <div className="dropdown-header">
                        <div className="dropdown-user-info">
                            <div className="dropdown-avatar">
                                <img src={getAvatarUrl(currentUser?.avatarUrl)} alt="Avatar" />
                            </div>
                            <div className="dropdown-user-details">
                                <h4>{currentUser?.firstname} {currentUser?.lastname}</h4>
                                <p>{currentUser?.phone}</p>
                                <p className="user-status" style={{
                                    color: isUserOnline(currentUser.id)? '#31a24c' : '#ccc',
                                    fontSize: '12px'
                                }}>
                                    { isUserOnline(currentUser.id) ? '● Đang hoạt động' : '● Ngoại tuyến'}
                                </p>
                            </div>
                        </div>

                    </div>

                   

                    <div className="dropdown-divider"></div>

                    {/* Menu Items */}
                    <div className="dropdown-body">
                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('profile')}
                        >
                            <BiUser className="dropdown-icon" />
                            <span>Thông tin cá nhân</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('settings')}
                        >
                            <BiCog className="dropdown-icon" />
                            <span>Cài đặt</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('privacy')}
                        >
                            <BiShield className="dropdown-icon" />
                            <span>Quyền riêng tư</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={handleOpenChangePassword}
                        >
                            <BiLock className="dropdown-icon" />
                            <span>Đổi mật khẩu</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('darkmode')}
                        >
                            {isDarkMode ? (
                                <BiSun className="dropdown-icon" />
                            ) : (
                                <BiMoon className="dropdown-icon" />
                            )}
                            <span>{isDarkMode ? "Chế độ sáng" : "Chế độ tối"}</span>
                        </button>

                        <div className="dropdown-divider"></div>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('help')}
                        >
                            <BiHelpCircle className="dropdown-icon" />
                            <span>Trợ giúp</span>
                        </button>

                        <button 
                            className="dropdown-item"
                            onClick={() => handleMenuClick('about')}
                        >
                            <BiInfoCircle className="dropdown-icon" />
                            <span>Về Zalo</span>
                        </button>

                        <div className="dropdown-divider"></div>

                        <button 
                            className="dropdown-item logout-item"
                            onClick={() => handleMenuClick('logout')}
                        >
                            <BiLogOut className="dropdown-icon" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            <AnimatePresence>
                {showChangePassword && (
                    <motion.div 
                        className="password-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseChangePassword}
                    >
                        <motion.div 
                            className="password-modal"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="password-modal-header">
                                <div className="password-header-icon">
                                    <BiLock size={24} />
                                </div>
                                <h3>Đổi mật khẩu</h3>
                                <button 
                                    className="password-modal-close"
                                    onClick={handleCloseChangePassword}
                                    disabled={passwordLoading}
                                >
                                    <BiX size={24} />
                                </button>
                            </div>

                            {/* Alert Message */}
                            <AnimatePresence>
                                {passwordMessage.text && (
                                    <motion.div 
                                        className={`password-alert ${passwordMessage.type}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        {passwordMessage.type === "success" ? (
                                            <BiCheckCircle size={20} />
                                        ) : (
                                            <BiErrorCircle size={20} />
                                        )}
                                        <span>{passwordMessage.text}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Modal Body */}
                            <div className="password-modal-body">
                                {/* Current Password */}
                                <div className={`password-input-group ${passwordErrors.currentPassword ? 'has-error' : ''}`}>
                                    <label>Mật khẩu hiện tại</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword.current ? "text" : "password"}
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Nhập mật khẩu hiện tại"
                                            disabled={passwordLoading}
                                            autoComplete="current-password"
                                        />
                                        <button 
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => toggleShowPassword('current')}
                                            tabIndex={-1}
                                        >
                                            {showPassword.current ? <BiHide size={20} /> : <BiShow size={20} />}
                                        </button>
                                    </div>
                                    {passwordErrors.currentPassword && (
                                        <span className="password-error">{passwordErrors.currentPassword}</span>
                                    )}
                                </div>

                                {/* New Password */}
                                <div className={`password-input-group ${passwordErrors.newPassword ? 'has-error' : ''}`}>
                                    <label>Mật khẩu mới</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword.new ? "text" : "password"}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                            disabled={passwordLoading}
                                            autoComplete="new-password"
                                        />
                                        <button 
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => toggleShowPassword('new')}
                                            tabIndex={-1}
                                        >
                                            {showPassword.new ? <BiHide size={20} /> : <BiShow size={20} />}
                                        </button>
                                    </div>
                                    {passwordErrors.newPassword && (
                                        <span className="password-error">{passwordErrors.newPassword}</span>
                                    )}
                                    
                                    {/* Password Strength Indicator */}
                                    {passwordData.newPassword && (
                                        <div className="password-strength">
                                            <div className="strength-bars">
                                                {[1, 2, 3, 4].map((level) => (
                                                    <div 
                                                        key={level}
                                                        className={`strength-bar ${passwordStrength.level >= level ? 'active' : ''}`}
                                                        style={{ 
                                                            backgroundColor: passwordStrength.level >= level ? passwordStrength.color : '#e5e7eb' 
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span 
                                                className="strength-text"
                                                style={{ color: passwordStrength.color }}
                                            >
                                                {passwordStrength.text}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className={`password-input-group ${passwordErrors.confirmPassword ? 'has-error' : ''}`}>
                                    <label>Xác nhận mật khẩu mới</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword.confirm ? "text" : "password"}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Nhập lại mật khẩu mới"
                                            disabled={passwordLoading}
                                            autoComplete="new-password"
                                        />
                                        <button 
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => toggleShowPassword('confirm')}
                                            tabIndex={-1}
                                        >
                                            {showPassword.confirm ? <BiHide size={20} /> : <BiShow size={20} />}
                                        </button>
                                    </div>
                                    {passwordErrors.confirmPassword && (
                                        <span className="password-error">{passwordErrors.confirmPassword}</span>
                                    )}
                                    {/* Match indicator */}
                                    {passwordData.confirmPassword && !passwordErrors.confirmPassword && passwordData.confirmPassword === passwordData.newPassword && (
                                        <span className="password-match">
                                            <BiCheck size={16} /> Mật khẩu khớp
                                        </span>
                                    )}
                                </div>

                                {/* Security Tips */}
                                <div className="password-tips">
                                    <h4>Mẹo tạo mật khẩu mạnh:</h4>
                                    <ul>
                                        <li className={passwordData.newPassword.length >= 8 ? 'valid' : ''}>
                                            <BiCheck size={14} /> Ít nhất 8 ký tự
                                        </li>
                                        <li className={/[A-Z]/.test(passwordData.newPassword) && /[a-z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                            <BiCheck size={14} /> Kết hợp chữ hoa và chữ thường
                                        </li>
                                        <li className={/[0-9]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                            <BiCheck size={14} /> Có chứa số
                                        </li>
                                        <li className={/[^a-zA-Z0-9]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                            <BiCheck size={14} /> Có ký tự đặc biệt (!@#$...)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="password-modal-footer">
                                <button 
                                    className="password-cancel-btn"
                                    onClick={handleCloseChangePassword}
                                    disabled={passwordLoading}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="password-submit-btn"
                                    onClick={handleSubmitChangePassword}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? (
                                        <>
                                            <div className="password-spinner"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <BiCheck size={20} />
                                            Đổi mật khẩu
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default UserDropdown;
