import { Pool } from 'pg';
import { HealthMetrics } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class HealthMetricsModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(metricsData: {
    patientId: string;
    weight?: number;
    height?: number;
    heartRate?: number;
    bloodPressure?: string;
    recordedAt?: Date;
  }): Promise<HealthMetrics> {
    const {
      patientId,
      weight,
      height,
      heartRate,
      bloodPressure,
      recordedAt = new Date()
    } = metricsData;

    try {
      const query = `
        INSERT INTO health_metrics (patient_id, weight, height, heart_rate, blood_pressure, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, patient_id, weight, height, bmi, heart_rate, blood_pressure, recorded_at, created_at, updated_at
      `;

      const values = [patientId, weight, height, heartRate, bloodPressure, recordedAt];
      const result = await this.pool.query(query, values);

      const metrics = this.mapRowToHealthMetrics(result.rows[0]);
      logger.info(`Health metrics created for patient: ${patientId}`);
      
      return metrics;
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      }
      logger.error('Failed to create health metrics:', error);
      throw createError('Failed to create health metrics', 500, 'HEALTH_METRICS_CREATION_FAILED');
    }
  }

  async findByPatientId(patientId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<HealthMetrics[]> {
    try {
      let query = `
        SELECT id, patient_id, weight, height, bmi, heart_rate, blood_pressure, recorded_at, created_at, updated_at
        FROM health_metrics
        WHERE patient_id = $1
      `;
      
      const values: any[] = [patientId];
      let paramCount = 2;

      if (options?.startDate) {
        query += ` AND recorded_at >= $${paramCount++}`;
        values.push(options.startDate);
      }

      if (options?.endDate) {
        query += ` AND recorded_at <= $${paramCount++}`;
        values.push(options.endDate);
      }

      query += ` ORDER BY recorded_at DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
      }

      if (options?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(options.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToHealthMetrics(row));
    } catch (error) {
      logger.error('Failed to find health metrics by patient ID:', error);
      throw createError('Failed to find health metrics', 500, 'HEALTH_METRICS_LOOKUP_FAILED');
    }
  }

  async findLatestByPatientId(patientId: string): Promise<HealthMetrics | null> {
    try {
      const query = `
        SELECT id, patient_id, weight, height, bmi, heart_rate, blood_pressure, recorded_at, created_at, updated_at
        FROM health_metrics
        WHERE patient_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1
      `;

      const result = await this.pool.query(query, [patientId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToHealthMetrics(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find latest health metrics:', error);
      throw createError('Failed to find latest health metrics', 500, 'HEALTH_METRICS_LOOKUP_FAILED');
    }
  }

  async update(id: string, updates: {
    weight?: number;
    height?: number;
    heartRate?: number;
    bloodPressure?: string;
    recordedAt?: Date;
  }): Promise<HealthMetrics> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.weight !== undefined) {
        fields.push(`weight = $${paramCount++}`);
        values.push(updates.weight);
      }

      if (updates.height !== undefined) {
        fields.push(`height = $${paramCount++}`);
        values.push(updates.height);
      }

      if (updates.heartRate !== undefined) {
        fields.push(`heart_rate = $${paramCount++}`);
        values.push(updates.heartRate);
      }

      if (updates.bloodPressure !== undefined) {
        fields.push(`blood_pressure = $${paramCount++}`);
        values.push(updates.bloodPressure);
      }

      if (updates.recordedAt !== undefined) {
        fields.push(`recorded_at = $${paramCount++}`);
        values.push(updates.recordedAt);
      }

      if (fields.length === 0) {
        throw createError('No fields to update', 400, 'NO_UPDATES_PROVIDED');
      }

      values.push(id);

      const query = `
        UPDATE health_metrics
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, patient_id, weight, height, bmi, heart_rate, blood_pressure, recorded_at, created_at, updated_at
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw createError('Health metrics not found', 404, 'HEALTH_METRICS_NOT_FOUND');
      }

      const metrics = this.mapRowToHealthMetrics(result.rows[0]);
      logger.info(`Health metrics updated: ${id}`);
      
      return metrics;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update health metrics:', error);
      throw createError('Failed to update health metrics', 500, 'HEALTH_METRICS_UPDATE_FAILED');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `DELETE FROM health_metrics WHERE id = $1`;
      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('Health metrics not found', 404, 'HEALTH_METRICS_NOT_FOUND');
      }

      logger.info(`Health metrics deleted: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to delete health metrics:', error);
      throw createError('Failed to delete health metrics', 500, 'HEALTH_METRICS_DELETE_FAILED');
    }
  }

  async getHealthTrends(patientId: string, days: number = 30): Promise<any> {
    try {
      const query = `
        SELECT 
          DATE(recorded_at) as date,
          AVG(weight) as avg_weight,
          AVG(height) as avg_height,
          AVG(bmi) as avg_bmi,
          AVG(heart_rate) as avg_heart_rate,
          COUNT(*) as measurements_count
        FROM health_metrics
        WHERE patient_id = $1 
        AND recorded_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(recorded_at)
        ORDER BY date DESC
      `;

      const result = await this.pool.query(query, [patientId]);
      
      return result.rows.map(row => ({
        date: row.date,
        avgWeight: row.avg_weight ? parseFloat(row.avg_weight) : null,
        avgHeight: row.avg_height ? parseFloat(row.avg_height) : null,
        avgBmi: row.avg_bmi ? parseFloat(row.avg_bmi) : null,
        avgHeartRate: row.avg_heart_rate ? parseFloat(row.avg_heart_rate) : null,
        measurementsCount: parseInt(row.measurements_count)
      }));
    } catch (error) {
      logger.error('Failed to get health trends:', error);
      throw createError('Failed to get health trends', 500, 'HEALTH_TRENDS_FAILED');
    }
  }

  private mapRowToHealthMetrics(row: any): HealthMetrics {
    return {
      id: row.id,
      patientId: row.patient_id,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      height: row.height ? parseFloat(row.height) : undefined,
      bmi: row.bmi ? parseFloat(row.bmi) : undefined,
      heartRate: row.heart_rate,
      bloodPressure: row.blood_pressure,
      recordedAt: row.recorded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}