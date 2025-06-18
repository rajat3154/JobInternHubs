import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Authentication Middleware
const isAuthenticated = async (req, res, next) => {
      try {
            // Retrieve token from cookies or Authorization header
            let token = req.cookies.token;
            if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                  token = req.headers.authorization.split(' ')[1];
            }
            console.log("[isAuthenticated] Received token:", token);
            // Check if token exists
            if (!token) {
                  console.warn("[isAuthenticated] No token provided");
                  return res.status(401).json({
                        message: "User not authenticated, token missing",
                        success: false,
                  });
            }

            // Verify the token
            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.SECRET_KEY);
                  console.log("[isAuthenticated] Decoded token:", decoded);
            } catch (verifyError) {
                  console.error("[isAuthenticated] Token verification error:", verifyError.message);
                  return res.status(401).json({
                        message: "Invalid or expired token",
                        success: false,
                  });
            }

            // Ensure the decoded token has the required userId
            if (!decoded || !decoded.userId) {
                  return res.status(401).json({
                        message: "Invalid token or missing userId",
                        success: false,
                  });
            }

            // Attach the user info to the request
            req.user = {
                  _id: decoded.userId, // Changed to _id for consistency
                  role: decoded.role, // Assuming role exists in the token
            };

            // Debug log for verification
            console.log("Authenticated User:", req.user);

            // Proceed to the next middleware or route handler
            next();

      } catch (error) {
            console.error("Authentication Error:", error.message);
            return res.status(500).json({
                  message: "Internal server error",
                  success: false,
            });
      }
};


export default isAuthenticated;

export const isAdmin = (req, res, next) => {
      if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can perform this action." });
      }
      next();
};