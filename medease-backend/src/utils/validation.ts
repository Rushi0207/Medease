import { body, param, query, ValidationChain } from 'express-validator';

// Common validation patterns
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

export const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const nameValidation = (field: string) =>
  body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} must contain only letters and spaces`);

export const phoneValidation = body('phone')
  .optional()
  .matches(/^\+?[\d\s\-\(\)]+$/)
  .withMessage('Please provide a valid phone number');

export const uuidValidation = (field: string) =>
  param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);

// Health metrics validations
export const weightValidation = body('weight')
  .optional()
  .isFloat({ min: 20, max: 500 })
  .withMessage('Weight must be between 20 and 500 kg');

export const heightValidation = body('height')
  .optional()
  .isFloat({ min: 50, max: 250 })
  .withMessage('Height must be between 50 and 250 cm');

export const heartRateValidation = body('heartRate')
  .optional()
  .isInt({ min: 30, max: 200 })
  .withMessage('Heart rate must be between 30 and 200 bpm');

export const bloodPressureValidation = body('bloodPressure')
  .optional()
  .matches(/^\d{2,3}\/\d{2,3}$/)
  .withMessage('Blood pressure must be in format "120/80"');

// Date validations
export const dateValidation = (field: string) =>
  body(field)
    .isISO8601()
    .toDate()
    .withMessage(`${field} must be a valid date`);

export const futureDateValidation = (field: string) =>
  body(field)
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error(`${field} must be in the future`);
      }
      return true;
    });

// Pagination validations
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Search validation
export const searchValidation = query('query')
  .optional()
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage('Search query must be between 1 and 100 characters');

export default {
  emailValidation,
  passwordValidation,
  nameValidation,
  phoneValidation,
  uuidValidation,
  weightValidation,
  heightValidation,
  heartRateValidation,
  bloodPressureValidation,
  dateValidation,
  futureDateValidation,
  paginationValidation,
  searchValidation,
};