import React, { useState } from "react";
import CustomerHeader from "../../component/layout/Customer/CustomerHeader";
import CustomerSideBar from "../../component/layout/Customer/CustomerSideBar";
import ChatArea from "../../page/Chat/ChatArea";
import Modal from "../../component/Modal/Modal";
import { useUser } from "../../hooks/useUser";
import "./CustomerLayout.css";
import ChatWindow from "../../component/ChatWindow/ChatWindow";
import { useChat } from "../../context/chatContext";

export default function CustomerLayout() {
  const { currentUser, loading, error } = useUser();
  const [activeTab, setActiveTab] = useState("chats");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { activeChat, setActiveChat } = useChat();


  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Hiển thị loading khi đang tải thông tin user
  if (loading) {
    return (
      <div className="layout-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error && !currentUser) {
    return (
      <div className="layout-error">
        <div className="error-message">
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      {/* Header */}
      <div className="layout-header">
        <CustomerHeader 
          onProfileClick={handleProfileClick}
        />
      </div>

      {/* Main Content Area */}
      <div className="layout-main">
        {/* Sidebar */}
        <div className="layout-sidebar">
          <CustomerSideBar onTabChange={setActiveTab} />
        </div>

        {/* Chat Area chiếm toàn bộ phần còn lại */}
        <div className="layout-chat-area">
          <ChatArea activeTab={activeTab} />
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        title="Thông tin cá nhân"
        size="medium"
      >
     
      </Modal>
      {activeChat && (
  <div className="floating-chat-window">
    <ChatWindow onCloseChat={()=>setActiveChat(null)} />
  </div>
)}

    </div>
  );
}
