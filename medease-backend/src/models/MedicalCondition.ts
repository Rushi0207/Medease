import { Pool } from 'pg';
import { MedicalCondition, ConditionSeverity } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class MedicalConditionModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(conditionData: {
    patientId: string;
    name: string;
    severity: ConditionSeverity;
    diagnosedDate: Date;
    notes?: string;
  }): Promise<MedicalCondition> {
    const {
      patientId,
      name,
      severity,
      diagnosedDate,
      notes
    } = conditionData;

    try {
      const query = `
        INSERT INTO medical_conditions (patient_id, name, severity, diagnosed_date, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, patient_id, name, severity, diagnosed_date, notes, is_active, created_at, updated_at
      `;

      const values = [patientId, name, severity, diagnosedDate, notes];
      const result = await this.pool.query(query, values);

      const condition = this.mapRowToMedicalCondition(result.rows[0]);
      logger.info(`Medical condition created for patient: ${patientId}`);
      
      return condition;
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      }
      logger.error('Failed to create medical condition:', error);
      throw createError('Failed to create medical condition', 500, 'MEDICAL_CONDITION_CREATION_FAILED');
    }
  }

  async findByPatientId(patientId: string, options?: {
    isActive?: boolean;
    severity?: ConditionSeverity;
    limit?: number;
    offset?: number;
  }): Promise<MedicalCondition[]> {
    try {
      let query = `
        SELECT id, patient_id, name, severity, diagnosed_date, notes, is_active, created_at, updated_at
        FROM medical_conditions
        WHERE patient_id = $1
      `;
      
      const values: any[] = [patientId];
      let paramCount = 2;

      if (options?.isActive !== undefined) {
        query += ` AND is_active = $${paramCount++}`;
        values.push(options.isActive);
      }

      if (options?.severity) {
        query += ` AND severity = $${paramCount++}`;
        values.push(options.severity);
      }

      query += ` ORDER BY diagnosed_date DESC, created_at DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
      }

      if (options?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(options.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToMedicalCondition(row));
    } catch (error) {
      logger.error('Failed to find medical conditions by patient ID:', error);
      throw createError('Failed to find medical conditions', 500, 'MEDICAL_CONDITIONS_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<MedicalCondition | null> {
    try {
      const query = `
        SELECT id, patient_id, name, severity, diagnosed_date, notes, is_active, created_at, updated_at
        FROM medical_conditions
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToMedicalCondition(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find medical condition by ID:', error);
      throw createError('Failed to find medical condition', 500, 'MEDICAL_CONDITION_LOOKUP_FAILED');
    }
  }

  async update(id: string, updates: {
    name?: string;
    severity?: ConditionSeverity;
    diagnosedDate?: Date;
    notes?: string;
    isActive?: boolean;
  }): Promise<MedicalCondition> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }

      if (updates.severity !== undefined) {
        fields.push(`severity = $${paramCount++}`);
        values.push(updates.severity);
      }

      if (updates.diagnosedDate !== undefined) {
        fields.push(`diagnosed_date = $${paramCount++}`);
        values.push(updates.diagnosedDate);
      }

      if (updates.notes !== undefined) {
        fields.push(`notes = $${paramCount++}`);
        values.push(updates.notes);
      }

      if (updates.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updates.isActive);
      }

      if (fields.length === 0) {
        throw createError('No fields to update', 400, 'NO_UPDATES_PROVIDED');
      }

      values.push(id);

      const query = `
        UPDATE medical_conditions
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, patient_id, name, severity, diagnosed_date, notes, is_active, created_at, updated_at
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw createError('Medical condition not found', 404, 'MEDICAL_CONDITION_NOT_FOUND');
      }

      const condition = this.mapRowToMedicalCondition(result.rows[0]);
      logger.info(`Medical condition updated: ${id}`);
      
      return condition;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update medical condition:', error);
      throw createError('Failed to update medical condition', 500, 'MEDICAL_CONDITION_UPDATE_FAILED');
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const query = `
        UPDATE medical_conditions
        SET is_active = false
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('Medical condition not found', 404, 'MEDICAL_CONDITION_NOT_FOUND');
      }

      logger.info(`Medical condition deactivated: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to deactivate medical condition:', error);
      throw createError('Failed to deactivate medical condition', 500, 'MEDICAL_CONDITION_DEACTIVATION_FAILED');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `DELETE FROM medical_conditions WHERE id = $1`;
      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('Medical condition not found', 404, 'MEDICAL_CONDITION_NOT_FOUND');
      }

      logger.info(`Medical condition deleted: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to delete medical condition:', error);
      throw createError('Failed to delete medical condition', 500, 'MEDICAL_CONDITION_DELETE_FAILED');
    }
  }

  async getConditionsSummary(patientId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          severity,
          COUNT(*) as count,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
        FROM medical_conditions
        WHERE patient_id = $1
        GROUP BY severity
        ORDER BY 
          CASE severity 
            WHEN 'HIGH' THEN 1 
            WHEN 'MEDIUM' THEN 2 
            WHEN 'LOW' THEN 3 
          END
      `;

      const result = await this.pool.query(query, [patientId]);
      
      return result.rows.map(row => ({
        severity: row.severity,
        totalCount: parseInt(row.count),
        activeCount: parseInt(row.active_count)
      }));
    } catch (error) {
      logger.error('Failed to get conditions summary:', error);
      throw createError('Failed to get conditions summary', 500, 'CONDITIONS_SUMMARY_FAILED');
    }
  }

  private mapRowToMedicalCondition(row: any): MedicalCondition {
    return {
      id: row.id,
      patientId: row.patient_id,
      name: row.name,
      severity: row.severity as ConditionSeverity,
      diagnosedDate: row.diagnosed_date,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}