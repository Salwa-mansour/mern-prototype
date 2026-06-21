// Path: middleware/authMiddleware.js

import jwt from 'jsonwebtoken';

// MODIFIED: Replaces the old "req.isAuthenticated()" check
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token expired or invalid" });
    }
    
    req.user = decoded; // Attach user info (id, jti) to the request
    next();
  });
};