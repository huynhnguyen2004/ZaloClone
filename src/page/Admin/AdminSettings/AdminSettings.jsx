import "./AdminSettings.css";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdSettings,
  MdSecurity,
  MdNotifications,
  MdStorage,
  MdColorLens,
  MdSave,
} from "react-icons/md";

function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "Zalo Clone",
    siteDescription: "Ứng dụng chat realtime",
    allowRegistration: true,
    emailVerification: true,
    maxFileSize: 10,
    messageRetention: 365,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    alert("Đã lưu cài đặt!");
  };

  return (
    <div className="admin-settings">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1>Cài đặt hệ thống</h1>
          <p>Quản lý các cấu hình và tùy chỉnh hệ thống</p>
        </div>
        <button className="btn-save" onClick={handleSave}>
          <MdSave size={20} />
          Lưu thay đổi
        </button>
      </div>

      {/* Settings Sections */}
      <div className="settings-grid">
        {/* General Settings */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-icon">
            <MdSettings size={24} />
          </div>
          <h3>Cài đặt chung</h3>

          <div className="settings-form">
            <div className="form-group">
              <label>Tên trang web</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleChange("siteDescription", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-icon security">
            <MdSecurity size={24} />
          </div>
          <h3>Bảo mật</h3>

          <div className="settings-form">
            <div className="form-group toggle-group">
              <div className="toggle-info">
                <label>Cho phép đăng ký</label>
                <span>Người dùng mới có thể tạo tài khoản</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowRegistration}
                  onChange={(e) => handleChange("allowRegistration", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="form-group toggle-group">
              <div className="toggle-info">
                <label>Xác minh email</label>
                <span>Yêu cầu xác minh email khi đăng ký</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailVerification}
                  onChange={(e) => handleChange("emailVerification", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Storage Settings */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-icon storage">
            <MdStorage size={24} />
          </div>
          <h3>Lưu trữ</h3>

          <div className="settings-form">
            <div className="form-group">
              <label>Kích thước file tối đa (MB)</label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleChange("maxFileSize", parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div className="form-group">
              <label>Thời gian lưu tin nhắn (ngày)</label>
              <input
                type="number"
                value={settings.messageRetention}
                onChange={(e) => handleChange("messageRetention", parseInt(e.target.value))}
                min={30}
              />
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-icon notification">
            <MdNotifications size={24} />
          </div>
          <h3>Thông báo</h3>

          <div className="settings-form">
            <div className="form-group toggle-group">
              <div className="toggle-info">
                <label>Bật thông báo</label>
                <span>Gửi thông báo đến người dùng</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleChange("enableNotifications", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="form-group toggle-group">
              <div className="toggle-info">
                <label>Chế độ bảo trì</label>
                <span>Tạm ngưng hoạt động hệ thống</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminSettings;
