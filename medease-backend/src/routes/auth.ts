import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { authenticate, authRateLimit } from '../middleware/auth';
import { validate, validateUserRegistration, sanitizeInput } from '../middleware/validation';
import { 
  emailValidation, 
  passwordValidation, 
  nameValidation, 
  phoneValidation 
} from '../utils/validation';

const router = Router();
const authController = new AuthController();

// Apply rate limiting to all auth routes
router.use(authRateLimit(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes

// Apply input sanitization to all routes
router.use(sanitizeInput);

// User registration
router.post('/signup',
  validate([
    emailValidation,
    passwordValidation,
    nameValidation('firstName'),
    nameValidation('lastName'),
    phoneValidation,
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Date of birth must be a valid date'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
    body('roles')
      .optional()
      .isArray()
      .withMessage('Roles must be an array')
      .custom((roles) => {
        const validRoles = ['PATIENT', 'DOCTOR'];
        return roles.every((role: string) => validRoles.includes(role));
      })
      .withMessage('Invalid role specified'),
    // Doctor-specific validations
    body('specialty')
      .if(body('roles').custom((roles) => roles && roles.includes('DOCTOR')))
      .notEmpty()
      .withMessage('Specialty is required for doctor registration')
      .isLength({ min: 2, max: 100 })
      .withMessage('Specialty must be between 2 and 100 characters'),
    body('licenseNumber')
      .if(body('roles').custom((roles) => roles && roles.includes('DOCTOR')))
      .notEmpty()
      .withMessage('License number is required for doctor registration')
      .isLength({ min: 5, max: 50 })
      .withMessage('License number must be between 5 and 50 characters'),
    body('experience')
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage('Experience must be between 0 and 50 years'),
    body('consultationFee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Consultation fee must be a positive number')
  ]),
  validateUserRegistration,
  authController.register
);

// User login
router.post('/signin',
  validate([
    emailValidation,
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]),
  authController.login
);

// Token refresh
router.post('/refresh',
  validate([
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ]),
  authController.refreshToken
);

// Password change (requires authentication)
router.post('/change-password',
  authenticate,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    passwordValidation.withMessage('New password does not meet requirements')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        return true;
      })
  ]),
  authController.changePassword
);

// Password reset request
router.post('/forgot-password',
  validate([
    emailValidation
  ]),
  authController.requestPasswordReset
);

// Token validation
router.post('/validate-token',
  authController.validateToken
);

// User logout (requires authentication)
router.post('/logout',
  authenticate,
  authController.logout
);

// Get current user profile (requires authentication)
router.get('/profile',
  authenticate,
  authController.getProfile
);

export default router;