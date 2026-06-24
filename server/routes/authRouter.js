import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshToken, 
  logoutUser 
} from '../controllers/authController.js';
import { signupValidation, signInValidation, handleValidationErrors } from '../middleware/authValidator.js';

const router = Router();

// POST request to handle registration data submissions
router.post('/register',signupValidation, handleValidationErrors, registerUser);
router.post('/login', signInValidation, handleValidationErrors,loginUser);
router.get('/refresh', refreshToken);
router.post('/logout', logoutUser);


export default router;