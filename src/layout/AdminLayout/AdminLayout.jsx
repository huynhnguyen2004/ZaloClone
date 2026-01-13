import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdMenu, MdClose } from "react-icons/md";
import AdminSideBar from "../../component/layout/Admin/AdminSideBar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="admin-layout">
      {/* Sidebar - Bên trái */}
      <div className={`admin-sidebar-wrapper ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <AdminSideBar />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="admin-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content - Bên phải */}
      <div className="admin-main">
        {/* Mobile Menu Button - Chỉ hiện trên mobile */}
        {isMobile && (
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        )}

        {/* Outlet - Nội dung các route con */}
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
