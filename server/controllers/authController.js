import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbService } from "../services/dbService.js";

const JWT_SECRET = process.env.JWT_SECRET || "happy_happy_saloon_jwt_secret_key";
const TOKEN_EXPIRY = "1d"; // Token valid for 1 day

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required." });
      return;
    }

    const admin = await dbService.getAdminByEmail(email);
    if (!admin) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Set cookie
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error during login." });
  }
}

export async function getMe(req, res) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }

    res.status(200).json({
      success: true,
      admin: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve user context." });
  }
}

export async function adminLogout(req, res) {
  res.clearCookie("admin_token");
  res.status(200).json({ success: true, message: "Logged out successfully." });
}

export async function updateCredentials(req, res) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated." });
      return;
    }

    const { email, name, password } = req.body;

    if (!email || !name) {
      res.status(400).json({ success: false, message: "Name and email are required." });
      return;
    }

    // Check if new email is already taken by another admin (if email is being changed)
    const oldEmail = req.user.email;
    if (email.toLowerCase() !== oldEmail.toLowerCase()) {
      const existing = await dbService.getAdminByEmail(email);
      if (existing) {
        res.status(400).json({ success: false, message: "This email address is already in use by another administrator." });
        return;
      }
    }

    let passwordHash;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const success = await dbService.updateAdmin(oldEmail, email, passwordHash, name);
    if (!success) {
      res.status(404).json({ success: false, message: "Admin account not found." });
      return;
    }

    // Since email or name might have changed, sign a new JWT token and update the cookie
    const token = jwt.sign(
      { email, name },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      success: true,
      message: "Credentials updated successfully.",
      admin: { email, name },
    });
  } catch (error) {
    console.error("Update credentials error:", error);
    res.status(500).json({ success: false, message: "Failed to update admin credentials." });
  }
}
