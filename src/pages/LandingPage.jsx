import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import salonLogo from "../assets/images/salon_logo_1783178148829.jpg";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Background patterns matching Figma style in LandingPage.css */}
      <div className="landing-bg-pattern"></div>
      <div className="landing-scissors-decor">✂</div>

      <div className="landing-card animate-fade-in">
        {/* Minimalist Line-art Scissors and Comb */}
        <div className="landing-logo-container">
          <img 
            src={salonLogo} 
            alt="Happy Happy Saloon Logo" 
            className="landing-logo rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <h1 className="landing-title">
          Book.Relaxed, <br />
          <span>Get Styled</span>
        </h1>

        <div className="landing-options">
          <div className="landing-option-row">
            <span className="landing-option-text">Admin Panel</span>
            <button
              onClick={() => navigate("/admin/login")}
              className="landing-btn landing-btn-admin"
            >
              Login
            </button>
          </div>
          
          <div className="landing-option-row">
            <span className="landing-option-text">Booking Token</span>
            <button
              onClick={() => navigate("/token")}
              className="landing-btn landing-btn-token"
            >
              Get Token
            </button>
          </div>
        </div>

        <footer className="landing-footer">
          <p>© 2026 Barber Shop. All Rights Reserved.</p>
          <p>Powered by Abhishek Mishra</p>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
