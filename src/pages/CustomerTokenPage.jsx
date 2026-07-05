import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { ArrowLeft, RefreshCw, Scissors, Phone, User } from "lucide-react";
import "../styles/CustomerPage.css";

const SERVICES_LIST = [
  { id: "haircut", name: "Hair Cut", duration: 15 },
  { id: "beard", name: "Beard Trim", duration: 15 },
  { id: "spa", name: "Hair Spa", duration: 20 },
  { id: "cleanup", name: "Face Clean Up", duration: 15 },
];

export const CustomerTokenPage = () => {
  const navigate = useNavigate();
  const { queue, stats, generateToken, cancelToken } = useApp();

  // Local state for form input
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedService, setSelectedService] = useState("Hair Cut");

  
  const [myTokenId, setMyTokenId] = useState(localStorage.getItem("my_token_id"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const myActiveItem = queue.find((q) => q._id === myTokenId);

  useEffect(() => {
    if (myTokenId && queue.length > 0 && !myActiveItem) {
      console.log("Token is no longer active (completed/cancelled on backend).");
      localStorage.removeItem("my_token_id");
      setMyTokenId(null);
    }
  }, [queue, myTokenId, myActiveItem]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !selectedService) return;

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      return; 
    }

    setIsSubmitting(true);
    const tokenItem = await generateToken(name.trim(), digitsOnly, selectedService);
    setIsSubmitting(false);

    if (tokenItem) {
      localStorage.setItem("my_token_id", tokenItem._id);
      setMyTokenId(tokenItem._id);
    }
  };

  const handleCancelMyToken = async () => {
    if (!myTokenId) return;
    
    const confirmCancel = window.confirm("Are you sure you want to cancel your active token?");
    if (!confirmCancel) return;

    const success = await cancelToken(myTokenId);
    if (success) {
      localStorage.removeItem("my_token_id");
      setMyTokenId(null);
    }
  };

  

  const servingItems = queue.filter((q) => q.status === "Serving");
  const servingTokensText = servingItems.length > 0
    ? servingItems.map((s) => `#${s.tokenNumber}`).join(" & ")
    : "None (Barbers Vacant)";

  
  const myPosition = myActiveItem ? myActiveItem.queuePosition : 0;

  let notificationMessage = "";
  if (myActiveItem) {
    if (myActiveItem.status === "Serving") {
      notificationMessage = "Please proceed to the barber chair.";
    } else {
      // Waiting states
      if (myPosition === 1) {
        notificationMessage = "It's your turn";
      } else if (myPosition === 2) {
        notificationMessage = "Please be ready";
      } else if (myPosition === 3) {
        notificationMessage = "Please stay inside the shop";
      } else {
        notificationMessage = "You can come later";
      }
    }
  }
  const estimatedWaitingTime = myActiveItem
    ? myActiveItem.status === "Serving"
      ? 0
      : Math.max(1, Math.ceil((myPosition - 2) / 2)) * 15
    : 0;

  return (
    <div className="customer-container" id="customer-token-page">
      <div className="customer-content">
        
        {/* Figma Header Card with Unsplash Barber Chair and Gold Styling */}
        <div className="customer-header-card">
          <div className="customer-header-info">
            <div className="customer-header-tag">HEY USER,</div>
            <h1 className="customer-header-title">
              Welcome to <span>Happy Happy Saloon</span>
            </h1>
            <p className="customer-header-subtitle">Look Sharp, Feel confident.</p>
          </div>
          <div className="customer-header-image"></div>
        </div>

        {}
        {!myActiveItem ? (
          <div className="customer-form-card">
            <h2 className="text-xl font-bold text-center text-[#e5b842] mb-2 uppercase tracking-wide">
              Generate Digital Token
            </h2>
            <p className="text-xs text-gray-400 text-center max-w-md mb-4">
              Skip the physical wait line! Fill your details below to instantly reserve your barber slot.
            </p>

            <form className="w-full flex flex-col gap-4" onSubmit={handleGenerate}>
              <div className="customer-input-row">
                {/* Full Name */}
                <div className="customer-input-wrapper">
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      className="customer-input pl-12"
                      placeholder="Enter Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="customer-input-wrapper">
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      className="customer-input pl-12"
                      placeholder="Enter your number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Service Select List */}
              <div className="customer-input-wrapper w-full">
                <div className="relative">
                  <Scissors size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    className="customer-select pl-12"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {SERVICES_LIST.map((srv) => (
                      <option key={srv.id} value={srv.name}>
                        {srv.name} (Est. {srv.duration} mins)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center mt-3">
                <button
                  type="submit"
                  className="customer-btn-generate"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "GENERATING..." : "Generate Token"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          
          <div className="customer-token-panel">
            <div className="customer-token-panel-header">
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider font-semibold">Your Active Appointment</span>
                <span className="text-[#e5b842] font-semibold text-sm">Hello, {myActiveItem.name} ({myActiveItem.service})</span>
              </div>
              <button
                className="customer-cancel-token-btn"
                onClick={handleCancelMyToken}
              >
                Cancel Token
              </button>
            </div>

            {}
            <div className="customer-token-display-row">
              <div className="customer-token-label-box">
                <div className="customer-token-label">Your Token number</div>
              </div>
              
              {/* Token Number Box (Yellow Box) */}
              <div className="customer-token-box" id="customer-token-box">
                {myActiveItem.tokenNumber}
              </div>

              {/* Live Position Alert Message (Blue Pill) */}
              <div className="customer-message-box animate-pulse" id="customer-message-box">
                {notificationMessage}
              </div>
            </div>

            {/* Live Stats Row */}
            <div className="customer-stats-grid">
              <div className="customer-stat-card">
                <div className="customer-stat-title">Currently Serving</div>
                <div className="customer-stat-value gold">{servingTokensText}</div>
              </div>
              <div className="customer-stat-card">
                <div className="customer-stat-title">Your Position</div>
                <div className="customer-stat-value">
                  {myActiveItem.status === "Serving" ? "Chair" : `#${myPosition}`}
                </div>
              </div>
              <div className="customer-stat-card">
                <div className="customer-stat-title">Est. Wait Time</div>
                <div className="customer-stat-value">
                  {estimatedWaitingTime > 0 ? `${estimatedWaitingTime} Mins` : "Immediate!"}
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 italic mt-3">
              💡 Please keep this page open. Status updates refresh in real-time as barbers complete clients.
            </div>
          </div>
        )}

        {/* Back and Sync Action Navigation */}
        <div className="customer-nav-back">
          <button
            className="customer-link-btn"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
          <button
            className="customer-link-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} />
            Force Sync
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerTokenPage;
