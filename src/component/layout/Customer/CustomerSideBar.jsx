import React, { useState } from "react";
import { 
    BiMessageRounded, 
    BiCog,
    BiGroup,
    BiBookmark,
    BiUserPlus,
    BiCheck,
    BiX
} from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { MdOutlineArticle } from "react-icons/md";
import { useUser } from "../../../hooks/useUser";
import { useSocial } from "../../../context/socialContext";
import { useChat } from "../../../context/chatContext";
import { getAvatarUrl } from "../../../utils/avatarHelper";
import "./CustomerSideBar.css";

function CustomerSideBar({ onTabChange }) {
    const [activeTab, setActiveTab] = useState("chats");
    const { currentUser } = useUser();
    const { friendRequests } = useSocial();
    const { unreadCount, clearUnread } = useChat();

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (onTabChange) {
            onTabChange(tabName);
        }
        // Xóa thông báo khi click vào tab tin nhắn
        if (tabName === "chats") {
            clearUnread();
        }
    };

    const sidebarItems = [
        {
            id: "chats",
            icon: BiMessageRounded,
            title: "Tin nhắn",
            notification: unreadCount > 0 ? unreadCount : null,
        },
        {
            id: "contacts",
            icon: HiOutlineUsers,
            title: "Danh bạ"
        }
        
    ];

    const toggleRequestPanel = () => {
        const targetTab = "friendRequests";
        setActiveTab(targetTab);
        if (onTabChange) {
            onTabChange(targetTab);
        }
    };

    return (
        <div className="sidebar-container">
            {/* User Avatar */}
            <div className="sidebar-user">
                <div className="user-avatar-sidebar">
                    <img src={getAvatarUrl(currentUser?.avatarUrl)} alt="Avatar" />
                </div>
            </div>

            {/* Navigation Items */}
            <div className="sidebar-nav">
                {sidebarItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                            onClick={() => handleTabClick(item.id)}
                            title={item.title}
                        >
                            <div className="nav-icon-wrapper">
                                <IconComponent className="nav-icon" />
                                {item.notification && (
                                    <span className="notification-badge">{item.notification}</span>
                                )}
                            </div>
                        </button>
                    );
                })}

                <button
                    className={`nav-item request-trigger ${
                        activeTab === "friendRequests" ? "active" : ""
                    }`}
                    onClick={toggleRequestPanel}
                    title="Lời mời kết bạn"
                >
                    <div className="nav-icon-wrapper">
                        <BiUserPlus className="nav-icon" />
                        {friendRequests?.length > 0 && (
                            <span className="notification-badge">
                                {friendRequests.length > 99 ? "99+" : friendRequests.length}
                            </span>
                        )}
                    </div>
                </button>
            </div>

          
        </div>
    );
}

export default CustomerSideBar;
