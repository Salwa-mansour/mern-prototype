import prisma from '../data/connection.js';
import bcrypt from 'bcryptjs';

// account related queries
async function createUser({ userName, email, password }) {
  let hashedPassword = null;
  // Skip it if it's null (Google OAuth signup).
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }
  return prisma.user.create({
    data: { name:userName, email, password: hashedPassword },
  });
}
async function allUsers() {
  return prisma.user.findMany();
}
async function findByEmail(email) {

  return prisma.user.findUnique({
    where: {
      email: email, 
    },
  });
}
async function findByUserName(userName) {
  return prisma.user.findUnique({
    where: {
      name: userName, 
    },});
}
async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id: Number(id) } });
}

// 💡 Add newJti as the fourth parameter
async function rotateToken(oldJti, userId, newRefreshToken, newJti) {
  if (!oldJti) return null;

  try {
    const newToken = await prisma.$transaction(async (tx) => {
      
      // 1. Check if the token exists
      const existingToken = await tx.refreshToken.findUnique({
        where: { id: oldJti },
      });

      // 2. If it's missing, it's a reuse/replay attack
      if (!existingToken) {
        throw new Error("REUSE_DETECTED");
      }

      // 3. Delete the used token
      await tx.refreshToken.delete({
        where: { id: oldJti },
      });

      // 4. 💡 FIXED: Explicitly force the database row to use the token's JTI
      return await tx.refreshToken.create({
        data: {
          id: newJti, // 🌟 Save the synchronized JTI here!
          userId: userId,
          token: newRefreshToken, 
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });

    return newToken;

  } catch (error) {
    if (error.message === "REUSE_DETECTED") {
      console.warn(`[SECURITY] Token reuse detected for user ${userId}. JTI: ${oldJti}`);
    } else {
      if (error.code === 'P2025') {
          console.warn("Race condition: Token was deleted by another request.");
      } else {
          console.error("Rotation Database Error:", error);
      }
    }
    return null; 
  }
}
async function  findToken(jti) {
  return await prisma.refreshToken.findUnique({ where: { id: jti } });
}
async function deleteToken(jti){
  return  await prisma.refreshToken.deleteMany({ where: { id: jti } });
}
async function updatedUser(userId,newRoles){ prisma.user.update({
            where: { id: Number(userId) },
            data: { roles: newRoles },
            select: { id: true, name: true, roles: true }
        });
  
}
export  {
  createUser,
  allUsers,
  findByEmail,
  findByUserName,
  updatedUser,
  comparePassword,
  findUserById,
  rotateToken,
  deleteToken,
  findToken
}