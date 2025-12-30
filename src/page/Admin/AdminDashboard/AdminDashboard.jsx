import "./AdminDashboard.css";
import { motion } from "framer-motion";
import {
  MdPeople,
  MdMessage,
  MdTrendingUp,
  MdAccessTime,
  MdPersonAdd,
  MdChat,
} from "react-icons/md";

function AdminDashboard() {
  // Dữ liệu mẫu cho dashboard
  const stats = [
    {
      id: 1,
      label: "Tổng người dùng",
      value: "12,845",
      change: "+12%",
      isPositive: true,
      icon: MdPeople,
      color: "#0068ff",
    },
    {
      id: 2,
      label: "Người dùng mới",
      value: "284",
      change: "+8%",
      isPositive: true,
      icon: MdPersonAdd,
      color: "#22c55e",
    },
    {
      id: 3,
      label: "Tin nhắn hôm nay",
      value: "45,678",
      change: "+23%",
      isPositive: true,
      icon: MdMessage,
      color: "#f59e0b",
    },
    {
      id: 4,
      label: "Đang hoạt động",
      value: "1,234",
      change: "-5%",
      isPositive: false,
      icon: MdAccessTime,
      color: "#8b5cf6",
    },
  ];

  const recentUsers = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@gmail.com", status: "online", joinDate: "30/12/2025" },
    { id: 2, name: "Trần Thị B", email: "tranthib@gmail.com", status: "offline", joinDate: "29/12/2025" },
    { id: 3, name: "Lê Văn C", email: "levanc@gmail.com", status: "online", joinDate: "29/12/2025" },
    { id: 4, name: "Phạm Thị D", email: "phamthid@gmail.com", status: "online", joinDate: "28/12/2025" },
    { id: 5, name: "Hoàng Văn E", email: "hoangvane@gmail.com", status: "offline", joinDate: "28/12/2025" },
  ];

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Tổng quan</h1>
          <p>Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.</p>
        </div>
        <div className="dashboard-date">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
            <div className={`stat-change ${stat.isPositive ? "positive" : "negative"}`}>
              <MdTrendingUp size={16} style={{ transform: stat.isPositive ? "none" : "rotate(180deg)" }} />
              {stat.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Users */}
        <motion.div
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3>Người dùng mới</h3>
            <a href="/admin/users" className="card-link">Xem tất cả</a>
          </div>
          <div className="users-list">
            {recentUsers.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-avatar-small">
                  {user.name.charAt(0)}
                  <span className={`status-dot ${user.status}`}></span>
                </div>
                <div className="user-details">
                  <span className="user-name-small">{user.name}</span>
                  <span className="user-email-small">{user.email}</span>
                </div>
                <span className="user-date">{user.joinDate}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Chart Placeholder */}
        <motion.div
          className="dashboard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <h3>Hoạt động tin nhắn</h3>
            <select className="chart-filter">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>90 ngày qua</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <MdChat size={48} />
            <p>Biểu đồ hoạt động tin nhắn</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboard;
