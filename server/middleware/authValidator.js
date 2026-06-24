import { body, validationResult } from "express-validator";

// 1. Cleaner Required String Factory
const createRequiredStringValidation = (fieldName, message) => [
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(message || `${fieldName} is required.`)
    .isLength({ min: 3 })
    .withMessage(`${fieldName} must be at least 3 characters long.`)
];

// 2. Individual Specialized Rule Chains
const passwordValidationChain = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches('[a-z]')
    .withMessage('Password must contain at least one lowercase letter.')
];

const confirmPassword = [
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password.');
      }
      return true;
    })
];

// 3. Combined Route Validation Blueprints
export const signupValidation = [
  ...createRequiredStringValidation('userName', 'user name is required'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  ...passwordValidationChain,
  ...confirmPassword
];

export const signInValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// 4. Integrated Error Handler (Tied to your catchAsync Global System! 🚀)
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Take the first validation error message discovered
    const firstErrorMsg = errors.array()[0].msg;
    
    const err = new Error(firstErrorMsg);
    err.statusCode = 422; // Unprocessable Entity
    return next(err);     // Shunt directly to your global error middleware!
  }
  next();
};