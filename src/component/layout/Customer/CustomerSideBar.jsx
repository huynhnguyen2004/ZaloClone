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
import { useUser } from "../../../context/UserContext";
import "./CustomerSideBar.css";

function CustomerSideBar({ onTabChange }) {
    const [activeTab, setActiveTab] = useState("chats");
    const { currentUser, friendRequests } = useUser();

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (onTabChange) {
            onTabChange(tabName);
        }
    };

    const sidebarItems = [
        {
            id: "chats",
            icon: BiMessageRounded,
            title: "Tin nhắn",
            
        },
        {
            id: "contacts",
            icon: HiOutlineUsers,
            title: "Danh bạ"
        },
        {
            id: "timeline",
            icon: MdOutlineArticle,
            title: "Nhật ký"
        },
        {
            id: "groups",
            icon: BiGroup,
            title: "Nhóm"
        },
        {
            id: "saved",
            icon: BiBookmark,
            title: "Đã lưu"
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
                    {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="Avatar" />
                    ) : (
                        <div className="default-avatar-sidebar">
                            {currentUser?.firstname?.charAt(0) || "U"}
                        </div>
                    )}
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

            {/* Settings */}
            <div className="sidebar-bottom">
                <button 
                    className="nav-item"
                    title="Cài đặt"
                >
                    <BiCog className="nav-icon" />
                </button>
            </div>
        </div>
    );
}

export default CustomerSideBar;
