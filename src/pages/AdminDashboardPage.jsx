import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { LoadingSpinner } from "../components/LoadingSpinner.jsx";
import {
  Bell,
  LogOut,
  Clock,
  CheckCircle,
  Users,
  Scissors,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Settings,
  Lock
} from "lucide-react";
import "../styles/AdminDashboard.css";
import salonLogo from "../assets/images/salon_logo_1783178148829.jpg";

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const {
    queue,
    stats,
    admin,
    isAuthenticated,
    isLoading,
    completeHaircut,
    cancelToken,
    callNext,
    resetQueue,
    logout,
    updateCredentials
  } = useApp();

  const [isActionPending, setIsActionPending] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Local setting states for profile/security setup
  const [adminName, setAdminName] = useState(admin?.name || "");
  const [adminEmail, setAdminEmail] = useState(admin?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  
  useEffect(() => {
    if (admin) {
      setAdminName(admin.name);
      setAdminEmail(admin.email);
    }
  }, [admin]);

  // Protected route check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  
  const servingCustomers = queue.filter((q) => q.status === "Serving");
  const seat1Customer = servingCustomers[0] || null;
  const seat2Customer = servingCustomers[1] || null;

  // --- ACTIONS ---

  const handleCompleteSeat = async (seatNum) => {
    if (seatNum === 1) {
      if (!seat1Customer) return;
      setIsActionPending(true);
      await completeHaircut(seat1Customer._id);
      setIsActionPending(false);
    } else {
      if (!seat2Customer) return;
      const ids = [seat1Customer?._id, seat2Customer._id].filter(Boolean).join(",");
      setIsActionPending(true);
      await completeHaircut(ids);
      setIsActionPending(false);
    }
  };

  const handleCallNext = async () => {
    setIsActionPending(true);
    await callNext();
    setIsActionPending(false);
  };

  const handleCancelItem = async (id, tokenNum) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel Token #${tokenNum}?`);
    if (!confirmCancel) return;

    setIsActionPending(true);
    await cancelToken(id);
    setIsActionPending(false);
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      "⚠️ WARNING: This will archive all current tokens as cancelled, clear the active queue, and reset token numbers to 1 for a new day. Are you sure you want to perform this rollover?"
    );
    if (!confirmReset) return;

    setIsActionPending(true);
    await resetQueue();
    setIsActionPending(false);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      toast.error("Name and Email are required.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("New Password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New Password and Confirm Password do not match.");
        return;
      }
    }

    setIsSavingSettings(true);
    const success = await updateCredentials(adminEmail.trim(), adminName.trim(), newPassword ? newPassword : undefined);
    setIsSavingSettings(false);

    if (success) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-dashboard-layout" id="admin-dashboard-page">
      {}
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
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <Sparkles size={18} />
            Dashboard
          </button>
          
          <button
            className="admin-nav-item"
            onClick={() => navigate("/admin/past-bookings")}
          >
            <Clock size={18} />
            Past Bookings
          </button>

          <button
            className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} />
            Security Settings
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={handleLogout} id="btn-admin-logout">
            <LogOut size={18} className="text-red-500" />
            LogOut
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="admin-main-container">
        
        {/* Top Header */}
        <header className="admin-header">
          <h1 className="admin-welcome-text">
            welcome back, <span>Admin</span>
          </h1>

          <div className="admin-profile-section">
            {/* Notification Bell */}
            <button className="admin-bell-btn">
              <Bell size={22} />
              {queue.filter(q => q.status === "Waiting").length > 0 && (
                <span className="admin-bell-badge animate-ping"></span>
              )}
            </button>
            <span className="admin-profile-name">{admin?.name || "Manager"}</span>
          </div>
        </header>

        {/* Content Body Grid */}
        <main className="admin-content-body">
          {activeTab === "dashboard" ? (
            <>
          
          {}
          <div className="admin-stats-grid">
            {/* Total Appointments Card */}
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon-wrapper">
                  <Calendar size={20} />
                </div>
                <span className="admin-stat-label">Total Appointment</span>
              </div>
              <span className="admin-stat-number" id="stat-total-appointments">
                {stats.totalAppointments}
              </span>
            </div>

            {/* Remaining Customers Card */}
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon-wrapper">
                  <Clock size={20} />
                </div>
                <span className="admin-stat-label">Remain</span>
              </div>
              <span className="admin-stat-number" id="stat-remaining-customers">
                {stats.remainingCustomers}
              </span>
            </div>

            {/* Completed Customers Card */}
            <div className="admin-stat-card">
              <div className="admin-stat-header">
                <div className="admin-stat-icon-wrapper">
                  <CheckCircle size={20} />
                </div>
                <span className="admin-stat-label">Completed</span>
              </div>
              <span className="admin-stat-number" id="stat-completed-customers">
                {stats.completedCustomers}
              </span>
            </div>
          </div>

          {/* Additional Sub-statistics Row */}
          <div className="admin-substats-row">
            <div className="admin-substat-box">
              <span className="admin-substat-title">Barber Chairs Active (Serving)</span>
              <span className="admin-substat-value blue">{stats.servingCustomers} / 2 Seats</span>
            </div>
            <div className="admin-substat-box">
              <span className="admin-substat-title">Waiting Queue Size</span>
              <span className="admin-substat-value gold">{stats.waitingCustomers} In Line</span>
            </div>
          </div>

          {/* Quick Action Seating Panel - matching Figma */}
          <section className="admin-quick-action-box">
            <h2 className="admin-quick-action-title">Quick action</h2>
            <div className="admin-quick-action-buttons">
              {/* Reduce Seat 1 */}
              <button
                className="admin-quick-pill-btn"
                onClick={() => handleCompleteSeat(1)}
                disabled={!seat1Customer || isActionPending}
                id="btn-reduce-seat-1"
              >
                {seat1Customer ? `Reduce Seat 1 (#${seat1Customer.tokenNumber})` : "Reduce seat 1"}
              </button>

              {/* Reduce Seat 2 */}
              <button
                className="admin-quick-pill-btn"
                onClick={() => handleCompleteSeat(2)}
                disabled={!seat2Customer || isActionPending}
                id="btn-reduce-seat-2"
              >
                {seat2Customer ? `Reduce Seat 2 (#${seat2Customer.tokenNumber})` : "Reduce seat 2"}
              </button>
            </div>
            {seat1Customer || seat2Customer ? (
              <p className="text-[11px] text-[#b3b3b3] text-center italic max-w-lg mx-auto leading-relaxed">
                
              </p>
            ) : (
              <p className="text-[11px] text-gray-600 text-center italic">
                No customers are currently in seating. Generate tokens to fill seats.
              </p>
            )}
          </section>

          {}
          <section className="admin-action-bar">
            <div>
              <h3 className="admin-action-bar-title">Queue Controls</h3>
            </div>
            <div className="admin-action-buttons">
              {/* Call Next Customer */}
              <button
                className="admin-primary-action-btn"
                onClick={handleCallNext}
                disabled={stats.waitingCustomers === 0 || isActionPending}
                id="btn-call-next"
              >
                <ArrowRight size={16} />
                Call Next Customer
              </button>

              {/* Manual daily reset */}
              <button
                className="admin-primary-action-btn bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReset}
                disabled={isActionPending}
                id="btn-manual-reset"
              >
                <RefreshCw size={16} />
                Manual Rollover Reset
              </button>
            </div>
          </section>

          {/* Active Queue Table */}
          <section className="admin-table-container">
            <div className="admin-table-header-row">
              <h2 className="admin-table-title">Recent Bookings (Active Queue)</h2>
              <button className="admin-table-view-all" onClick={() => navigate("/admin/past-bookings")}>
                View Past Bookings
              </button>
            </div>

            {queue.length === 0 ? (
              <div className="empty-queue-message">
                💤 The queue is empty. No appointments booked today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-queue-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Seating Position</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((item) => (
                      <tr key={item._id}>
                        {/* Token Number */}
                        <td className="font-bold text-[#e5b842]">#{item.tokenNumber}</td>

                        {/* Customer Info */}
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="admin-user-name">{item.name}</div>
                              <div className="text-[10px] text-gray-500">{item.phone}</div>
                            </div>
                          </div>
                        </td>

                        {/* Selected Service */}
                        <td>
                          <div className="admin-service-cell">
                            <Scissors size={14} className="admin-service-icon" />
                            <span>{item.service}</span>
                          </div>
                        </td>

                        {/* Position in Waiting Line */}
                        <td>
                          {item.status === "Serving" ? (
                            <span className="text-green-500 font-bold">In Seating</span>
                          ) : (
                            <span className="text-yellow-500 font-semibold">Position #{item.queuePosition}</span>
                          )}
                        </td>

                        {/* Badge status */}
                        <td>
                          <span className={`admin-badge ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div className="admin-table-actions">
                            {/* Complete Haircut */}
                            <button
                              className="admin-table-action-btn complete"
                              title="Complete Haircut"
                              onClick={() => completeHaircut(item._id)}
                              disabled={isActionPending}
                            >
                              <Check size={18} />
                            </button>

                            {/* Cancel token */}
                            <button
                              className="admin-table-action-btn cancel"
                              title="Cancel Token"
                              onClick={() => handleCancelItem(item._id, item.tokenNumber)}
                              disabled={isActionPending}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
            </>
          ) : (
            <div className="admin-table-container max-w-xl mx-auto" style={{ padding: "2rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", background: "#111111" }}>
              <div className="flex items-center gap-3 mb-6">
                <Lock size={20} className="text-[#e5b842]" />
                <h2 className="admin-table-title text-[#e5b842] uppercase tracking-wide" style={{ margin: 0 }}>Security Settings</h2>
              </div>
              
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
                {/* Admin Name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Administrator Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="customer-input w-full bg-black/40 border border-white/[0.08] text-white px-4 py-2.5 rounded-8 focus:border-[#e5b842] outline-none"
                    placeholder="e.g. Salon Owner"
                    required
                  />
                </div>

                {/* Login Email */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Login Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="customer-input w-full bg-black/40 border border-white/[0.08] text-white px-4 py-2.5 rounded-8 focus:border-[#e5b842] outline-none"
                    placeholder="e.g. admin@happyhappy.com"
                    required
                  />
                  <span className="text-[10px] text-gray-500 italic">*Changing this email changes your login address.</span>
                </div>

                <div className="border-t border-white/[0.04] my-1"></div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="customer-input w-full bg-black/40 border border-white/[0.08] text-white px-4 py-2.5 rounded-8 focus:border-[#e5b842] outline-none"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="customer-input w-full bg-black/40 border border-white/[0.08] text-white px-4 py-2.5 rounded-8 focus:border-[#e5b842] outline-none"
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Save Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="admin-primary-action-btn w-full sm:w-auto"
                  >
                    {isSavingSettings ? "Saving Settings..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
