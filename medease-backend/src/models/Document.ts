import { Pool } from 'pg';
import { Document, DocumentCategory } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class DocumentModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(documentData: {
    patientId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: DocumentCategory;
    uploadPath: string;
    description?: string;
  }): Promise<Document> {
    const {
      patientId,
      filename,
      originalName,
      mimeType,
      size,
      category,
      uploadPath,
      description
    } = documentData;

    try {
      const query = `
        INSERT INTO documents (patient_id, filename, original_name, mime_type, size, category, upload_path, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, patient_id, filename, original_name, mime_type, size, category, upload_path, description, uploaded_at, created_at, updated_at
      `;

      const values = [patientId, filename, originalName, mimeType, size, category, uploadPath, description];
      const result = await this.pool.query(query, values);

      const document = this.mapRowToDocument(result.rows[0]);
      logger.info(`Document created for patient: ${patientId}`);
      
      return document;
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('Patient not found', 404, 'PATIENT_NOT_FOUND');
      }
      logger.error('Failed to create document:', error);
      throw createError('Failed to create document', 500, 'DOCUMENT_CREATION_FAILED');
    }
  }

  async findByPatientId(patientId: string, options?: {
    category?: DocumentCategory;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Document[]> {
    try {
      let query = `
        SELECT id, patient_id, filename, original_name, mime_type, size, category, upload_path, description, uploaded_at, created_at, updated_at
        FROM documents
        WHERE patient_id = $1
      `;
      
      const values: any[] = [patientId];
      let paramCount = 2;

      if (options?.category) {
        query += ` AND category = $${paramCount++}`;
        values.push(options.category);
      }

      if (options?.search) {
        query += ` AND (LOWER(original_name) LIKE LOWER($${paramCount++}) OR LOWER(description) LIKE LOWER($${paramCount++}))`;
        values.push(`%${options.search}%`);
        values.push(`%${options.search}%`);
      }

      query += ` ORDER BY uploaded_at DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
      }

      if (options?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(options.offset);
      }

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToDocument(row));
    } catch (error) {
      logger.error('Failed to find documents by patient ID:', error);
      throw createError('Failed to find documents', 500, 'DOCUMENTS_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<Document | null> {
    try {
      const query = `
        SELECT id, patient_id, filename, original_name, mime_type, size, category, upload_path, description, uploaded_at, created_at, updated_at
        FROM documents
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDocument(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find document by ID:', error);
      throw createError('Failed to find document', 500, 'DOCUMENT_LOOKUP_FAILED');
    }
  }

  async update(id: string, updates: {
    category?: DocumentCategory;
    description?: string;
  }): Promise<Document> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.category !== undefined) {
        fields.push(`category = $${paramCount++}`);
        values.push(updates.category);
      }

      if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }

      if (fields.length === 0) {
        throw createError('No fields to update', 400, 'NO_UPDATES_PROVIDED');
      }

      values.push(id);

      const query = `
        UPDATE documents
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, patient_id, filename, original_name, mime_type, size, category, upload_path, description, uploaded_at, created_at, updated_at
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      const document = this.mapRowToDocument(result.rows[0]);
      logger.info(`Document updated: ${id}`);
      
      return document;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to update document:', error);
      throw createError('Failed to update document', 500, 'DOCUMENT_UPDATE_FAILED');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `DELETE FROM documents WHERE id = $1 RETURNING upload_path`;
      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
      }

      logger.info(`Document deleted: ${id}`);
      
      // Return the upload path so the file can be deleted from storage
      return result.rows[0].upload_path;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to delete document:', error);
      throw createError('Failed to delete document', 500, 'DOCUMENT_DELETE_FAILED');
    }
  }

  async getDocumentStats(patientId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          category,
          COUNT(*) as count,
          SUM(size) as total_size
        FROM documents
        WHERE patient_id = $1
        GROUP BY category
        ORDER BY category
      `;

      const result = await this.pool.query(query, [patientId]);
      
      return result.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count),
        totalSize: parseInt(row.total_size)
      }));
    } catch (error) {
      logger.error('Failed to get document stats:', error);
      throw createError('Failed to get document stats', 500, 'DOCUMENT_STATS_FAILED');
    }
  }

  async checkPatientOwnership(documentId: string, patientId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM documents
        WHERE id = $1 AND patient_id = $2
      `;

      const result = await this.pool.query(query, [documentId, patientId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      logger.error('Failed to check document ownership:', error);
      return false;
    }
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      patientId: row.patient_id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: parseInt(row.size),
      category: row.category as DocumentCategory,
      uploadPath: row.upload_path,
      description: row.description,
      uploadedAt: row.uploaded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}