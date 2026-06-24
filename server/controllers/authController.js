import * as authService from '../servises/authService.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateAndSendTokens } from '../utils/tokens.js';

// POST /register
export const registerUser = async (req, res, next) => {
  const { userName, email, password, confirmPassword } = req.body;

  try {
    // 1. Check if user already exists
    const existingUserName = await authService.findByUserName(userName);
    if (existingUserName) {
        return res.status(409).json({ error: 'Username is already taken' });
    }
     
    const existingUser = await authService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    if (password !== confirmPassword) {
      return res.status(422).json({ error: 'Passwords do not match' });
    }

    // 2. Create the user in the database
    const user = await authService.createUser({ userName, email, password });

    // 3. Generate tokens and set cookie via your new consistent helper
    const accessToken = await generateAndSendTokens(user, res);

    // 4. Standardized response to match your schema keys
    return res.status(201).json({
      message: "User created and logged in",
      accessToken,
      user: { 
        userId: user.id, 
        username: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await authService.findByEmail(email);
    
    if (!user) {
      console.log('🔍 Debug: User email not found in database');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      console.log('🔍 Debug: User object missing password hash field');
      return res.status(500).json({ error: "Database configuration error" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('🔍 Debug: Password does not match hash string');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate Tokens using your consistent helper function
    const accessToken = await generateAndSendTokens(user, res);

    // Standardized frontend auth payload shape matching your layout schema keys
    return res.json({ 
      accessToken,
      // user: { 
      //   userId: user.id,
      //   username: user.name,
      //   email: user.email
      // } 
    });

  } catch (err) {
    console.error("🔥 Server Exception in loginUser:", err);
    return res.status(500).json({ error: err.message });
  }
};

// POST /logout
export const logoutUser = async (req, res) => {
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
  res.status(200).json({ message: "Logged out" });
};

// GET /users
export const getAllUsers = async (req, res) => {
  try {
    const users = await authService.allUsers();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /refresh
export const refreshToken = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const nextJti = uuidv4(); // Generate the primary key match ⚡

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

        // 💡 FIXED: Pass nextJti as the 4th argument so Prisma stores the true key
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
            return res.status(403).json({ message: "Invalid session" });
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

    } catch (err) {
        console.error("Refresh Error:", err.message);
        return res.sendStatus(403);
    }
};