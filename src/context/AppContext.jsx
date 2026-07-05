import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalAppointments: 0,
    remainingCustomers: 0,
    completedCustomers: 0,
    cancelledCustomers: 0,
    servingCustomers: 0,
    waitingCustomers: 0,
  });

  // Socket state
  const [socket, setSocket] = useState(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Connect to the same port as the backend
    const socketConnection = io();
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      console.log("🔌 Connected to real-time Socket.IO server");
      socketConnection.emit("join:queue");
    });

    // Listen to real-time queue updates
    socketConnection.on("queue:updated", (data) => {
      console.log("📢 Real-time update received:", data);
      setQueue(data.queue);
      setStats(data.stats);
      toast.success("Queue updated in real-time!", { id: "realtime_update" });
    });

    socketConnection.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO server");
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Configure global axios authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("admin_token", token);
      setIsAuthenticated(true);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("admin_token");
      setIsAuthenticated(false);
      setAdmin(null);
    }
  }, [token]);

  // Initial Auth Check and Data Fetch
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await checkAuth();
      await fetchQueueAndStats();
      setIsLoading(false);
    };
    initApp();
  }, [token]);

  const checkAuth = async () => {
    if (!token) {
      setIsAuthenticated(false);
      setAdmin(null);
      return;
    }
    try {
      const response = await axios.get("/api/auth/me");
      if (response.data.success) {
        setAdmin(response.data.admin);
        setIsAuthenticated(true);
      } else {
        setToken(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setToken(null);
    }
  };

  const fetchQueueAndStats = async () => {
    try {
      const qRes = await axios.get("/api/queue");
      if (qRes.data.success) {
        setQueue(qRes.data.queue);
      }
      const sRes = await axios.get("/api/queue/stats");
      if (sRes.data.success) {
        setStats(sRes.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const fetchPastBookings = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get("/api/queue/past");
      if (response.data.success) {
        setPastBookings(response.data.pastBookings);
      }
    } catch (error) {
      console.error("Failed to fetch past bookings:", error);
      toast.error(error.response?.data?.message || "Failed to fetch past bookings.");
    }
  };

  // --- API ACTIONS ---

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      if (response.data.success) {
        setToken(response.data.token);
        setAdmin(response.data.admin);
        setIsAuthenticated(true);
        toast.success(response.data.message || "Logged in successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login request failed:", error);
      toast.error(error.response?.data?.message || "Invalid credentials.");
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Server logout error:", error);
    } finally {
      setToken(null);
      setAdmin(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully.");
    }
  };

  const generateToken = async (name, phone, service) => {
    try {
      const response = await axios.post("/api/queue/generate", { name, phone, service });
      if (response.data.success) {
        toast.success(response.data.message || "Token generated successfully.");
        await fetchQueueAndStats();
        return response.data.token;
      }
      return null;
    } catch (error) {
      console.error("Failed to generate token:", error);
      toast.error(error.response?.data?.message || "Failed to generate token.");
      return null;
    }
  };

  const cancelToken = async (id) => {
    try {
      const response = await axios.post(`/api/queue/cancel/${id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Token cancelled.");
        await fetchQueueAndStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to cancel token:", error);
      toast.error(error.response?.data?.message || "Failed to cancel token.");
      return false;
    }
  };

  // --- ADMIN ACTIONS ---

  const completeHaircut = async (id) => {
    try {
      const response = await axios.post(`/api/queue/complete/${id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Haircut completed.");
        await fetchQueueAndStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to complete haircut:", error);
      toast.error(error.response?.data?.message || "Failed to complete haircut.");
      return false;
    }
  };

  const callNext = async () => {
    try {
      const response = await axios.post("/api/queue/call-next");
      if (response.data.success) {
        toast.success(response.data.message || "Called next customer.");
        await fetchQueueAndStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to call next customer:", error);
      toast.error(error.response?.data?.message || "Failed to call next customer.");
      return false;
    }
  };

  const resetQueue = async () => {
    try {
      const response = await axios.post("/api/queue/reset");
      if (response.data.success) {
        toast.success(response.data.message || "Queue has been reset for the day.");
        await fetchQueueAndStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to reset queue:", error);
      toast.error(error.response?.data?.message || "Failed to reset queue.");
      return false;
    }
  };

  const updateCredentials = async (email, name, password) => {
    try {
      const response = await axios.post("/api/auth/update-credentials", { email, name, password });
      if (response.data.success) {
        setAdmin(response.data.admin);
        toast.success(response.data.message || "Credentials updated successfully.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update credentials:", error);
      toast.error(error.response?.data?.message || "Failed to update credentials.");
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        queue,
        pastBookings,
        stats,
        admin,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
        generateToken,
        cancelToken,
        completeHaircut,
        callNext,
        resetQueue,
        fetchPastBookings,
        fetchQueueAndStats,
        updateCredentials,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
