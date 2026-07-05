import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "happy_happy_saloon_jwt_secret_key";

export function authMiddleware(req, res, next) {
  let token = "";

  // Check authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Check cookies as fallback
  if (!token && req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required. Please log in." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired session. Please log in again." });
    return;
  }
}
