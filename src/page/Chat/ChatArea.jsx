import React, { useState } from "react";
import { 
    BiSearch, 
    BiMessageRounded,
    BiPlus,
    BiDotsVerticalRounded
} from "react-icons/bi";
import { HiOutlineUsers } from "react-icons/hi";
import { MdOutlineArticle } from "react-icons/md";
import "./ChatArea.css";

function ChatArea({ activeTab }) {
    const [searchTerm, setSearchTerm] = useState("");

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
                                <button className="new-chat-btn" title="Thêm bạn bè">
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
                                <button className="start-chat-btn">
                                    <BiPlus />
                                    Thêm bạn bè
                                </button>
                            </div>
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

export default ChatArea;
