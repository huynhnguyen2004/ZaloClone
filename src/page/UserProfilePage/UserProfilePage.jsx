import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    BiArrowBack,
    BiUserPlus,
    BiUserMinus,
    BiUserCheck,
    BiCheck,
    BiMessageRounded,
    BiDotsHorizontalRounded,
    BiMale,
    BiFemale,
    BiX
} from "react-icons/bi";
import { FaUserClock, FaUserTimes } from "react-icons/fa";
import { useFriend, useSocial } from "../../context/friendContext";
import { useChat } from "../../context/chatContext";
import { seenProfile } from "../../api/service/userService";
import { 
    sendFriendRequest, 
    acceptFriend, 
    unFriend, 
    unRequestFriend,
    rejectFriendRequest 
} from "../../api/service/friend";
import { getAvatarUrl, getCoverUrl } from "../../utils/avatarHelper";
import "./UserProfilePage.css";
import { UserContext } from "../../context/userContext";

// RelationshipStatus constants
const RelationshipStatus = {
    FRIEND: "FRIEND",
    SENT_REQUEST: "SENT_REQUEST",
    RECEIVED_REQUEST: "RECEIVED_REQUEST",
    NONE: "NONE"
};

function UserProfilePage() {
    const navigate = useNavigate();
    const { userId } = useParams();
     const { currentUser } = useContext(UserContext);
    const { removeFriendRequest } = useFriend();
    const { openChat } = useChat();
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showAvatarPreview, setShowAvatarPreview] = useState(false);

    // Fetch profile khi load trang
    useEffect(() => {
        if (userId && currentUser?.id) {
            fetchProfile();
        }
    }, [userId, currentUser?.id]);

    // Clear message sau 3s
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await seenProfile(currentUser.id, userId);
            setProfile(data);
        } catch (err) {
            console.error("Fetch profile error:", err);
            setMessage({ type: "error", text: "Không thể tải thông tin người dùng" });
        } finally {
            setLoading(false);
        }
    };

    // Xử lý quay lại
    const handleBack = () => {
        navigate(-1);
    };

    // Xử lý thêm bạn bè
    const handleAddFriend = async () => {
        try {
            setActionLoading(true);
            await sendFriendRequest({userId:userId});
            setProfile(prev => ({ ...prev, relationshipStatus: RelationshipStatus.SENT_REQUEST }));
            setMessage({ type: "success", text: "Đã gửi lời mời kết bạn" });
        } catch (err) {
            console.error("Add friend error:", err);
            setMessage({ type: "error", text: "Không thể gửi lời mời kết bạn" });
        } finally {
            setActionLoading(false);
        }
    };

    // Xử lý hủy lời mời đã gửi
    const handleCancelRequest = async () => {
        try {
            setActionLoading(true);
            await unRequestFriend({userId:userId});
            setProfile(prev => ({ ...prev, relationshipStatus: RelationshipStatus.NONE }));
            setMessage({ type: "success", text: "Đã hủy lời mời kết bạn" });
        } catch (err) {
            console.error("Cancel request error:", err);
            setMessage({ type: "error", text: "Không thể hủy lời mời" });
        } finally {
            setActionLoading(false);
        }
    };

    // Xử lý chấp nhận lời mời
    const handleAcceptRequest = async () => {
        try {
            setActionLoading(true);
            await acceptFriend({userId:userId});
            setProfile(prev => ({ ...prev, relationshipStatus: RelationshipStatus.FRIEND }));
            setMessage({ type: "success", text: "Đã trở thành bạn bè" });
            if (removeFriendRequest) {
                removeFriendRequest(userId);
            }
        } catch (err) {
            console.error("Accept request error:", err);
            setMessage({ type: "error", text: "Không thể chấp nhận lời mời" });
        } finally {
            setActionLoading(false);
        }
    };

    // Xử lý từ chối lời mời
    const handleRejectRequest = async () => {
        try {
            setActionLoading(true);
            await rejectFriendRequest({userId:userId});
            setProfile(prev => ({ ...prev, relationshipStatus: RelationshipStatus.NONE }));
            setMessage({ type: "success", text: "Đã từ chối lời mời kết bạn" });
            if (removeFriendRequest) {
                removeFriendRequest(userId);
            }
        } catch (err) {
            console.error("Reject request error:", err);
            setMessage({ type: "error", text: "Không thể từ chối lời mời" });
        } finally {
            setActionLoading(false);
        }
    };

    // Xử lý hủy kết bạn
    const handleUnfriend = async () => {
        try {
            setActionLoading(true);
            await unFriend( userId );
            setProfile(prev => ({ ...prev, relationshipStatus: RelationshipStatus.NONE }));
            setShowUnfriendConfirm(false);
            setShowOptions(false);
            setMessage({ type: "success", text: "Đã hủy kết bạn" });
        } catch (err) {
            console.error("Unfriend error:", err);
            setMessage({ type: "error", text: "Không thể hủy kết bạn" });
        } finally {
            setActionLoading(false);
        }
    };

    // Xử lý nhắn tin
    const handleChat = () => {
        if (profile) {
            openChat({
                friendId: profile.id,
                friendName: `${profile.firstname || ""} ${profile.lastname || ""}`.trim(),
                avatarUrl: profile.avatarUrl,
                online: profile.online || false
            });
            navigate("/home");
        }
    };

    // Format giới tính
    const formatGender = (gender) => {
        switch (gender) {
            case 0: return { text: "Nam", icon: <BiMale size={18} /> };
            case 1: return { text: "Nữ", icon: <BiFemale size={18} /> };
            default: return { text: "Khác", icon: null };
        }
    };

    // Render các nút action dựa trên trạng thái
    const renderActionButtons = () => {
        if (!profile) return null;

        const status = profile.relationshipStatus;

        switch (status) {
            case RelationshipStatus.NONE:
                return (
                    <div className="up-action-buttons">
                        <button 
                            className="up-action-btn up-add-friend-btn"
                            onClick={handleAddFriend}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <div className="up-action-spinner"></div>
                            ) : (
                                <>
                                    <BiUserPlus size={20} />
                                    <span>Thêm bạn bè</span>
                                </>
                            )}
                        </button>
                    </div>
                );

            case RelationshipStatus.SENT_REQUEST:
                return (
                    <div className="up-action-buttons">
                        <button 
                            className="up-action-btn up-cancel-btn"
                            onClick={handleCancelRequest}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <div className="up-action-spinner"></div>
                            ) : (
                                <>
                                    <FaUserClock size={18} />
                                    <span>Hủy lời mời</span>
                                </>
                            )}
                        </button>
                    </div>
                );

            case RelationshipStatus.RECEIVED_REQUEST:
                return (
                    <div className="up-action-buttons">
                        <button 
                            className="up-action-btn up-accept-btn"
                            onClick={handleAcceptRequest}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <div className="up-action-spinner"></div>
                            ) : (
                                <>
                                    <BiCheck size={22} />
                                    <span>Chấp nhận</span>
                                </>
                            )}
                        </button>
                        <button 
                            className="up-action-btn up-reject-btn"
                            onClick={handleRejectRequest}
                            disabled={actionLoading}
                        >
                            <FaUserTimes size={16} />
                            <span>Từ chối</span>
                        </button>
                    </div>
                );

            case RelationshipStatus.FRIEND:
                return (
                    <div className="up-action-buttons">
                        <button 
                            className="up-action-btn up-message-btn"
                            onClick={handleChat}
                        >
                            <BiMessageRounded size={20} />
                            <span>Nhắn tin</span>
                        </button>
                        <div className="up-friend-options-wrapper">
                            <button 
                                className="up-action-btn up-friend-btn"
                                onClick={() => setShowOptions(!showOptions)}
                            >
                                <BiUserCheck size={20} />
                                <span>Bạn bè</span>
                                <BiDotsHorizontalRounded size={18} />
                            </button>
                            
                            {/* Dropdown options */}
                            <AnimatePresence>
                                {showOptions && (
                                    <motion.div 
                                        className="up-friend-dropdown"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <button 
                                            className="up-dropdown-item up-unfriend-option"
                                            onClick={() => {
                                                setShowOptions(false);
                                                setShowUnfriendConfirm(true);
                                            }}
                                        >
                                            <BiUserMinus size={18} />
                                            <span>Hủy kết bạn</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const fullName = `${profile?.firstname || ""} ${profile?.lastname || ""}`.trim() || "Người dùng";
    const genderInfo = formatGender(profile?.gender);

    // Loading state
    if (loading) {
        return (
            <div className="user-profile-page">
                <div className="up-header">
                    <button className="up-back-btn" onClick={handleBack}>
                        <BiArrowBack size={24} />
                    </button>
                    <h1>Trang cá nhân</h1>
                    <div className="up-header-spacer"></div>
                </div>
                <div className="up-loading">
                    <div className="up-loading-spinner"></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (!profile) {
        return (
            <div className="user-profile-page">
                <div className="up-header">
                    <button className="up-back-btn" onClick={handleBack}>
                        <BiArrowBack size={24} />
                    </button>
                    <h1>Trang cá nhân</h1>
                    <div className="up-header-spacer"></div>
                </div>
                <div className="up-error">
                    <p>Không thể tải thông tin người dùng</p>
                    <button onClick={fetchProfile}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-profile-page">
            {/* Header */}
            <div className="up-header">
                <button className="up-back-btn" onClick={handleBack}>
                    <BiArrowBack size={24} />
                </button>
                <h1>Trang cá nhân</h1>
                <div className="up-header-spacer"></div>
            </div>

            {/* Toast Message */}
            <AnimatePresence>
                {message.text && (
                    <motion.div 
                        className={`up-toast ${message.type}`}
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
            <div className="up-cover-section">
                <div 
                    className="up-cover-image"
                    style={getCoverUrl(profile.coverUrl) ? {
                        backgroundImage: `url(${getCoverUrl(profile.coverUrl)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : {}}
                >
                    <div className="up-cover-gradient"></div>
                </div>
                
                <div className="up-avatar-container">
                    <div className="up-avatar-wrapper" onClick={() => setShowAvatarPreview(true)}>
                        <img 
                            src={getAvatarUrl(profile.avatarUrl)} 
                            alt={fullName}
                            className="up-avatar-img"
                        />
                        {/* Online status indicator */}
                        <span className={`up-online-status ${profile.online ? 'online' : 'offline'}`}></span>
                    </div>
                </div>

                <div className="up-name-section">
                    <h2 className="up-display-name">{fullName}</h2>
                    
                    {/* Gender */}
                    {genderInfo.text && (
                        <div className="up-gender-badge">
                            {genderInfo.icon}
                            <span>{genderInfo.text}</span>
                        </div>
                    )}

                    {/* Relationship Status Badge */}
                    {profile.relationshipStatus === RelationshipStatus.FRIEND && (
                        <div className="up-relationship-badge up-friend-badge">
                            <BiUserCheck size={16} />
                            <span>Bạn bè</span>
                        </div>
                    )}
                    {profile.relationshipStatus === RelationshipStatus.SENT_REQUEST && (
                        <div className="up-relationship-badge up-pending-badge">
                            <FaUserClock size={14} />
                            <span>Đã gửi lời mời kết bạn</span>
                        </div>
                    )}
                    {profile.relationshipStatus === RelationshipStatus.RECEIVED_REQUEST && (
                        <div className="up-relationship-badge up-received-badge">
                            <BiUserPlus size={16} />
                            <span>Đã gửi lời mời kết bạn cho bạn</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="up-actions-section">
                {renderActionButtons()}
            </div>

            {/* Avatar Preview Modal */}
            <AnimatePresence>
                {showAvatarPreview && (
                    <motion.div 
                        className="up-avatar-preview-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAvatarPreview(false)}
                    >
                        <motion.div 
                            className="up-avatar-preview-container"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                className="up-preview-close-btn"
                                onClick={() => setShowAvatarPreview(false)}
                            >
                                <BiX size={28} />
                            </button>
                            <img 
                                src={getAvatarUrl(profile.avatarUrl)} 
                                alt={fullName}
                                className="up-avatar-preview-img"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Unfriend Confirmation Modal */}
            <AnimatePresence>
                {showUnfriendConfirm && (
                    <motion.div 
                        className="up-confirm-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowUnfriendConfirm(false)}
                    >
                        <motion.div 
                            className="up-confirm-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="up-confirm-icon">
                                <BiUserMinus size={32} />
                            </div>
                            <h3>Hủy kết bạn</h3>
                            <p>Bạn có chắc muốn hủy kết bạn với <strong>{fullName}</strong>?</p>
                            <div className="up-confirm-actions">
                                <button 
                                    className="up-confirm-cancel-btn"
                                    onClick={() => setShowUnfriendConfirm(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="up-confirm-unfriend-btn"
                                    onClick={handleUnfriend}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <div className="up-action-spinner"></div>
                                    ) : (
                                        "Xác nhận"
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

export default UserProfilePage;
