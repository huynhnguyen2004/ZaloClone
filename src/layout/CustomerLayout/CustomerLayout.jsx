import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import CustomerHeader from "../../component/layout/Customer/CustomerHeader";
import CustomerSideBar from "../../component/layout/Customer/CustomerSideBar";
import ChatArea from "../../page/Chat/ChatArea";
import Modal from "../../component/Modal/Modal";
import { useUser } from "../../context/UserContext";
import "./CustomerLayout.css";

export default function CustomerLayout() {
  const { currentUser, loading, error} = useUser();
  const [activeTab, setActiveTab] = useState("chats");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
          <CustomerSideBar 
            onTabChange={setActiveTab}
          />
        </div>

        {/* Chat Area */}
        <div className="layout-chat-area">
          <ChatArea activeTab={activeTab} />
        </div>

        {/* Content Area for routes */}
        <div className="layout-content">
          <Outlet />
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
    </div>
  );
}
