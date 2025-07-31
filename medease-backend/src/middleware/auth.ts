import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { UserRole, JwtPayload } from '../types';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      throw createError('Authentication token required', 401, 'TOKEN_REQUIRED');
    }

    const payload = JWTUtils.verifyAccessToken(token);
    req.user = payload;

    logger.debug(`User authenticated: ${payload.userId} (${payload.email})`);
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      const userRoles = req.user.roles;
      const hasPermission = allowedRoles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        throw createError(
          'Insufficient permissions',
          403,
          'INSUFFICIENT_PERMISSIONS',
          { required: allowedRoles, current: userRoles }
        );
      }

      logger.debug(`User authorized: ${req.user.userId} for roles: ${allowedRoles.join(', ')}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = JWTUtils.verifyAccessToken(token);
        req.user = payload;
        logger.debug(`Optional auth - User authenticated: ${payload.userId}`);
      } catch (error) {
        // Token is invalid, but we continue without authentication
        logger.debug('Optional auth - Invalid token provided, continuing without auth');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePatientRole = authorize([UserRole.PATIENT]);
export const requireDoctorRole = authorize([UserRole.DOCTOR]);
export const requireAdminRole = authorize([UserRole.ADMIN]);
export const requirePatientOrDoctorRole = authorize([UserRole.PATIENT, UserRole.DOCTOR]);
export const requireDoctorOrAdminRole = authorize([UserRole.DOCTOR, UserRole.ADMIN]);

// Middleware to check if user owns the resource (for patient-specific resources)
export const requireResourceOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId;

      // Admin can access any resource
      if (req.user.roles.includes(UserRole.ADMIN)) {
        return next();
      }

      // For patients, check if they own the resource
      if (req.user.roles.includes(UserRole.PATIENT)) {
        // This would need to be customized based on the specific resource
        // For now, we'll assume the resource ID matches the user ID or patient ID
        if (resourceId !== userId) {
          throw createError('Access denied to this resource', 403, 'RESOURCE_ACCESS_DENIED');
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting for authentication endpoints
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [key, value] of attempts.entries()) {
      if (now > value.resetTime) {
        attempts.delete(key);
      }
    }

    const clientAttempts = attempts.get(clientId);

    if (!clientAttempts) {
      attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > clientAttempts.resetTime) {
      attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientAttempts.count >= maxAttempts) {
      throw createError(
        'Too many authentication attempts. Please try again later.',
        429,
        'TOO_MANY_AUTH_ATTEMPTS'
      );
    }

    clientAttempts.count++;
    next();
  };
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  requirePatientRole,
  requireDoctorRole,
  requireAdminRole,
  requirePatientOrDoctorRole,
  requireDoctorOrAdminRole,
  requireResourceOwnership,
  authRateLimit,
};