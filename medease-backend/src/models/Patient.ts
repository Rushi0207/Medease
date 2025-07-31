import { Pool } from 'pg';
import { Patient } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class PatientModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(patientData: {
    userId: string;
    dateOfBirth?: Date;
    gender?: string;
    emergencyContact?: string;
    insuranceInfo?: string;
  }): Promise<Patient> {
    const {
      userId,
      dateOfBirth,
      gender,
      emergencyContact,
      insuranceInfo
    } = patientData;

    try {
      const query = `
        INSERT INTO patients (user_id, date_of_birth, gender, emergency_contact, insurance_info)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, date_of_birth, gender, emergency_contact, insurance_info, created_at, updated_at
      `;

      const values = [userId, dateOfBirth, gender, emergencyContact, insuranceInfo];
      const result = await this.pool.query(query, values);

      const patient = this.mapRowToPatient(result.rows[0]);
      logger.info(`Patient profile created for user: ${userId}`);
      
      return patient;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw createError('Patient profile already exists for this user', 409, 'PATIENT_ALREADY_EXISTS');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('User not found', 404, 'USER_NOT_FOUND');
      }
      logger.error('Failed to create patient profile:', error);
      throw createError('Failed to create patient profile', 500, 'PATIENT_CREATION_FAILED');
    }
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    try {
      const query = `
        SELECT id, user_id, date_of_birth, gender, emergency_contact, insurance_info, created_at, updated_at
        FROM patients
        WHERE user_id = $1
      `;

      const result = await this.pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToPatient(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find patient by user ID:', error);
      throw createError('Failed to find patient', 500, 'PATIENT_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<Patient | null> {
    try {
      const query = `
        SELECT id, user_id, date_of_birth, gender, emergency_contact, insurance_info, created_at, updated_at
        FROM patients
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToPatient(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find patient by ID:', error);
      throw createError('Failed to find patient', 500, 'PATIENT_LOOKUP_FAILED');
    }
  }

  async update(id: string, updates: {
    dateOfBirth?: Date;
    gender?: string;
    emergencyContact?: string;
    insuranceInfo?: string;
  }): Promise<Patient> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.dateOfBirth !== undefined) {
        fields.push(`date_of_birth = $${paramCount++}`);
        values.push(updates.dateOfBirth);
      }

      if (updates.gender !== undefined) {
        fields.push(`gender = $${paramCount++}`);
        values.push(updates.gender);
      }

      if (updates.emergencyContact !== undefined) {
        fields.push(`emergency_contact = $${paramCount++}`);
        values.push(updates.emergencyContact);
      }

      if (updates.insuranceInfo !== undefined) {
        fields.push(`insurance_info = $${paramCount++}`);
        values.push(updates.insuranceInfo);
      }

      if (fields.length === 0) {
        throw createError('No fields to update', 400, 'NO_UPDATES_PROVIDED');
      }

      values.push(id);

      const query = `
        UPDATE patients
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, user_id, date_of_birth, gender, emergency_contact, insurance_info, created_at, updated_at
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw createError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      }

      const patient = this.mapRowToPatient(result.rows[0]);
      logger.info(`Patient profile updated: ${id}`);
      
      return patient;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update patient profile:', error);
      throw createError('Failed to update patient profile', 500, 'PATIENT_UPDATE_FAILED');
    }
  }

  async getPatientWithUser(patientId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          p.id as patient_id,
          p.date_of_birth,
          p.gender,
          p.emergency_contact,
          p.insurance_info,
          p.created_at as patient_created_at,
          p.updated_at as patient_updated_at,
          u.id as user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.roles,
          u.is_active,
          u.created_at as user_created_at,
          u.updated_at as user_updated_at
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1 AND u.is_active = true
      `;

      const result = await this.pool.query(query, [patientId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.patient_id,
        userId: row.user_id,
        dateOfBirth: row.date_of_birth,
        gender: row.gender,
        emergencyContact: row.emergency_contact,
        insuranceInfo: row.insurance_info,
        createdAt: row.patient_created_at,
        updatedAt: row.patient_updated_at,
        user: {
          id: row.user_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          phone: row.phone,
          roles: row.roles,
          isActive: row.is_active,
          createdAt: row.user_created_at,
          updatedAt: row.user_updated_at,
        }
      };
    } catch (error) {
      logger.error('Failed to get patient with user:', error);
      throw createError('Failed to get patient details', 500, 'PATIENT_LOOKUP_FAILED');
    }
  }

  private mapRowToPatient(row: any): Patient {
    return {
      id: row.id,
      userId: row.user_id,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      emergencyContact: row.emergency_contact,
      insuranceInfo: row.insurance_info,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}