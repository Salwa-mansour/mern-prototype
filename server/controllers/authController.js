import * as authService from '../servises/authService.js'
import bcrypt from 'bcryptjs';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateAndSendTokens } from '../utils/tokens.js';
import catchAsync from '../utils/catchAsyncError.js'; // 💡 Import your new async wrapper

// POST /register
export const registerUser = catchAsync(async (req, res, next) => {
  const { userName, email, password } = req.body;

  // 1. Database uniqueness checks remain clean and direct
  const existingUserName = await authService.findByUserName(userName);
  if (existingUserName) {
      const err = new Error('Username is already taken');
      err.statusCode = 409;
      throw err;
  }
     
  const existingUser = await authService.findByEmail(email);
  if (existingUser) {
    const err = new Error('Email is already registered');
    err.statusCode = 409;
    throw err;
  }

  // 2. Safely create user (inputs are guaranteed safe by validator now! 🚀)
  const user = await authService.createUser({ userName, email, password });
  const accessToken = await generateAndSendTokens(user, res);

  return res.status(201).json({
    message: "User created and logged in",
    accessToken,
    user: { userId: user.id, username: user.name, email: user.email }
  });
});
// POST /login
export const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

// if (!password) {
//   const err = new Error("This account uses Google Sign-In. Please log in with Google.");
//   err.statusCode = 401;
//   throw err;
// }
  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }

  const user = await authService.findByEmail(email);
  
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  if (!user.password) {
    const err = new Error("Database configuration error");
    err.statusCode = 500;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const accessToken = await generateAndSendTokens(user, res);

  return res.json({ 
    accessToken,
    user: { 
      userId: user.id,
      username: user.name,
      email: user.email
    } 
  });
});

// POST /logout
export const logoutUser = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const decoded = jwt.decode(refreshToken);
    if (decoded?.jti) {
      await authService.deleteToken(decoded.jti);
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.status(200).json({ message: "Logged out" });
});

// GET /users
export const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await authService.allUsers();
  return res.json(users);
});

// GET /refresh
export const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    const err = new Error("Unauthorized: Missing refresh token");
    err.statusCode = 401;
    throw err;
  }

  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  const nextJti = uuidv4(); 

  const tokenPayload = {
      jti: nextJti,
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username
  };

  const newRefreshToken = jwt.sign(
      tokenPayload,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
  );

  const newTokenRecord = await authService.rotateToken(
      decoded.jti, 
      decoded.userId, 
      newRefreshToken, 
      nextJti 
  );

  if (!newTokenRecord) {
      res.clearCookie('refreshToken', { 
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", 
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", 
      }); 
      const err = new Error("Forbidden: Invalid session");
      err.statusCode = 403;
      throw err;
  }

  const accessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' } 
  );

  res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000 
  });

  return res.json({ accessToken });
});

export const googleAuth = catchAsync(async (req, res, next) => {
  // 💡 Safety Guard: If Passport authentication failed or profile is missing, exit safely!
  if (!req.user) {
    const err = new Error("Authentication failed: No user profile received from Google.");
    err.statusCode = 401;
    throw err;
  }

  // 1. Generate the access token and set your secure HttpOnly cookie!
  const accessToken = await generateAndSendTokens(req.user, res);
  
  // 2. Redirect back to your React client with the short-lived access token
  return res.redirect(`http://localhost:5173/oauth-callback?token=${accessToken}`);
});