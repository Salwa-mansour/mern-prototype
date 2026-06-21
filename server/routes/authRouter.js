import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshToken, 
  logoutUser 
} from '../controllers/authController.js';

const router = Router();

// POST request to handle registration data submissions
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/refresh', refreshToken);
router.post('/logout', logoutUser);


export default router;