import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from './logger';

export class JWTUtils {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'default-access-secret-for-development';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-for-development';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static generateAccessToken(payload: {
    userId: string;
    email: string;
    roles: UserRole[];
  }): string {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles,
          type: 'access'
        },
        this.ACCESS_TOKEN_SECRET,
        {
          expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
          issuer: 'medease-api',
          audience: 'medease-client'
        } as jwt.SignOptions
      );
      return token;
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw createError('Token generation failed', 500, 'TOKEN_GENERATION_FAILED');
    }
  }

  static generateRefreshToken(payload: {
    userId: string;
    email: string;
  }): string {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          type: 'refresh'
        },
        this.REFRESH_TOKEN_SECRET,
        {
          expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
          issuer: 'medease-api',
          audience: 'medease-client'
        } as jwt.SignOptions
      );
      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw createError('Token generation failed', 500, 'TOKEN_GENERATION_FAILED');
    }
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'medease-api',
        audience: 'medease-client'
      }) as any;

      if (decoded.type !== 'access') {
        throw createError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw createError('Access token expired', 401, 'TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw createError('Invalid access token', 401, 'INVALID_TOKEN');
      }
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to verify access token:', error);
      throw createError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }

  static verifyRefreshToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'medease-api',
        audience: 'medease-client'
      }) as any;

      if (decoded.type !== 'refresh') {
        throw createError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw createError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw createError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to verify refresh token:', error);
      throw createError('Refresh token verification failed', 401, 'REFRESH_TOKEN_VERIFICATION_FAILED');
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  }
}

export default JWTUtils;