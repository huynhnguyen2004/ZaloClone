import React, { useState } from "react";
import { 
    BiSearch, 
    BiMessageRounded,
    BiPlus,
    BiDotsVerticalRounded,
    BiUserPlus,
    BiCheck,
    BiX
} from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { MdOutlineArticle } from "react-icons/md";
import { useUser } from "../../context/UserContext";
import { acceptFriendRequest, declineFriendRequest, sendFriendRequest } from "../../api/service/friend";
import { sendSocketData } from "../../api/websocket";
import "./ChatArea.css";

function ChatArea({ activeTab }) {
    const [searchTerm, setSearchTerm] = useState("");
    const { friendRequests, removeFriendRequest, currentUser } = useUser();

    const formatRequestTime = (value) => {
        if (!value) return "Vừa gửi";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Vừa gửi";
        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
        });
    };

    const handleAccept = async (req) => {
        try {
            const res = await acceptFriendRequest(req.id);

            // Use server response payload if available so server-controlled data is sent
            const payload = (res && res.data) ? res.data : { id: req.id };

            try {
                sendSocketData('/app/friend/accept', payload);
            } catch (sockErr) {
                console.warn('WebSocket publish failed', sockErr);
            }

            removeFriendRequest(req.id);
        } catch (err) {
            console.error("Accept friend error", err);
        }
    };



    const handleDecline = async (req) => {
        try {
            await declineFriendRequest(req.id);
            removeFriendRequest(req.id);
        } catch (err) {
            console.error("Decline friend error", err);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "chats":
                return (
                    <div className="chat-area-container">
                        {/* Chat List Header */}
                        <div className="chat-list-header">
                            <div className="header-title">
                                <h2>Tin nhắn</h2>
                                <button className="new-chat-btn" title="Tạo cuộc trò chuyện mới">
                                    <BiPlus />
                                </button>
                            </div>
                            
                            {/* Search */}
                            <div className="chat-search">
                                <BiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tin nhắn"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            {/* Filter tabs */}
                            <div className="chat-filters">
                                <button className="filter-tab active">Tất cả</button>
                                <button className="filter-tab">Chưa đọc</button>
                                <button className="filter-tab">Đã ghim</button>
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="chat-list-content">
                            <div className="empty-chat-state">
                                <BiMessageRounded className="empty-icon" />
                                <h3>Chưa có cuộc trò chuyện</h3>
                                <p>Bắt đầu trò chuyện mới với bạn bè</p>
                                <button className="start-chat-btn">
                                    <BiPlus />
                                    Bắt đầu trò chuyện
                                </button>
                            </div>
                        </div>
                    </div>
                );

           
            case "contacts":
                return (
                    <div className="chat-area-container">
                        <div className="chat-list-header">
                            <div className="header-title">
                                <h2>Danh bạ</h2>
                                <button className="new-chat-btn" title="Thêm bạn bè" >
                                    <BiPlus />
                                </button>
                            </div>

                            <div className="chat-search">
                                <BiSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm liên hệ"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>

                        <div className="chat-list-content">
                           
                            <div className="empty-chat-state">
                                <HiOutlineUsers className="empty-icon" />
                                <h3>Danh bạ trống</h3>
                                <p>Thêm bạn bè để bắt đầu trò chuyện</p>
                                <button className="start-chat-btn" >
                                    <BiPlus />
                                    Thêm bạn bè
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "friendRequests":
                return (
                    <div className="chat-area-container">
                        <div className="chat-list-header">
                            <div className="header-title">
                                <h2>Lời mời kết bạn</h2>
                            </div>
                        </div>

                        <div className="chat-list-content">
                            <FriendRequestSection
                                friendRequests={friendRequests}
                                handleAccept={handleAccept}
                                handleDecline={handleDecline}
                                formatRequestTime={formatRequestTime}
                            />
                        </div>
                    </div>
                );

            case "timeline":
                return (
                    <div className="chat-area-container">
                        <div className="chat-list-header">
                            <div className="header-title">
                                <h2>Nhật ký</h2>
                                <button className="new-chat-btn" title="Tạo bài viết">
                                    <BiPlus />
                                </button>
                            </div>
                        </div>

                        <div className="chat-list-content">
                            <div className="empty-chat-state">
                                <MdOutlineArticle className="empty-icon" />
                                <h3>Chưa có nhật ký</h3>
                                <p>Chia sẻ khoảnh khắc của bạn</p>
                                <button className="start-chat-btn">
                                    <BiPlus />
                                    Tạo bài viết
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="chat-area-container">
                        <div className="chat-list-header">
                            <div className="header-title">
                                <h2>Zalo</h2>
                            </div>
                        </div>

                        <div className="chat-list-content">
                            <div className="empty-chat-state">
                                <BiMessageRounded className="empty-icon" />
                                <h3>Chào mừng đến với Zalo</h3>
                                <p>Chọn một mục từ thanh bên để bắt đầu</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="chat-area">
            {renderContent()}
        </div>
    );
}

const FriendRequestSection = ({
    friendRequests,
    handleAccept,
    handleDecline,
    formatRequestTime,
}) => (
    <div className="friend-requests-panel">
        <div className="fr-panel-header">
            <div>
                <p className="fr-panel-label">Lời mời kết bạn</p>
                <h3>Kết nối ngay với bạn mới</h3>
            </div>
            <span className="fr-panel-count">{friendRequests?.length || 0}</span>
        </div>

        {friendRequests && friendRequests.length > 0 ? (
            <div className="friend-requests-grid">
                {friendRequests.map((req) => {
                    const displayName = req.senderName || req.phone || "Người dùng";
                    const displayId = req.senderId || req.phone || req.id;
                    return (
                        <div key={req.id || displayId} className="friend-request-card">
                            <div className="fr-card-meta">
                                <div className="fr-card-avatar">
                                    {req.senderAvatarUrl ? (
                                        <img src={req.senderAvatarUrl} alt={displayName} />
                                    ) : (
                                        <span>{displayName.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="fr-card-info">
                                    <div className="fr-card-name">{displayName}</div>
                                    <div className="fr-card-note">
                                        <BiUserPlus />
                                        <span>{req.phone || "Lời mời mới"}</span>
                                    </div>
                                </div>
                                <span className="fr-card-time">
                                    {formatRequestTime(req.createdAt)}
                                </span>
                            </div>
                            {req.note && <p className="fr-card-message">{req.note}</p>}
                            <div className="fr-card-actions">
                                <button
                                    className="fr-btn fr-btn-ghost"
                                    onClick={() => handleDecline(req)}
                                >
                                    <BiX />
                                    Từ chối
                                </button>
                                <button
                                    className="fr-btn fr-btn-primary"
                                    onClick={() => handleAccept(req)}
                                >
                                    <BiCheck />
                                    Chấp nhận
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="empty-requests modern">
                <BiUserPlus />
                <div>
                    <h4>Chưa có lời mời mới</h4>
                    <p>Khi có người gửi lời mời, bạn sẽ thấy ở đây ngay.</p>
                </div>
            </div>
        )}
    </div>
);

export default ChatArea;
