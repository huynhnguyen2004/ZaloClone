import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    BiArrowBack, 
    BiCamera, 
    BiPhone, 
    BiUser,
    BiCalendar,
    BiShield,
    BiCheck,
    BiX,
    BiImageAdd,
    BiMale,
    BiCake,
    BiEdit,
    BiSave
} from "react-icons/bi";
import { MdVerified } from "react-icons/md";
import { getAvatarUrl, getCoverUrl } from "../../utils/avatarHelper";
import { uploadAvatar, uploadCover, editInfor, getCurrentUser } from "../../api/service/userService";
import "./ProfilePage.css";
import { AuthContext } from "../../context/authContext";

function ProfilePage() {
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [showAvatarPreview, setShowAvatarPreview] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        gender: null,
        birthday: ""
    });
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Khởi tạo form data khi mở modal
    useEffect(() => {
        if (showEditModal && currentUser) {
            setFormData({
                firstname: currentUser.firstname || "",
                lastname: currentUser.lastname || "",
                gender: currentUser.gender,
                birthday: currentUser.birthday ? currentUser.birthday.split("T")[0] : ""
            });
        }
    }, [showEditModal, currentUser]);

    // Xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "gender" ? (value === "" ? null : parseInt(value)) : value
        }));
    };

    // Lưu thông tin đã chỉnh sửa
    const handleSaveInfo = async () => {
        try {
            setIsEditing(true);
            await editInfor(currentUser.id, formData);
            await getCurrentUser();
            setShowEditModal(false);
            setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
        } catch (err) {
            console.error("Edit info error:", err);
            setMessage({ type: "error", text: "Không thể cập nhật thông tin" });
        } finally {
            setIsEditing(false);
        }
    };

    // Xử lý quay lại
    const handleBack = () => {
        navigate("/home");
    };

    // Click vào avatar để xem
    const handleAvatarClick = () => {
        setShowAvatarPreview(true);
    };

    // Click nút camera để upload
    const handleCameraClick = (e) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    // Upload avatar
    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Vui lòng chọn file ảnh" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "Ảnh không được vượt quá 5MB" });
            return;
        }

        try {
            setUploadingAvatar(true);
            await uploadAvatar(file, currentUser.id);
            await getCurrentUser();
            setMessage({ type: "success", text: "Cập nhật ảnh đại diện thành công!" });
        } catch (err) {
            console.error("Upload avatar error:", err);
            setMessage({ type: "error", text: "Không thể cập nhật ảnh đại diện" });
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Upload cover
    const handleCoverChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Vui lòng chọn file ảnh" });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: "error", text: "Ảnh bìa không được vượt quá 10MB" });
            return;
        }

        try {
            setUploadingCover(true);
            await uploadCover(file, currentUser.id);
           await getCurrentUser();
            setMessage({ type: "success", text: "Cập nhật ảnh bìa thành công!" });
        } catch (err) {
            console.error("Upload cover error:", err);
            setMessage({ type: "error", text: "Không thể cập nhật ảnh bìa" });
        } finally {
            setUploadingCover(false);
            if (coverInputRef.current) coverInputRef.current.value = "";
        }
    };

    // Click nút camera cover để upload
    const handleCoverCameraClick = () => {
        coverInputRef.current?.click();
    };

    // Clear message sau 3s
    React.useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Format ngày
    const formatDate = (dateString) => {
        if (!dateString) return "Chưa cập nhật";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit", 
            year: "numeric"
        });
    };

    // Format giới tính
    const formatGender = (gender) => {
        if (gender === null || gender === undefined) return "Chưa cập nhật";
        switch (gender) {
            case 0: return "Nam";
            case 1: return "Nữ";
            case 2: return "Khác";
            default: return "Chưa cập nhật";
        }
    };

    const fullName = `${currentUser?.firstname || ""} ${currentUser?.lastname || ""}`.trim() || "Người dùng";

    return (
        <div className="zalo-profile-page">
            {/* Header */}
            <div className="zalo-profile-header">
                <button className="zalo-back-btn" onClick={handleBack}>
                    <BiArrowBack size={24} />
                </button>
                <h1>Thông tin cá nhân</h1>
                <div className="header-spacer"></div>
            </div>

            {/* Toast Message */}
            <AnimatePresence>
                {message.text && (
                    <motion.div 
                        className={`zalo-toast ${message.type}`}
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                    >
                        {message.type === "success" ? <BiCheck size={20} /> : <BiX size={20} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cover & Avatar Section */}
            <div className="zalo-cover-section">
                <div className="zalo-cover-image" style={getCoverUrl(currentUser?.coverUrl) ? {
                    backgroundImage: `url(${getCoverUrl(currentUser?.coverUrl)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}>
                    <div className="cover-gradient"></div>
                    <button 
                        className="zalo-cover-camera-btn"
                        onClick={handleCoverCameraClick}
                        disabled={uploadingCover}
                    >
                        {uploadingCover ? (
                            <div className="cover-spinner"></div>
                        ) : (
                            <BiCamera size={18} />
                        )}
                    </button>
                    <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverChange}
                        accept="image/*"
                        hidden
                    />
                </div>
                
                <div className="zalo-avatar-container">
                    <div className="zalo-avatar-wrapper" onClick={handleAvatarClick}>
                        <img 
                            src={getAvatarUrl(currentUser?.avatarUrl)} 
                            alt="Avatar"
                            className="zalo-avatar-img"
                        />
                        {uploadingAvatar && (
                            <div className="avatar-loading-overlay">
                                <div className="avatar-spinner"></div>
                            </div>
                        )}
                        <button 
                            className="zalo-camera-btn"
                            onClick={handleCameraClick}
                            disabled={uploadingAvatar}
                        >
                            <BiCamera size={16} />
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        hidden
                    />
                </div>

                <div className="zalo-name-section">
                    <h2 className="zalo-display-name">
                        {fullName}
                        {currentUser?.role === "Admin" && (
                            <MdVerified className="verified-badge" title="Quản trị viên" />
                        )}
                    </h2>
                    <div className="zalo-online-status">
                        <span className={`status-dot ${currentUser?.online ? "online" : "offline"}`}></span>
                        {currentUser?.online ? "Đang hoạt động" : "Ngoại tuyến"}
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="zalo-info-section">
                <div className="zalo-section-title">
                    <BiUser size={20} />
                    <span>Thông tin cá nhân</span>
                    <button 
                        className="edit-info-btn"
                        onClick={() => setShowEditModal(true)}
                    >
                        <BiEdit size={18} />
                        <span>Chỉnh sửa</span>
                    </button>
                </div>

                <div className="zalo-info-card">
                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiUser className="info-icon" />
                            <span>Họ</span>
                        </div>
                        <div className="info-value">{currentUser?.firstname || "Chưa cập nhật"}</div>
                    </div>

                    <div className="zalo-info-divider"></div>

                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiUser className="info-icon" />
                            <span>Tên</span>
                        </div>
                        <div className="info-value">{currentUser?.lastname || "Chưa cập nhật"}</div>
                    </div>

                    <div className="zalo-info-divider"></div>

                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiPhone className="info-icon" />
                            <span>Số điện thoại</span>
                        </div>
                        <div className="info-value phone-value">
                            {currentUser?.phone || "Chưa cập nhật"}
                        </div>
                    </div>

                    <div className="zalo-info-divider"></div>

                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiMale className="info-icon" />
                            <span>Giới tính</span>
                        </div>
                        <div className="info-value">{formatGender(currentUser?.gender)}</div>
                    </div>

                    <div className="zalo-info-divider"></div>

                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiCake className="info-icon" />
                            <span>Ngày sinh</span>
                        </div>
                        <div className="info-value">{formatDate(currentUser?.birthday)}</div>
                    </div>

                    <div className="zalo-info-divider"></div>

                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiCalendar className="info-icon" />
                            <span>Ngày tham gia</span>
                        </div>
                        <div className="info-value">{formatDate(currentUser?.createdAt)}</div>
                    </div>

                    <div className="zalo-info-divider"></div>

                    <div className="zalo-info-item">
                        <div className="info-label">
                            <BiShield className="info-icon" />
                            <span>Vai trò</span>
                        </div>
                        <div className="info-value">
                            <span className={`role-tag ${currentUser?.role?.toLowerCase()}`}>
                                {currentUser?.role === "Admin" ? "Quản trị viên" : "Người dùng"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Preview Modal */}
            <AnimatePresence>
                {showAvatarPreview && (
                    <motion.div 
                        className="avatar-preview-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAvatarPreview(false)}
                    >
                        <motion.div 
                            className="avatar-preview-container"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                className="preview-close-btn"
                                onClick={() => setShowAvatarPreview(false)}
                            >
                                <BiX size={28} />
                            </button>
                            <img 
                                src={getAvatarUrl(currentUser?.avatarUrl)} 
                                alt="Avatar Preview"
                                className="avatar-preview-img"
                            />
                            <div className="preview-actions">
                                <button 
                                    className="preview-action-btn"
                                    onClick={() => {
                                        setShowAvatarPreview(false);
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <BiImageAdd size={20} />
                                    <span>Đổi ảnh đại diện</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Info Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div 
                        className="edit-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isEditing && setShowEditModal(false)}
                    >
                        <motion.div 
                            className="edit-modal-container"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="edit-modal-header">
                                <h3>Chỉnh sửa thông tin</h3>
                                <button 
                                    className="edit-modal-close"
                                    onClick={() => !isEditing && setShowEditModal(false)}
                                    disabled={isEditing}
                                >
                                    <BiX size={24} />
                                </button>
                            </div>

                            <div className="edit-modal-body">
                                <div className="edit-form-group">
                                    <label>
                                        <BiUser className="form-icon" />
                                        Họ
                                    </label>
                                    <input
                                        type="text"
                                        name="firstname"
                                        value={formData.firstname}
                                        onChange={handleInputChange}
                                        placeholder="Nhập họ"
                                        disabled={isEditing}
                                    />
                                </div>

                                <div className="edit-form-group">
                                    <label>
                                        <BiUser className="form-icon" />
                                        Tên
                                    </label>
                                    <input
                                        type="text"
                                        name="lastname"
                                        value={formData.lastname}
                                        onChange={handleInputChange}
                                        placeholder="Nhập tên"
                                        disabled={isEditing}
                                    />
                                </div>

                                <div className="edit-form-group">
                                    <label>
                                        <BiMale className="form-icon" />
                                        Giới tính
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender === null ? "" : formData.gender}
                                        onChange={handleInputChange}
                                        disabled={isEditing}
                                    >
                                        <option value="">Chọn giới tính</option>
                                        <option value="0">Nam</option>
                                        <option value="1">Nữ</option>
                                        <option value="2">Khác</option>
                                    </select>
                                </div>

                                <div className="edit-form-group">
                                    <label>
                                        <BiCake className="form-icon" />
                                        Ngày sinh
                                    </label>
                                    <input
                                        type="date"
                                        name="birthday"
                                        value={formData.birthday}
                                        onChange={handleInputChange}
                                        disabled={isEditing}
                                    />
                                </div>
                            </div>

                            <div className="edit-modal-footer">
                                <button 
                                    className="edit-cancel-btn"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={isEditing}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="edit-save-btn"
                                    onClick={handleSaveInfo}
                                    disabled={isEditing}
                                >
                                    {isEditing ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <BiSave size={18} />
                                            Lưu thay đổi
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

export default ProfilePage;
