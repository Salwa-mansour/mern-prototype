import { Router } from 'express';
import passport from 'passport';
import { 
  registerUser, 
  loginUser, 
  refreshToken, 
  logoutUser ,
  googleAuth
} from '../controllers/authController.js';
import { signupValidation, signInValidation, handleValidationErrors } from '../middleware/authValidator.js';


const router = Router();

// POST request to handle registration data submissions
router.post('/register',signupValidation, handleValidationErrors, registerUser);
router.post('/login', signInValidation, handleValidationErrors,loginUser);
router.get('/refresh', refreshToken);
router.post('/logout', logoutUser);
// 1. Kicks user to Google's sign-in page
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google redirects back here after user signs in successfully
router.get(
  '/google/login',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login' }),googleAuth);


export default router;