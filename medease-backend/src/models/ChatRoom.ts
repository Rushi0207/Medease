import { Pool } from 'pg';
import { ChatRoom, Message, MessageType } from '../types';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ChatRoomModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(chatRoomData: {
    patientId: string;
    doctorId: string;
  }): Promise<ChatRoom> {
    const { patientId, doctorId } = chatRoomData;

    try {
      const query = `
        INSERT INTO chat_rooms (patient_id, doctor_id)
        VALUES ($1, $2)
        RETURNING id, patient_id, doctor_id, is_active, created_at, updated_at
      `;

      const values = [patientId, doctorId];
      const result = await this.pool.query(query, values);

      const chatRoom = this.mapRowToChatRoom(result.rows[0]);
      logger.info(`Chat room created: ${chatRoom.id}`);
      
      return chatRoom;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw createError('Chat room already exists between this patient and doctor', 409, 'CHAT_ROOM_EXISTS');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('Patient or doctor not found', 404, 'PATIENT_OR_DOCTOR_NOT_FOUND');
      }
      logger.error('Failed to create chat room:', error);
      throw createError('Failed to create chat room', 500, 'CHAT_ROOM_CREATION_FAILED');
    }
  }

  async findOrCreate(patientId: string, doctorId: string): Promise<ChatRoom> {
    try {
      // First try to find existing chat room
      const existingRoom = await this.findByPatientAndDoctor(patientId, doctorId);
      if (existingRoom) {
        return existingRoom;
      }

      // Create new chat room if it doesn't exist
      return await this.create({ patientId, doctorId });
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to find or create chat room:', error);
      throw createError('Failed to find or create chat room', 500, 'CHAT_ROOM_FIND_OR_CREATE_FAILED');
    }
  }

  async findByPatientId(patientId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          cr.id, cr.patient_id, cr.doctor_id, cr.is_active, cr.created_at, cr.updated_at,
          d.specialty, d.avatar,
          u.first_name as doctor_first_name, u.last_name as doctor_last_name,
          (SELECT content FROM messages WHERE chat_room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE chat_room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
          (SELECT COUNT(*) FROM messages WHERE chat_room_id = cr.id AND is_read = false AND sender_id != (SELECT user_id FROM patients WHERE id = $1)) as unread_count
        FROM chat_rooms cr
        JOIN doctors d ON cr.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE cr.patient_id = $1 AND cr.is_active = true
        ORDER BY COALESCE((SELECT created_at FROM messages WHERE chat_room_id = cr.id ORDER BY created_at DESC LIMIT 1), cr.created_at) DESC
      `;

      const result = await this.pool.query(query, [patientId]);
      
      return result.rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        doctorName: `${row.doctor_first_name} ${row.doctor_last_name}`,
        doctorAvatar: row.avatar,
        specialty: row.specialty,
        lastMessage: row.last_message,
        lastMessageTime: row.last_message_time,
        unreadCount: parseInt(row.unread_count || '0'),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      logger.error('Failed to find chat rooms by patient ID:', error);
      throw createError('Failed to find chat rooms', 500, 'CHAT_ROOMS_LOOKUP_FAILED');
    }
  }

  async findByDoctorId(doctorId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          cr.id, cr.patient_id, cr.doctor_id, cr.is_active, cr.created_at, cr.updated_at,
          u.first_name as patient_first_name, u.last_name as patient_last_name,
          (SELECT content FROM messages WHERE chat_room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages WHERE chat_room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
          (SELECT COUNT(*) FROM messages WHERE chat_room_id = cr.id AND is_read = false AND sender_id != (SELECT user_id FROM doctors WHERE id = $1)) as unread_count
        FROM chat_rooms cr
        JOIN patients p ON cr.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE cr.doctor_id = $1 AND cr.is_active = true
        ORDER BY COALESCE((SELECT created_at FROM messages WHERE chat_room_id = cr.id ORDER BY created_at DESC LIMIT 1), cr.created_at) DESC
      `;

      const result = await this.pool.query(query, [doctorId]);
      
      return result.rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        patientName: `${row.patient_first_name} ${row.patient_last_name}`,
        lastMessage: row.last_message,
        lastMessageTime: row.last_message_time,
        unreadCount: parseInt(row.unread_count || '0'),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      logger.error('Failed to find chat rooms by doctor ID:', error);
      throw createError('Failed to find chat rooms', 500, 'CHAT_ROOMS_LOOKUP_FAILED');
    }
  }

  async findByPatientAndDoctor(patientId: string, doctorId: string): Promise<ChatRoom | null> {
    try {
      const query = `
        SELECT id, patient_id, doctor_id, is_active, created_at, updated_at
        FROM chat_rooms
        WHERE patient_id = $1 AND doctor_id = $2
      `;

      const result = await this.pool.query(query, [patientId, doctorId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToChatRoom(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find chat room by patient and doctor:', error);
      throw createError('Failed to find chat room', 500, 'CHAT_ROOM_LOOKUP_FAILED');
    }
  }

  async findById(id: string): Promise<ChatRoom | null> {
    try {
      const query = `
        SELECT id, patient_id, doctor_id, is_active, created_at, updated_at
        FROM chat_rooms
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToChatRoom(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find chat room by ID:', error);
      throw createError('Failed to find chat room', 500, 'CHAT_ROOM_LOOKUP_FAILED');
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const query = `
        UPDATE chat_rooms
        SET is_active = false
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);

      if (result.rowCount === 0) {
        throw createError('Chat room not found', 404, 'CHAT_ROOM_NOT_FOUND');
      }

      logger.info(`Chat room deactivated: ${id}`);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to deactivate chat room:', error);
      throw createError('Failed to deactivate chat room', 500, 'CHAT_ROOM_DEACTIVATION_FAILED');
    }
  }

  private mapRowToChatRoom(row: any): ChatRoom {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export class MessageModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(messageData: {
    chatRoomId: string;
    senderId: string;
    content: string;
    type?: MessageType;
  }): Promise<Message> {
    const { chatRoomId, senderId, content, type = MessageType.TEXT } = messageData;

    try {
      const query = `
        INSERT INTO messages (chat_room_id, sender_id, content, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id, chat_room_id, sender_id, content, type, is_read, created_at, updated_at
      `;

      const values = [chatRoomId, senderId, content, type];
      const result = await this.pool.query(query, values);

      const message = this.mapRowToMessage(result.rows[0]);
      logger.info(`Message created in chat room: ${chatRoomId}`);
      
      return message;
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw createError('Chat room or sender not found', 404, 'CHAT_ROOM_OR_SENDER_NOT_FOUND');
      }
      logger.error('Failed to create message:', error);
      throw createError('Failed to create message', 500, 'MESSAGE_CREATION_FAILED');
    }
  }

  async findByChatRoomId(chatRoomId: string, options?: {
    limit?: number;
    offset?: number;
    before?: Date;
  }): Promise<Message[]> {
    try {
      let query = `
        SELECT m.id, m.chat_room_id, m.sender_id, m.content, m.type, m.is_read, m.created_at, m.updated_at,
               u.first_name, u.last_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_room_id = $1
      `;
      
      const values: any[] = [chatRoomId];
      let paramCount = 2;

      if (options?.before) {
        query += ` AND m.created_at < $${paramCount++}`;
        values.push(options.before);
      }

      query += ` ORDER BY m.created_at DESC`;

      if (options?.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(options.limit);
      }

      if (options?.offset) {
        query += ` OFFSET $${paramCount++}`;
        values.push(options.offset);
      }

      const result = await this.pool.query(query, values);
      
      return result.rows.map(row => ({
        ...this.mapRowToMessage(row),
        senderName: `${row.first_name} ${row.last_name}`
      })).reverse(); // Reverse to get chronological order
    } catch (error) {
      logger.error('Failed to find messages by chat room ID:', error);
      throw createError('Failed to find messages', 500, 'MESSAGES_LOOKUP_FAILED');
    }
  }

  async markAsRead(chatRoomId: string, userId: string): Promise<void> {
    try {
      const query = `
        UPDATE messages
        SET is_read = true
        WHERE chat_room_id = $1 AND sender_id != $2 AND is_read = false
      `;

      await this.pool.query(query, [chatRoomId, userId]);
      logger.info(`Messages marked as read in chat room: ${chatRoomId} by user: ${userId}`);
    } catch (error) {
      logger.error('Failed to mark messages as read:', error);
      throw createError('Failed to mark messages as read', 500, 'MARK_READ_FAILED');
    }
  }

  async getUnreadCount(chatRoomId: string, userId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM messages
        WHERE chat_room_id = $1 AND sender_id != $2 AND is_read = false
      `;

      const result = await this.pool.query(query, [chatRoomId, userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw createError('Failed to get unread count', 500, 'UNREAD_COUNT_FAILED');
    }
  }

  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      chatRoomId: row.chat_room_id,
      senderId: row.sender_id,
      content: row.content,
      type: row.type as MessageType,
      isRead: row.is_read,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}