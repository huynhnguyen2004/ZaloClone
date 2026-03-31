import React from "react";
import { BiBell } from "react-icons/bi";

import { useNoti } from "../../context/notificationContext";
import { getAvatarUrl } from "../../utils/avatarHelper";
import "./NotificationsTab.css";

const COLORS = [
  "#E3F2FD", // light blue
  "#F3E5F5", // light purple
  "#FCE4EC", // light pink
  "#F1F8E9", // light green
  "#FFF3E0", // light orange
  "#E0F2F1", // light teal
];

const getRandomColor = (seed) => {
  return COLORS[seed % COLORS.length];
};

const formatRelativeTime = (value) => {
  if (!value) return "Vừa xong";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

const getDisplayName = (item) => {
  const fullName =
    `${item?.senderFirstName || ""} ${item?.senderLastName || ""}`.trim();
  return fullName || item?.senderName;
};

const getNotificationMessage = (noti) => {
  switch (noti?.type) {
    case "SEND_REQUEST":
      return "Đã gửi cho bạn một lời mời kết bạn";
    case "ACCEPT_REQUEST":
      return "Đã chấp nhận lời mời kết bạn của bạn";
    default:
      return "Có thông báo mới cho bạn";
  }
};
const NotificationsTab = ({handleProfile}) => {
  const { notifications = [], handleScroll, setNotifications } = useNoti();
  return (
    <div className="noti-modern-panel">
      {/* Header */}
      <div className="noti-header-simple">
        <h3 className="noti-title">Thông báo</h3>
      </div>

      {/* Notification List */}
      {notifications.length > 0 ? (
        <div className="noti-list-container" onScroll={handleScroll}>
          {notifications.map((item) => {
            const isUnread = !item?.isRead;
            const displayName = getDisplayName(item);
            const message = getNotificationMessage(item);
            const colorIndex = displayName.charCodeAt(0) || 0;
            const bgColor = getRandomColor(colorIndex);

            return (
              <div key={item?.id} onClick={()=>handleProfile(item)}>
                <div
                  className={`noti-item ${isUnread ? "unread" : ""}`}
                  role="button"
                  tabIndex={0}
                >
                  {/* Avatar */}
                  <div className="noti-avatar-wrapper">
                    {item?.senderAvatarUrl ? (
                      <img
                        src={getAvatarUrl(item.senderAvatarUrl)}
                        alt={displayName}
                        className="noti-avatar-img"
                      />
                    ) : (
                      <div
                        className="noti-avatar-initials"
                        style={{ backgroundColor: bgColor }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="noti-content">
                    <div className="noti-header-row">
                      <p className="noti-sender-name">{displayName}</p>
                      <span className="noti-timestamp">
                        {formatRelativeTime(item?.createdAt)}
                      </span>
                    </div>
                    <p className="noti-text">{message}</p>
                  </div>
                </div>

                {/* Divider */}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="noti-empty-state">
          <BiBell className="noti-empty-icon" />
          <p className="noti-empty-text">Chưa có thông báo nào</p>
        </div>
      )}
    </div>
  );
};
export default NotificationsTab;


