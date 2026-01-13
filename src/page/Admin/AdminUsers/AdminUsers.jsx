import "./AdminUsers.css";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdSearch,
  MdFilterList,
  MdEdit,
  MdRefresh,
  MdClose,
  MdVisibility,
  MdPerson,
  MdPhone,
  MdCalendarToday,
  MdLock,
  MdLockOpen,
  MdChevronLeft,
  MdChevronRight,
  MdCircle,
  MdAccessTime,
  MdBadge,
} from "react-icons/md";
import {
  getAllCustomer,
  searchCustomer,
  filterStatus as filterStatusApi,
  lockCustomer,
  unlockCustomer,
  getDetailCustomer,
  editInfor,
} from "../../../api/service/userService";
import { getAvatarUrl } from "../../../utils/avatarHelper";

function AdminUsers() {
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit form states
  const [editForm, setEditForm] = useState({
    firstname: "",
    lastname: "",
    gender: 0,
    birthday: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (searchQuery.trim()) {
        result = await searchCustomer(searchQuery, currentPage, pageSize);
      } else if (filterStatus !== "all") {
        result = await filterStatusApi(filterStatus, currentPage, pageSize);
      } else {
        result = await getAllCustomer(currentPage, pageSize);
      }

      if (result) {
        setUsers(result.content || []);
        setTotalPages(result.totalPages || 0);
        setTotalElements(result.totalElements || 0);
        setCurrentPage(result.page || 0);
        setPageSize(result.size || 10);
        setIsFirst(result.first ?? true);
        setIsLast(result.last ?? true);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Không thể tải danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      setCurrentPage(0);
    }, 500);

    setSearchTimeout(timeout);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(0);
    setSearchQuery("");
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setCurrentPage(0);
    fetchUsers();
  };

  // Handle lock/unlock user
  const handleToggleLock = async (user) => {
    try {
      if (user.status === false) {
        await unlockCustomer(user.id);
        showToast(`Đã mở khóa tài khoản ${user.firstname} ${user.lastname}`);
      } else {
        await lockCustomer(user.id);
        showToast(`Đã khóa tài khoản ${user.firstname} ${user.lastname}`);
      }
      fetchUsers();
    } catch (error) {
      console.error("Error toggling lock:", error);
      showToast("Thao tác thất bại", "error");
    }
  };

  // Handle view detail
  const handleViewDetail = async (user) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const detail = await getDetailCustomer(user.id);
      setSelectedUser(detail || user);
    } catch (error) {
      console.error("Error fetching detail:", error);
      setSelectedUser(user);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      gender: user.gender || 0,
      birthday: user.birthday ? formatDateForInput(user.birthday) : "",
    });
    setShowEditModal(true);
  };

  // Format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editForm.firstname.trim() || !editForm.lastname.trim()) {
      showToast("Vui lòng nhập đầy đủ họ và tên", "error");
      return;
    }

    setEditLoading(true);
    try {
      const data = {
        firstname: editForm.firstname,
        lastname: editForm.lastname,
        gender: parseInt(editForm.gender),
        birthday: editForm.birthday ? new Date(editForm.birthday) : null,
      };

      await editInfor(selectedUser.id, data);
      showToast("Cập nhật thông tin thành công");
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("Cập nhật thất bại", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Get status badge (status: true = active, false = locked)
  const getStatusBadge = (status) => {
    if (status === true) {
      return { label: "Hoạt động", class: "status-active" };
    } else {
      return { label: "Đã khóa", class: "status-blocked" };
    }
  };

  // Get online status text
  const getOnlineStatus = (online) => {
    return online ? "Trực tuyến" : "Ngoại tuyến";
  };

  // Get gender text
  const getGenderText = (gender) => {
    const genderMap = { 0: "Nam", 1: "Nữ", 2: "Khác" };
    return genderMap[gender] || "Chưa cập nhật";
  };

  // Pagination
  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(0, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={currentPage === i ? "active" : ""}
          onClick={() => handlePageChange(i)}
        >
          {i + 1}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="admin-users">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            className={`toast-notification ${toast.type}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="users-header">
        <div>
          <h1>Quản lý Người dùng</h1>
          <p>Quản lý tất cả người dùng trong hệ thống ({totalElements} người dùng)</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, số điện thoại..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <MdClose size={18} />
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <div className="filter-group">
            <MdFilterList size={20} />
            <select value={filterStatus} onChange={handleFilterChange}>
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Hoạt động</option>
              <option value="false">Đã khóa</option>
            </select>
          </div>

          <button className="btn-icon" title="Làm mới" onClick={handleRefresh}>
            <MdRefresh size={20} className={loading ? "spinning" : ""} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <motion.div
        className="users-table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Số điện thoại</th>
                <th>Trực tuyến</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-table">
                        {user.avatarUrl ? (
                          <img src={getAvatarUrl(user.avatarUrl)} alt={user.firstname} />
                        ) : (
                          <span>{(user.firstname || "U").charAt(0)}</span>
                        )}
                        <span
                          className={`online-indicator ${
                            user.online ? "online" : "offline"
                          }`}
                        />
                      </div>
                      <div className="user-info-table">
                        <span className="user-name-table">
                          {user.firstname} {user.lastname}
                        </span>
                        <span className="user-phone-table">{user.phone || "Chưa có SĐT"}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.phone || "Chưa cập nhật"}</td>
                  <td>
                    <span className={`online-badge ${user.online ? "online" : "offline"}`}>
                      <MdCircle size={8} />
                      {getOnlineStatus(user.online)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadge(user.status).class}`}
                    >
                      {getStatusBadge(user.status).label}
                    </span>
                  </td>
                  <td>{formatDateDisplay(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        title="Xem chi tiết"
                        onClick={() => handleViewDetail(user)}
                      >
                        <MdVisibility size={18} />
                      </button>
                      <button
                        className="action-btn edit"
                        title="Chỉnh sửa"
                        onClick={() => handleEditUser(user)}
                      >
                        <MdEdit size={18} />
                      </button>
                      {user.status === false ? (
                        <button
                          className="action-btn unblock"
                          title="Mở khóa"
                          onClick={() => handleToggleLock(user)}
                        >
                          <MdLockOpen size={18} />
                        </button>
                      ) : (
                        <button
                          className="action-btn block"
                          title="Khóa"
                          onClick={() => handleToggleLock(user)}
                        >
                          <MdLock size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && users.length === 0 && (
          <div className="empty-state">
            <MdPerson size={48} />
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <div className="users-pagination">
        <span className="pagination-info">
          {totalElements > 0 ? (
            <>
              Hiển thị {currentPage * pageSize + 1}-
              {Math.min((currentPage + 1) * pageSize, totalElements)} của{" "}
              {totalElements} người dùng
            </>
          ) : (
            "Không có dữ liệu"
          )}
        </span>
        <div className="pagination-buttons">
          <button
            disabled={isFirst}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <MdChevronLeft size={20} />
          </button>
          {totalPages > 0 ? (
            renderPaginationButtons()
          ) : (
            <button className="active">1</button>
          )}
          <button
            disabled={isLast}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              className="modal-content detail-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Chi tiết người dùng</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <MdClose size={24} />
                </button>
              </div>

              {detailLoading ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                selectedUser && (
                  <div className="modal-body">
                    <div className="detail-avatar-section">
                      <div className="detail-avatar">
                        {selectedUser.avatarUrl ? (
                          <img
                            src={getAvatarUrl(selectedUser.avatarUrl)}
                            alt={selectedUser.firstname}
                          />
                        ) : (
                          <span>{(selectedUser.firstname || "U").charAt(0)}</span>
                        )}
                        <span
                          className={`detail-online-indicator ${
                            selectedUser.online ? "online" : "offline"
                          }`}
                        />
                      </div>
                      <h3>
                        {selectedUser.firstname} {selectedUser.lastname}
                      </h3>
                      <div className="detail-status-row">
                        <span
                          className={`status-badge ${
                            getStatusBadge(selectedUser.status).class
                          }`}
                        >
                          {getStatusBadge(selectedUser.status).label}
                        </span>
                        <span className={`online-badge ${selectedUser.online ? "online" : "offline"}`}>
                          <MdCircle size={8} />
                          {getOnlineStatus(selectedUser.online)}
                        </span>
                      </div>
                    </div>

                    <div className="detail-info-grid">
                      <div className="detail-info-item">
                        <MdPhone size={20} />
                        <div>
                          <label>Số điện thoại</label>
                          <span>{selectedUser.phone || "Chưa cập nhật"}</span>
                        </div>
                      </div>

                      <div className="detail-info-item">
                        <MdPerson size={20} />
                        <div>
                          <label>Giới tính</label>
                          <span>{getGenderText(selectedUser.gender)}</span>
                        </div>
                      </div>

                      <div className="detail-info-item">
                        <MdCalendarToday size={20} />
                        <div>
                          <label>Ngày sinh</label>
                          <span>{formatDateDisplay(selectedUser.birthday)}</span>
                        </div>
                      </div>

                      <div className="detail-info-item">
                        <MdAccessTime size={20} />
                        <div>
                          <label>Ngày tham gia</label>
                          <span>{formatDateDisplay(selectedUser.createdAt)}</span>
                        </div>
                      </div>

                      <div className="detail-info-item">
                        <MdBadge size={20} />
                        <div>
                          <label>Vai trò</label>
                          <span>{selectedUser.role || "Người dùng"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !editLoading && setShowEditModal(false)}
          >
            <motion.div
              className="modal-content edit-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Chỉnh sửa thông tin</h2>
                <button
                  className="modal-close"
                  onClick={() => !editLoading && setShowEditModal(false)}
                  disabled={editLoading}
                >
                  <MdClose size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Họ</label>
                  <input
                    type="text"
                    value={editForm.firstname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstname: e.target.value })
                    }
                    placeholder="Nhập họ"
                    disabled={editLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Tên</label>
                  <input
                    type="text"
                    value={editForm.lastname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastname: e.target.value })
                    }
                    placeholder="Nhập tên"
                    disabled={editLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    disabled={editLoading}
                  >
                    <option value={0}>Nam</option>
                    <option value={1}>Nữ</option>
                    <option value={2}>Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    value={editForm.birthday}
                    onChange={(e) =>
                      setEditForm({ ...editForm, birthday: e.target.value })
                    }
                    disabled={editLoading}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                >
                  Hủy
                </button>
                <button
                  className="btn-save"
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminUsers;
