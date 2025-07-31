import { Pool } from 'pg';
import { Doctor } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class DoctorModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(doctorData: {
    userId: string;
    specialty: string;
    licenseNumber: string;
    experience?: number;
    consultationFee?: number;
    avatar?: string;
    bio?: string;
    education?: string;
  }): Promise<Doctor> {
    const {
      userId,
      specialty,
      licenseNumber,
      experience = 0,
      consultationFee = 0,
      avatar,
      bio,
      education
    } = doctorData;

    try {
      const query = `
        INSERT INTO doctors (user_id, specialty, license_number, experience, consultation_fee, avatar, bio, education)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, specialty, license_number, experience, consultation_fee, rating, avatar, bio, education, is_available, created_at, updated_at
      `;

      const values = [userId, specialty, licenseNumber, experience, consultationFee, avatar, bio, education];
      const result = await this.pool.query(query, values);

      const doctor = this.mapRowToDoctor(result.rows[0]);
      logger.info(`Doctor profile created for user: ${userId}`);
      
      return doctor;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'idx_doctors_user_id') {
          throw createError('Doctor profile already exists for this user', 409, 'DOCTOR_ALREADY_EXISTS');
        }
        if (error.constraint === 'idx_doctors_license_number') {
          throw createError('License number already exists', 409, 'LICENSE_NUMBER_EXISTS');
        }
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      logger.error('Failed to create doctor profile:', error);
      throw createError('Failed to create doctor profile', 500, 'DOCTOR_CREATION_FAILED');
    }
  }

  async findAll(filters?: {
    specialty?: string;
    isAvailable?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Doctor[]> {
    try {
      let query = `
        SELECT id, user_id, specialty, license_number, experience, consultation_fee, rating, avatar, bio, education, is_available, created_at, updated_at
        FROM doctors
        WHERE 1=1
      `;
      
      const values: any[] = [];
      let paramCount = 1;

      if (filters?.specialty) {
        query += ` AND LOWER(specialty) LIKE LOWER($${paramCount++})`;
        values.push(`%${filters.specialty}%`);
      }

      if (filters?.isAvailable !== undefined) {
        query += ` AND is_available = $${paramCount++}`;
        values.push(filters.isAvailable);
      }

      query += ` ORDER BY rating DESC, created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(filters.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToDoctor(row));
    } catch (error) {
      logger.error('Failed to find doctors:', error);
      throw createError('Failed to find doctors', 500, 'DOCTORS_LOOKUP_FAILED');
    }
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    try {
      const query = `
        SELECT id, user_id, specialty, license_number, experience, consultation_fee, rating, avatar, bio, education, is_available, created_at, updated_at
        FROM doctors
        WHERE user_id = $1
      `;

      const result = await this.pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDoctor(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find doctor by user ID:', error);
      throw createError('Failed to find doctor', 500, 'DOCTOR_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<Doctor | null> {
    try {
      const query = `
        SELECT id, user_id, specialty, license_number, experience, consultation_fee, rating, avatar, bio, education, is_available, created_at, updated_at
        FROM doctors
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDoctor(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find doctor by ID:', error);
      throw createError('Failed to find doctor', 500, 'DOCTOR_LOOKUP_FAILED');
    }
  }

  private mapRowToDoctor(row: any): Doctor {
    return {
      id: row.id,
      userId: row.user_id,
      specialty: row.specialty,
      licenseNumber: row.license_number,
      experience: row.experience,
      consultationFee: parseFloat(row.consultation_fee),
      rating: parseFloat(row.rating),
      avatar: row.avatar,
      bio: row.bio,
      education: row.education,
      isAvailable: row.is_available,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}