import "./AdminSideBar.css";
import { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdDashboard,
  MdPeople,
  MdMessage,
  MdBarChart,
  MdSecurity,
  MdSettings,
  MdNotifications,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdLogout,
  MdAdminPanelSettings,
} from "react-icons/md";
import { SiZalo } from "react-icons/si";
import { useUser } from "../../../context/UserContext";
import logo from "../../../asset/logo.png";

function AdminSideBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {currentUser, logout } = useUser();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: MdDashboard,
      path: "/admin/dashboard",
    },
    {
      id: "users",
      label: "Quản lý Người dùng",
      icon: MdPeople,
      path: "/admin/users",
    }
  ];

  const systemItems = [
    {
      id: "settings",
      label: "Cài đặt hệ thống",
      icon: MdSettings,
      path: "/admin/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  const textVariants = {
    visible: { opacity: 1, x: 0, display: "block" },
    hidden: { opacity: 0, x: -10, display: "none" },
  };
  

  return (
    <motion.aside
      className="admin-sidebar"
      initial={false}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Logo Section */}
      <div className="admin-sidebar-logo">
        <div className="admin-logo-container">
          <div className="admin-logo-icon">
             <img src={logo} alt="Connect illustration" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="admin-logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1>Admin</h1>
                <span>Dashboard</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Menu */}
      <div className="admin-sidebar-menu">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="admin-menu-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              MENU CHÍNH
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="admin-menu-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
              title={isCollapsed ? item.label : ""}
            >
              <div className="admin-menu-item-content">
                <item.icon className="admin-menu-icon" size={22} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      className="admin-menu-text"
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {item.badge && !isCollapsed && (
                <span className="admin-menu-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* System Menu */}
      <div className="admin-sidebar-system">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="admin-menu-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="admin-menu-nav">
          {systemItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `admin-menu-item ${isActive ? "active" : ""}`
              }
              title={isCollapsed ? item.label : ""}
            >
              <div className="admin-menu-item-content">
                <item.icon className="admin-menu-icon" size={22} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      className="admin-menu-text"
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {item.badge && !isCollapsed && (
                <span className="admin-menu-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Collapse Toggle */}
      <button
        className="admin-sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        {isCollapsed ? (
          <MdKeyboardArrowRight size={20} />
        ) : (
          <>
            <MdKeyboardArrowLeft size={20} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Thu gọn
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </button>

      {/* User Profile Section */}
      <div className="admin-sidebar-user">
        <div className="admin-user-avatar">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" />
          ) : (
            <MdAdminPanelSettings size={24} />
          )}
          <span className="admin-user-status online"></span>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="admin-user-info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="admin-user-name">{currentUser?.firstname|| "Admin User"}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          className="admin-logout-btn"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <MdLogout size={20} />
        </button>
      </div>
    </motion.aside>
  );
}

export default AdminSideBar;