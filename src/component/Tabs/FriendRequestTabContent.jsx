import React from "react";
import { BiUserPlus, BiCheck, BiX } from "react-icons/bi";

function FriendRequestsTabContent({
  friendRequests,
  handleAccept,
  handleDecline,
  formatRequestTime,
  onAvatarClick,
  handleScroll
}) {
  return (
    <div className="friend-requests-panel">
      <div className="fr-panel-header">
        <div>
          <p className="fr-panel-label">Lời mời kết bạn</p>
          <h3>Kết nối ngay với bạn mới</h3>
        </div>
        <span className="fr-panel-count">{friendRequests?.length || 0}</span>
      </div>

      {friendRequests?.length > 0 ? (
        <div className="friend-requests-grid" onScroll={handleScroll}>
          {friendRequests.map((req) => {
            const displayName = req.senderName || req.phone || "Người dùng";
            const displayId = req.senderId || req.phone || req.id;
            const userId = req.senderId || req.id;

            return (
              <div key={req.id || displayId} className="friend-request-card">
                <div className="fr-card-meta">
                  <div
                    className="fr-card-avatar clickable"
                    onClick={() => userId && onAvatarClick && onAvatarClick(userId)}
                    style={{ cursor: userId ? "pointer" : "default" }}
                    title="Xem trang cá nhân"
                  >
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

                  <span className="fr-card-time">{formatRequestTime(req.createdAt)}</span>
                </div>

                <div className="fr-card-actions">
                  <button className="fr-btn fr-btn-ghost" onClick={() => handleDecline(req)}>
                    <BiX />
                    Từ chối
                  </button>

                  <button className="fr-btn fr-btn-primary" onClick={() => handleAccept(req)}>
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
}

export default FriendRequestsTabContent;
