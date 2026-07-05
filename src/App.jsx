/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { CustomerTokenPage } from "./pages/CustomerTokenPage.jsx";
import { AdminLoginPage } from "./pages/AdminLoginPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { PastBookingsPage } from "./pages/PastBookingsPage.jsx";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Customer Token Generation & Tracking */}
          <Route path="/token" element={<CustomerTokenPage />} />
          
          {/* Secure Admin Access Panels */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/past-bookings" element={<PastBookingsPage />} />
          
          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Real-time Toast Alerts overlay */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e1e1e",
              color: "#ffffff",
              border: "1px solid rgba(229, 184, 66, 0.2)",
              fontSize: "0.9rem",
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: "#e5b842",
                secondary: "#1e1e1e",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#1e1e1e",
              },
            },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}
