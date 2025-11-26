import React, { useState, useEffect } from "react";
import { 
    BiMessageRounded, 
    BiUser, 
    BiCog,
    BiGroup,
    BiBookmark
} from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { MdOutlineArticle } from "react-icons/md";
import { useUser } from "../../../context/UserContext";
import "./CustomerSideBar.css";

function CustomerSideBar({ onTabChange }) {
    const [activeTab, setActiveTab] = useState("chats");
    const { currentUser, fetchCurrentUser } = useUser();

    useEffect(() => {
        // Fetch user khi component mount
        fetchCurrentUser();
    }, [fetchCurrentUser]);

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
            notification: 3
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
