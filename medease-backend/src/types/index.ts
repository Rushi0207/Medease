// User and Authentication Types
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: UserRole[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth?: Date;
  gender?: string;
  emergencyContact?: string;
  insuranceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  rating: number;
  avatar?: string;
  bio?: string;
  education?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Health and Medical Types
export interface HealthMetrics {
  id: string;
  patientId: string;
  weight?: number;
  height?: number;
  bmi?: number;
  heartRate?: number;
  bloodPressure?: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalCondition {
  id: string;
  patientId: string;
  name: string;
  severity: ConditionSeverity;
  diagnosedDate: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConditionSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  patientNotes?: string;
  doctorNotes?: string;
  prescription?: string;
  consultationFee: number;
  isPaid: boolean;
  meetingLink?: string;
  meetingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AppointmentType {
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
}

// Chat Types
export interface ChatRoom {
  id: string;
  patientId: string;
  doctorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

// Document Types
export interface Document {
  id: string;
  patientId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  uploadPath: string;
  description?: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentCategory {
  LAB_RESULTS = 'LAB_RESULTS',
  PRESCRIPTIONS = 'PRESCRIPTIONS',
  SCANS = 'SCANS',
  REPORTS = 'REPORTS',
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

// JWT Payload Type
export interface JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}