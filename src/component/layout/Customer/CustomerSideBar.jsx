import React, { useContext } from "react";
import { 
    BiMessageRounded, 
    BiUserPlus,
} from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { useChat } from "../../../context/chatContext";
import { getAvatarUrl } from "../../../utils/avatarHelper";
import "./CustomerSideBar.css";
import { UserContext } from "../../../context/userContext";
import { useFriend } from "../../../context/friendContext";

function CustomerSideBar({ onTabChange }) {
    const { activeTab, setActiveTab } = useChat();
    const { currentUser } = useContext(UserContext);
    const { friendRequests } = useFriend();
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
        },
        {
            id: "friendRequests",
            icon: BiUserPlus,
            title: "Lời mời kết bạn",
            notification: friendRequests?.length > 0
                ? (friendRequests.length > 99 ? "99+" : friendRequests.length)
                : null,
        }
        
    ];

   

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
            </div>

          
        </div>
    );
}

export default CustomerSideBar;
