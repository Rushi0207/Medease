import { Pool } from 'pg';
import { Appointment, AppointmentType, AppointmentStatus } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(appointmentData: {
    patientId: string;
    doctorId: string;
    appointmentDate: Date;
    appointmentTime: string;
    type: AppointmentType;
    notes?: string;
    patientNotes?: string;
    consultationFee: number;
  }): Promise<Appointment> {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      type,
      notes,
      patientNotes,
      consultationFee
    } = appointmentData;

    try {
      // Generate meeting link for video appointments
      let meetingLink = null;
      let meetingId = null;
      
      if (type === AppointmentType.VIDEO) {
        meetingId = uuidv4();
        meetingLink = `https://meet.medease.com/room/${meetingId}`;
      }

      const query = `
        INSERT INTO appointments (
          patient_id, doctor_id, appointment_date, appointment_time, type, 
          notes, patient_notes, consultation_fee, meeting_link, meeting_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, patient_id, doctor_id, appointment_date, appointment_time, type, status, 
                  notes, patient_notes, doctor_notes, prescription, consultation_fee, is_paid, 
                  meeting_link, meeting_id, created_at, updated_at
      `;

      const values = [
        patientId, doctorId, appointmentDate, appointmentTime, type,
        notes, patientNotes, consultationFee, meetingLink, meetingId
      ];
      
      const result = await this.pool.query(query, values);

      const appointment = this.mapRowToAppointment(result.rows[0]);
      logger.info(`Appointment created: ${appointment.id}`);
      
      return appointment;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation (double booking)
        throw createError('Doctor is not available at this time', 409, 'APPOINTMENT_CONFLICT');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('Patient or doctor not found', 404, 'PATIENT_OR_DOCTOR_NOT_FOUND');
      }
      logger.error('Failed to create appointment:', error);
      throw createError('Failed to create appointment', 500, 'APPOINTMENT_CREATION_FAILED');
    }
  }

  async findByPatientId(patientId: string, options?: {
    status?: AppointmentStatus;
    upcoming?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Appointment[]> {
    try {
      let query = `
        SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.type, a.status,
               a.notes, a.patient_notes, a.doctor_notes, a.prescription, a.consultation_fee, a.is_paid,
               a.meeting_link, a.meeting_id, a.created_at, a.updated_at,
               d.specialty, u.first_name as doctor_first_name, u.last_name as doctor_last_name
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE a.patient_id = $1
      `;
      
      const values: any[] = [patientId];
      let paramCount = 2;

      if (options?.status) {
        query += ` AND a.status = $${paramCount++}`;
        values.push(options.status);
      }

      if (options?.upcoming) {
        query += ` AND (a.appointment_date > CURRENT_DATE OR (a.appointment_date = CURRENT_DATE AND a.appointment_time > CURRENT_TIME))`;
      }

      query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
      }

      if (options?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(options.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToAppointmentWithDoctor(row));
    } catch (error) {
      logger.error('Failed to find appointments by patient ID:', error);
      throw createError('Failed to find appointments', 500, 'APPOINTMENTS_LOOKUP_FAILED');
    }
  }

  async findByDoctorId(doctorId: string, options?: {
    status?: AppointmentStatus;
    date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Appointment[]> {
    try {
      let query = `
        SELECT a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.type, a.status,
               a.notes, a.patient_notes, a.doctor_notes, a.prescription, a.consultation_fee, a.is_paid,
               a.meeting_link, a.meeting_id, a.created_at, a.updated_at,
               u.first_name as patient_first_name, u.last_name as patient_last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = $1
      `;
      
      const values: any[] = [doctorId];
      let paramCount = 2;

      if (options?.status) {
        query += ` AND a.status = $${paramCount++}`;
        values.push(options.status);
      }

      if (options?.date) {
        query += ` AND a.appointment_date = $${paramCount++}`;
        values.push(options.date);
      }

      query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
      }

      if (options?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(options.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToAppointmentWithPatient(row));
    } catch (error) {
      logger.error('Failed to find appointments by doctor ID:', error);
      throw createError('Failed to find appointments', 500, 'APPOINTMENTS_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<Appointment | null> {
    try {
      const query = `
        SELECT id, patient_id, doctor_id, appointment_date, appointment_time, type, status,
               notes, patient_notes, doctor_notes, prescription, consultation_fee, is_paid,
               meeting_link, meeting_id, created_at, updated_at
        FROM appointments
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAppointment(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find appointment by ID:', error);
      throw createError('Failed to find appointment', 500, 'APPOINTMENT_LOOKUP_FAILED');
    }
  }

  async updateStatus(id: string, status: AppointmentStatus, doctorNotes?: string): Promise<Appointment> {
    try {
      const query = `
        UPDATE appointments
        SET status = $1, doctor_notes = COALESCE($2, doctor_notes)
        WHERE id = $3
        RETURNING id, patient_id, doctor_id, appointment_date, appointment_time, type, status,
                  notes, patient_notes, doctor_notes, prescription, consultation_fee, is_paid,
                  meeting_link, meeting_id, created_at, updated_at
      `;

      const result = await this.pool.query(query, [status, doctorNotes, id]);

      if (result.rows.length === 0) {
        throw createError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
      }

      const appointment = this.mapRowToAppointment(result.rows[0]);
      logger.info(`Appointment status updated: ${id} -> ${status}`);
      
      return appointment;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update appointment status:', error);
      throw createError('Failed to update appointment status', 500, 'APPOINTMENT_UPDATE_FAILED');
    }
  }

  async addPrescription(id: string, prescription: string): Promise<Appointment> {
    try {
      const query = `
        UPDATE appointments
        SET prescription = $1
        WHERE id = $2
        RETURNING id, patient_id, doctor_id, appointment_date, appointment_time, type, status,
                  notes, patient_notes, doctor_notes, prescription, consultation_fee, is_paid,
                  meeting_link, meeting_id, created_at, updated_at
      `;

      const result = await this.pool.query(query, [prescription, id]);

      if (result.rows.length === 0) {
        throw createError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
      }

      const appointment = this.mapRowToAppointment(result.rows[0]);
      logger.info(`Prescription added to appointment: ${id}`);
      
      return appointment;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to add prescription:', error);
      throw createError('Failed to add prescription', 500, 'PRESCRIPTION_ADD_FAILED');
    }
  }

  async markAsPaid(id: string): Promise<void> {
    try {
      const query = `
        UPDATE appointments
        SET is_paid = true
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('Appointment not found', 404, 'APPOINTMENT_NOT_FOUND');
      }

      logger.info(`Appointment marked as paid: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to mark appointment as paid:', error);
      throw createError('Failed to mark appointment as paid', 500, 'PAYMENT_UPDATE_FAILED');
    }
  }

  async checkDoctorAvailability(doctorId: string, appointmentDate: Date, appointmentTime: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM appointments
        WHERE doctor_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3
        AND status NOT IN ('CANCELLED')
      `;

      const result = await this.pool.query(query, [doctorId, appointmentDate, appointmentTime]);
      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      logger.error('Failed to check doctor availability:', error);
      throw createError('Failed to check doctor availability', 500, 'AVAILABILITY_CHECK_FAILED');
    }
  }

  private mapRowToAppointment(row: any): Appointment {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      type: row.type as AppointmentType,
      status: row.status as AppointmentStatus,
      notes: row.notes,
      patientNotes: row.patient_notes,
      doctorNotes: row.doctor_notes,
      prescription: row.prescription,
      consultationFee: parseFloat(row.consultation_fee),
      isPaid: row.is_paid,
      meetingLink: row.meeting_link,
      meetingId: row.meeting_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToAppointmentWithDoctor(row: any): any {
    const appointment = this.mapRowToAppointment(row);
    return {
      ...appointment,
      doctor: {
        specialty: row.specialty,
        user: {
          firstName: row.doctor_first_name,
          lastName: row.doctor_last_name,
        }
      }
    };
  }

  private mapRowToAppointmentWithPatient(row: any): any {
    const appointment = this.mapRowToAppointment(row);
    return {
      ...appointment,
      patient: {
        user: {
          firstName: row.patient_first_name,
          lastName: row.patient_last_name,
        }
      }
    };
  }
}