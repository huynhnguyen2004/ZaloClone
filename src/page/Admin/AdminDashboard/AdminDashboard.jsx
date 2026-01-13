import "./AdminDashboard.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  MdPeople,
  MdTrendingUp,
  MdPersonAdd,
  MdLock,
  MdOnlinePrediction,
  MdCheckCircle,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { getDashboard } from "../../../api/service/dashboard";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("daily"); // daily or monthly

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format số với dấu phẩy
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString("vi-VN");
  };

  // Stats cards từ API data
  const stats = dashboardData
    ? [
        {
          id: 1,
          label: "Tổng người dùng",
          value: formatNumber(dashboardData.totalUsers),
          icon: MdPeople,
          color: "#0068ff",
          bgGradient: "linear-gradient(135deg, #0068ff 0%, #00a8ff 100%)",
        },
        {
          id: 2,
          label: "Đang hoạt động",
          value: formatNumber(dashboardData.activeUsers),
          icon: MdCheckCircle,
          color: "#22c55e",
          bgGradient: "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)",
        },
        {
          id: 3,
          label: "Đang online",
          value: formatNumber(dashboardData.onlineUsers),
          icon: MdOnlinePrediction,
          color: "#8b5cf6",
          bgGradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
        },
        {
          id: 4,
          label: "Người dùng mới",
          value: formatNumber(dashboardData.newUsers),
          icon: MdPersonAdd,
          color: "#f59e0b",
          bgGradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
        },
        {
          id: 5,
          label: "Đã bị khóa",
          value: formatNumber(dashboardData.lockedUsers),
          icon: MdLock,
          color: "#ef4444",
          bgGradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
        },
      ]
    : [];

  // Custom Tooltip cho biểu đồ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            <span className="tooltip-dot"></span>
            Người dùng: <strong>{formatNumber(payload[0].value)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  // Lấy dữ liệu biểu đồ theo loại
  const getChartData = () => {
    if (!dashboardData) return [];
    return chartType === "daily"
      ? dashboardData.dailyGrowth || []
      : dashboardData.monthlyGrowth || [];
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>📊 Tổng quan Dashboard</h1>
          <p>Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.</p>
        </div>
        <div className="dashboard-date">
          📅{" "}
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
            whileHover={{ scale: 1.02 }}
          >
            <div
              className="stat-icon-modern"
              style={{ background: stat.bgGradient }}
            >
              <stat.icon size={28} />
            </div>
            <div className="stat-content">
              <span className="stat-value-modern">{stat.value}</span>
              <span className="stat-label-modern">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        {/* Growth Chart */}
        <motion.div
          className="chart-card chart-card-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="chart-header">
            <div className="chart-title-section">
              <h3>📈 Biểu đồ tăng trưởng người dùng</h3>
              <p className="chart-subtitle">
                Thống kê số lượng người dùng mới theo thời gian
              </p>
            </div>
            <div className="chart-controls">
              <button
                className={`chart-tab ${chartType === "daily" ? "active" : ""}`}
                onClick={() => setChartType("daily")}
              >
                📅 Theo ngày
              </button>
              <button
                className={`chart-tab ${chartType === "monthly" ? "active" : ""}`}
                onClick={() => setChartType("monthly")}
              >
                📆 Theo tháng
              </button>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={getChartData()}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0068ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0068ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0068ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  dot={{ fill: "#0068ff", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart Comparison */}
        <motion.div
          className="chart-card chart-card-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="chart-header">
            <div className="chart-title-section">
              <h3>📊 So sánh tăng trưởng</h3>
              <p className="chart-subtitle">
                Biểu đồ cột hiển thị số lượng người dùng
              </p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={getChartData()}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0068ff" />
                    <stop offset="100%" stopColor="#00a8ff" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="total"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  name="Số người dùng"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-summary">
        <motion.div
          className="summary-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="summary-icon green">
            <MdTrendingUp size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-title">Tỷ lệ hoạt động</span>
            <span className="summary-value">
              {dashboardData && dashboardData.totalUsers > 0
                ? ((dashboardData.activeUsers / dashboardData.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </motion.div>

        <motion.div
          className="summary-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="summary-icon blue">
            <MdOnlinePrediction size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-title">Tỷ lệ online</span>
            <span className="summary-value">
              {dashboardData && dashboardData.totalUsers > 0
                ? ((dashboardData.onlineUsers / dashboardData.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </motion.div>

        <motion.div
          className="summary-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="summary-icon red">
            <MdLock size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-title">Tỷ lệ bị khóa</span>
            <span className="summary-value">
              {dashboardData && dashboardData.totalUsers > 0
                ? ((dashboardData.lockedUsers / dashboardData.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboard;
