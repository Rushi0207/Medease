import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class UserModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles?: UserRole[];
  }): Promise<User> {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      roles = [UserRole.PATIENT]
    } = userData;

    try {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (email, password, first_name, last_name, phone, roles)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, phone, roles, is_active, created_at, updated_at
      `;

      const values = [email, hashedPassword, firstName, lastName, phone, roles];
      const result = await this.pool.query(query, values);

      const user = this.mapRowToUser(result.rows[0]);
      logger.info(`User created successfully: ${email}`);
      
      return user;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw createError('Email already exists', 409, 'EMAIL_ALREADY_EXISTS');
      }
      logger.error('Failed to create user:', error);
      throw createError('Failed to create user', 500, 'USER_CREATION_FAILED');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, password, first_name, last_name, phone, roles, is_active, created_at, updated_at
        FROM users
        WHERE email = $1 AND is_active = true
      `;

      const result = await this.pool.query(query, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      throw createError('Failed to find user', 500, 'USER_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, password, first_name, last_name, phone, roles, is_active, created_at, updated_at
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find user by ID:', error);
      throw createError('Failed to find user', 500, 'USER_LOOKUP_FAILED');
    }
  }

  async updateProfile(id: string, updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<User> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.firstName) {
        fields.push(`first_name = $${paramCount++}`);
        values.push(updates.firstName);
      }

      if (updates.lastName) {
        fields.push(`last_name = $${paramCount++}`);
        values.push(updates.lastName);
      }

      if (updates.phone !== undefined) {
        fields.push(`phone = $${paramCount++}`);
        values.push(updates.phone);
      }

      if (fields.length === 0) {
        throw createError('No fields to update', 400, 'NO_UPDATES_PROVIDED');
      }

      values.push(id);

      const query = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramCount} AND is_active = true
        RETURNING id, email, first_name, last_name, phone, roles, is_active, created_at, updated_at
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      const user = this.mapRowToUser(result.rows[0]);
      logger.info(`User profile updated: ${user.email}`);
      
      return user;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update user profile:', error);
      throw createError('Failed to update profile', 500, 'PROFILE_UPDATE_FAILED');
    }
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    try {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const query = `
        UPDATE users
        SET password = $1
        WHERE id = $2 AND is_active = true
      `;

      const result = await this.pool.query(query, [hashedPassword, id]);

      if (result.rowCount === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      logger.info(`Password updated for user ID: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update password:', error);
      throw createError('Failed to update password', 500, 'PASSWORD_UPDATE_FAILED');
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Failed to verify password:', error);
      return false;
    }
  }

  async deactivateUser(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET is_active = false
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }

      logger.info(`User deactivated: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to deactivate user:', error);
      throw createError('Failed to deactivate user', 500, 'USER_DEACTIVATION_FAILED');
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      roles: row.roles,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}