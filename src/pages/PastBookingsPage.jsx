import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";
import {
  Bell,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  Scissors
} from "lucide-react";
import "../styles/AdminDashboard.css";
import salonLogo from "../assets/images/salon_logo_1783178148829.jpg";

export const PastBookingsPage = () => {
  const navigate = useNavigate();
  const {
    pastBookings,
    admin,
    isAuthenticated,
    isLoading,
    fetchPastBookings,
    logout
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Protect route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch past bookings on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchPastBookings();
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPastBookings();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Count past metrics
  const completedCount = pastBookings.filter((p) => p.status === "Completed").length;
  const cancelledCount = pastBookings.filter((p) => p.status === "Cancelled").length;

  return (
    <div className="admin-dashboard-layout" id="past-bookings-page">
      {/* Sidebar Rail - matching Figma dashboard */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo-circle overflow-hidden bg-white flex items-center justify-center">
            <img 
              src={salonLogo} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-full" 
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="admin-sidebar-greeting">Hii..!</p>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/dashboard")}
          >
            <Sparkles size={18} />
            Dashboard
          </button>
          
          <button
            className="admin-nav-item active"
            onClick={() => navigate("/admin/past-bookings")}
          >
            <Clock size={18} />
            Past Bookings
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={handleLogout} id="btn-past-bookings-logout">
            <LogOut size={18} className="text-red-500" />
            LogOut
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="admin-main-container">
        
        {/* Header */}
        <header className="admin-header">
          <h1 className="admin-welcome-text">
            Past <span>Bookings</span>
          </h1>

          <div className="admin-profile-section">
            <button className="admin-bell-btn">
              <Bell size={22} />
            </button>
            <span className="admin-profile-name">{admin?.name || "Manager"}</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content-body">
          
          {/* Historical Statistics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon-wrapper text-green-500">
                  <CheckCircle size={20} />
                </div>
                <span className="admin-stat-label">Total Completed</span>
              </div>
              <span className="admin-stat-number text-green-500">{completedCount}</span>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon-wrapper text-red-500">
                  <XCircle size={20} />
                </div>
                <span className="admin-stat-label">Total Cancelled</span>
              </div>
              <span className="admin-stat-number text-red-500">{cancelledCount}</span>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon-wrapper text-[#e5b842]">
                  <Calendar size={20} />
                </div>
                <span className="admin-stat-label">Archived Bookings</span>
              </div>
              <span className="admin-stat-number text-[#e5b842]">{pastBookings.length}</span>
            </div>
          </div>

          {/* Action header with Force Refresh */}
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="text-xs text-gray-500">Showing all completed and cancelled customer records archived in database</p>
            </div>
            <button
              className="admin-primary-action-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Refreshing..." : "Force Sync"}
            </button>
          </div>

          {/* Past Bookings Archives Table */}
          <section className="admin-table-container">
            <h2 className="admin-table-title mb-5 text-[#e5b842] uppercase tracking-wide">Historical Archives</h2>

            {pastBookings.length === 0 ? (
              <div className="empty-queue-message">
                💤 The archives are empty. No past completed/cancelled bookings found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-queue-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Customer Name</th>
                      <th>Mobile Number</th>
                      <th>Service Offered</th>
                      <th>Status</th>
                      <th>Created Time</th>
                      <th>Processed Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBookings.map((item) => {
                      const dateCreated = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date(item.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric'});
                      const dateProcessed = new Date(item.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date(item.processedAt).toLocaleDateString([], {month: 'short', day: 'numeric'});
                      return (
                        <tr key={item._id}>
                          {/* Token Number */}
                          <td className="font-bold text-gray-400">#{item.tokenNumber}</td>

                          {/* Customer Name */}
                          <td className="font-semibold text-white">{item.name}</td>

                          {/* Mobile */}
                          <td className="font-mono text-xs text-gray-400">{item.phone}</td>

                          {/* Service */}
                          <td>
                            <div className="admin-service-cell">
                              <Scissors size={14} className="text-gray-400" />
                              <span>{item.service}</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td>
                            <span className={`admin-badge ${item.status.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </td>

                          {/* Timestamps */}
                          <td className="text-xs text-gray-400">{dateCreated}</td>
                          <td className="text-xs text-gray-400">{dateProcessed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
};

export default PastBookingsPage;
