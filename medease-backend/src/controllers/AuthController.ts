import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(pool);
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        roles,
        specialty,
        licenseNumber,
        experience,
        consultationFee
      } = req.body;

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        roles,
        specialty,
        licenseNumber,
        experience,
        consultationFee
      });

      logger.info(`User registration successful: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      logger.info(`User login successful: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.userId;

      const result = await this.authService.changePassword(userId, currentPassword, newPassword);

      logger.info(`Password change successful for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      const result = await this.authService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TOKEN_REQUIRED',
            message: 'Authentication token is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.authService.validateToken(token);

      res.status(200).json({
        success: true,
        message: 'Token validation result',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // In a stateless JWT implementation, logout is handled client-side
      // by removing the token from storage. However, we can log the event.
      const userId = req.user?.userId;
      
      if (userId) {
        logger.info(`User logout: ${userId}`);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

      // This would typically fetch the full user profile
      // For now, we'll return the user data from the token
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: req.user
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };
}