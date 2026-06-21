
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../data/connection.js';

export const generateAndSendTokens = async (user, res) => {
  const jti = uuidv4();

  const refreshToken = jwt.sign(
    { userId: user.id, 
      jti ,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  // Generate Tokens 
  const accessToken = jwt.sign(
    { userId: user.id, 
      jti ,
    
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );


  // Save JTI to DB
  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() +  24 * 60 * 60 * 1000),
    },
  });

  // Set Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge:  24 * 60 * 60 * 1000,
  });

  return accessToken;
};

