import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { createError } from './errorHandler';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    throw createError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: formattedErrors }
    );
  }

  next();
};

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    for (const validation of validations) {
      await validation.run(req);
    }

    // Check for validation errors
    handleValidationErrors(req, res, next);
  };
};

// Custom validation middleware for specific business rules
export const validateUserRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, firstName, lastName, roles } = req.body;

  // Additional business logic validation
  if (roles && roles.includes('ADMIN')) {
    throw createError(
      'Admin role cannot be assigned during registration',
      400,
      'INVALID_ROLE_ASSIGNMENT'
    );
  }

  // Check if trying to register as both patient and doctor
  if (roles && roles.includes('PATIENT') && roles.includes('DOCTOR')) {
    throw createError(
      'Cannot register as both patient and doctor',
      400,
      'CONFLICTING_ROLES'
    );
  }

  next();
};

export const validateAppointmentBooking = (req: Request, res: Response, next: NextFunction): void => {
  const { appointmentDate, appointmentTime, type } = req.body;

  // Check if appointment is in the future
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  const now = new Date();

  if (appointmentDateTime <= now) {
    throw createError(
      'Appointment must be scheduled for a future date and time',
      400,
      'INVALID_APPOINTMENT_TIME'
    );
  }

  // Check if appointment is within business hours (9 AM - 6 PM)
  const hour = appointmentDateTime.getHours();
  if (hour < 9 || hour >= 18) {
    throw createError(
      'Appointments can only be scheduled between 9:00 AM and 6:00 PM',
      400,
      'OUTSIDE_BUSINESS_HOURS'
    );
  }

  // Check if appointment is not on weekends
  const dayOfWeek = appointmentDateTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    throw createError(
      'Appointments cannot be scheduled on weekends',
      400,
      'WEEKEND_APPOINTMENT'
    );
  }

  next();
};

export const validateHealthMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const { weight, height, heartRate, bloodPressure } = req.body;

  // Validate weight range
  if (weight !== undefined && (weight < 20 || weight > 500)) {
    throw createError(
      'Weight must be between 20 and 500 kg',
      400,
      'INVALID_WEIGHT'
    );
  }

  // Validate height range
  if (height !== undefined && (height < 50 || height > 250)) {
    throw createError(
      'Height must be between 50 and 250 cm',
      400,
      'INVALID_HEIGHT'
    );
  }

  // Validate heart rate range
  if (heartRate !== undefined && (heartRate < 30 || heartRate > 200)) {
    throw createError(
      'Heart rate must be between 30 and 200 bpm',
      400,
      'INVALID_HEART_RATE'
    );
  }

  // Validate blood pressure format
  if (bloodPressure !== undefined) {
    const bpPattern = /^\d{2,3}\/\d{2,3}$/;
    if (!bpPattern.test(bloodPressure)) {
      throw createError(
        'Blood pressure must be in format "120/80"',
        400,
        'INVALID_BLOOD_PRESSURE_FORMAT'
      );
    }

    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    if (systolic < 70 || systolic > 250 || diastolic < 40 || diastolic > 150) {
      throw createError(
        'Blood pressure values are outside normal ranges',
        400,
        'INVALID_BLOOD_PRESSURE_VALUES'
      );
    }
  }

  next();
};

export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    throw createError(
      'No file uploaded',
      400,
      'NO_FILE_UPLOADED'
    );
  }

  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    throw createError(
      'Invalid file type. Only PDF, images, and Word documents are allowed',
      400,
      'INVALID_FILE_TYPE'
    );
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    throw createError(
      'File size too large. Maximum size is 10MB',
      400,
      'FILE_TOO_LARGE'
    );
  }

  next();
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Basic input sanitization
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS patterns
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

export default {
  handleValidationErrors,
  validate,
  validateUserRegistration,
  validateAppointmentBooking,
  validateHealthMetrics,
  validateFileUpload,
  sanitizeInput,
};