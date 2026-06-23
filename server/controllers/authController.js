
import * as authServise from '../servises/authService.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateAndSendTokens } from '../utils/tokens.js';

// POST /signup
export const registerUser = async (req, res, next) => {
  const { userName, email, password ,confirmPassword} = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await authServise.findByEmail(email);
    const existingUserName = await authServise.findByUserName(userName);
    if (existingUserName) {
        return res.status(409).json({ 
          error: 'Username is already taken' 
        });
    }
     
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email is already registered' 
      });
    }
    if (password !== confirmPassword) {
      return res.status(422).json({ 
        error: 'Passwords do not match' 
      });
    }
    // 2. Create the user in the database
    // (Ensure your authServise.createUser hashes the password before saving!)
    const user = await authServise.createUser({ userName, email, password });

// REUSE: Generate tokens and set cookie
    const accessToken = await generateAndSendTokens(user, res);

    return res.status(201).json({
      message: "User created and logged in",
      accessToken,
      user: { id: user.id, username: user.userName }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await authServise.findByEmail(email);
    
    // 1. Separate the check to find out exactly what is missing
    if (!user) {
      console.log('🔍 Debug: User email not found in database');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Validate the database password record exists before comparing
    if (!user.password) {
      console.log('🔍 Debug: User object missing password hash field');
      return res.status(500).json({ error: "Database configuration error" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('🔍 Debug: Password does not match hash string');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Ensure your helper payload mirrors the fields expected by your token rotation
    const accessToken = await generateAndSendTokens(user, res);

    return res.json({ 
      accessToken,
      auth: { 
        id: user.id,
        email: user.email
      } 
    });

  } catch (err) {
    // CRITICAL: Log the raw error stack trace to your terminal console so you can read it!
    console.error("🔥 Server Exception in loginUser:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const logoutUser = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const decoded = jwt.decode(refreshToken);
    if (decoded?.jti) {
      // Delete the refresh token from the database
    await  authServise.deleteToken(decoded.jti);
    }
  }
  res.clearCookie('refreshToken');
  res.status(200).json({ message: "Logged out" });
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await authServise.allUsers();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }

};

export const refreshToken = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.sendStatus(401);

    try {
        // 1. Verify the current Refresh Token
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    
        // 2. Pre-generate the next JTI right now ⚡
        const nextJti = uuidv4();

        // 3. Sign the NEW Refresh Token with the pre-generated JTI
        const newRefreshToken = jwt.sign(
            { userId: decoded.userId, jti: nextJti, userRoles: decoded.userRoles },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Perform the Rotation in the Database
        // Modify your service slightly if needed, or pass nextJti inside the service to force the ID
        const newTokenRecord = await authServise.rotateToken(decoded.jti, decoded.userId, newRefreshToken);

        if (!newTokenRecord) {
            res.clearCookie('refreshToken',
                                        { httpOnly: true,
                                         secure: process.env.NODE_ENV === "production", 
                                         sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", }); 
            return res.status(403).json({ message: "Invalid session" });
        }

        // 5. If your database auto-generated an ID instead, use that for the Access Token!
        const finalJti = newTokenRecord.id; 

        const accessToken = jwt.sign(
            { userId: decoded.userId, jti: finalJti, userRoles: decoded.userRoles },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' } 
        );

        // 6. Send cookie and response back
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