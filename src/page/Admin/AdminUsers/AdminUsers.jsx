import "./AdminUsers.css";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MdSearch,
  MdFilterList,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdBlock,
  MdCheckCircle,
  MdPersonAdd,
  MdRefresh,
} from "react-icons/md";

function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dữ liệu mẫu
  const users = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyenvana@gmail.com", phone: "0901234567", status: "active", role: "user", joinDate: "15/10/2025", lastActive: "Vừa xong" },
    { id: 2, name: "Trần Thị B", email: "tranthib@gmail.com", phone: "0912345678", status: "active", role: "user", joinDate: "20/10/2025", lastActive: "5 phút trước" },
    { id: 3, name: "Lê Văn C", email: "levanc@gmail.com", phone: "0923456789", status: "inactive", role: "user", joinDate: "01/11/2025", lastActive: "2 ngày trước" },
    { id: 4, name: "Phạm Thị D", email: "phamthid@gmail.com", phone: "0934567890", status: "blocked", role: "user", joinDate: "10/11/2025", lastActive: "1 tuần trước" },
    { id: 5, name: "Hoàng Văn E", email: "hoangvane@gmail.com", phone: "0945678901", status: "active", role: "admin", joinDate: "05/09/2025", lastActive: "10 phút trước" },
    { id: 6, name: "Đỗ Thị F", email: "dothif@gmail.com", phone: "0956789012", status: "active", role: "user", joinDate: "12/12/2025", lastActive: "1 giờ trước" },
    { id: 7, name: "Vũ Văn G", email: "vuvang@gmail.com", phone: "0967890123", status: "inactive", role: "user", joinDate: "25/12/2025", lastActive: "3 ngày trước" },
    { id: 8, name: "Bùi Thị H", email: "buithih@gmail.com", phone: "0978901234", status: "active", role: "user", joinDate: "28/12/2025", lastActive: "Vừa xong" },
  ];

  const filteredUsers = users.filter((user) => {
    const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    const matchFilter = filterStatus === "all" || user.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: "Hoạt động", class: "status-active" },
      inactive: { label: "Không hoạt động", class: "status-inactive" },
      blocked: { label: "Đã khóa", class: "status-blocked" },
    };
    return statusConfig[status] || statusConfig.inactive;
  };

  const getRoleBadge = (role) => {
    return role === "admin" ? "Admin" : "Người dùng";
  };

  return (
    <div className="admin-users">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1>Quản lý Người dùng</h1>
          <p>Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <button className="btn-primary">
          <MdPersonAdd size={20} />
          Thêm người dùng
        </button>
      </div>

      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <div className="filter-group">
            <MdFilterList size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="blocked">Đã khóa</option>
            </select>
          </div>

          <button className="btn-icon" title="Làm mới">
            <MdRefresh size={20} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <motion.div
        className="users-table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <table className="users-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Hoạt động cuối</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar-table">
                      {user.name.charAt(0)}
                    </div>
                    <div className="user-info-table">
                      <span className="user-name-table">{user.name}</span>
                      <span className="user-email-table">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{user.phone}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {getRoleBadge(user.role)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadge(user.status).class}`}>
                    {getStatusBadge(user.status).label}
                  </span>
                </td>
                <td>{user.joinDate}</td>
                <td>{user.lastActive}</td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn edit" title="Chỉnh sửa">
                      <MdEdit size={18} />
                    </button>
                    {user.status === "blocked" ? (
                      <button className="action-btn unblock" title="Mở khóa">
                        <MdCheckCircle size={18} />
                      </button>
                    ) : (
                      <button className="action-btn block" title="Khóa">
                        <MdBlock size={18} />
                      </button>
                    )}
                    <button className="action-btn delete" title="Xóa">
                      <MdDelete size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <div className="users-pagination">
        <span className="pagination-info">Hiển thị 1-{filteredUsers.length} của {users.length} người dùng</span>
        <div className="pagination-buttons">
          <button disabled>Trước</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>Sau</button>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
