import { Pool } from 'pg';
import { UserModel, PatientModel, DoctorModel } from '../models';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import { UserRole } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthService {
  private userModel: UserModel;
  private patientModel: PatientModel;
  private doctorModel: DoctorModel;

  constructor(pool: Pool) {
    this.userModel = new UserModel(pool);
    this.patientModel = new PatientModel(pool);
    this.doctorModel = new DoctorModel(pool);
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    roles?: UserRole[];
    // Doctor-specific fields
    specialty?: string;
    licenseNumber?: string;
    experience?: number;
    consultationFee?: number;
  }) {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      roles = [UserRole.PATIENT],
      specialty,
      licenseNumber,
      experience,
      consultationFee
    } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        throw createError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS');
      }

      // Validate password strength
      PasswordUtils.validatePasswordStrength(password);

      // Check if password is compromised
      const isCompromised = await PasswordUtils.isPasswordCompromised(password);
      if (isCompromised) {
        throw createError(
          'Password is commonly used and not secure. Please choose a different password.',
          400,
          'COMPROMISED_PASSWORD'
        );
      }

      // Create user
      const user = await this.userModel.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        roles
      });

      // Create role-specific profiles
      let patientProfile = null;
      let doctorProfile = null;

      if (roles.includes(UserRole.PATIENT)) {
        patientProfile = await this.patientModel.create({
          userId: user.id,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender
        });
      }

      if (roles.includes(UserRole.DOCTOR)) {
        if (!specialty || !licenseNumber) {
          throw createError(
            'Specialty and license number are required for doctor registration',
            400,
            'MISSING_DOCTOR_FIELDS'
          );
        }

        doctorProfile = await this.doctorModel.create({
          userId: user.id,
          specialty,
          licenseNumber,
          experience: experience || 0,
          consultationFee: consultationFee || 0
        });
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: user.roles
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      logger.info(`User registered successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roles: user.roles,
          createdAt: user.createdAt
        },
        patientProfile,
        doctorProfile,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      };
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Registration failed:', error);
      throw createError('Registration failed', 500, 'REGISTRATION_FAILED');
    }
  }

  async login(email: string, password: string) {
    try {
      // Find user by email
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Verify password
      const isPasswordValid = await this.userModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Check if user is active
      if (!user.isActive) {
        throw createError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
      }

      // Get role-specific profiles
      let patientProfile = null;
      let doctorProfile = null;

      if (user.roles.includes(UserRole.PATIENT)) {
        patientProfile = await this.patientModel.findByUserId(user.id);
      }

      if (user.roles.includes(UserRole.DOCTOR)) {
        doctorProfile = await this.doctorModel.findByUserId(user.id);
      }

      // Generate tokens
      const accessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: user.roles
      });

      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user.id,
        email: user.email
      });

      logger.info(`User logged in successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roles: user.roles,
          createdAt: user.createdAt
        },
        patientProfile,
        doctorProfile,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      };
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Login failed:', error);
      throw createError('Login failed', 500, 'LOGIN_FAILED');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = JWTUtils.verifyRefreshToken(refreshToken);

      // Get user data
      const user = await this.userModel.findById(payload.userId);
      if (!user || !user.isActive) {
        throw createError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Generate new access token
      const newAccessToken = JWTUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: user.roles
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      };
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Token refresh failed:', error);
      throw createError('Token refresh failed', 401, 'TOKEN_REFRESH_FAILED');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get user
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.userModel.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
      }

      // Validate new password strength
      PasswordUtils.validatePasswordStrength(newPassword);

      // Check if new password is compromised
      const isCompromised = await PasswordUtils.isPasswordCompromised(newPassword);
      if (isCompromised) {
        throw createError(
          'New password is commonly used and not secure. Please choose a different password.',
          400,
          'COMPROMISED_PASSWORD'
        );
      }

      // Check if new password is different from current
      const isSamePassword = await this.userModel.verifyPassword(newPassword, user.password);
      if (isSamePassword) {
        throw createError(
          'New password must be different from current password',
          400,
          'SAME_PASSWORD'
        );
      }

      // Update password
      await this.userModel.updatePassword(userId, newPassword);

      logger.info(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Password change failed:', error);
      throw createError('Password change failed', 500, 'PASSWORD_CHANGE_FAILED');
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return { message: 'If the email exists, a password reset link has been sent' };
      }

      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with the reset link
      
      // For now, we'll just log it
      logger.info(`Password reset requested for user: ${email}`);

      return { message: 'If the email exists, a password reset link has been sent' };
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw createError('Password reset request failed', 500, 'PASSWORD_RESET_REQUEST_FAILED');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = JWTUtils.verifyAccessToken(token);
      const user = await this.userModel.findById(payload.userId);
      
      if (!user || !user.isActive) {
        throw createError('Invalid token', 401, 'INVALID_TOKEN');
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles
        }
      };
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      return { valid: false };
    }
  }
}