import { Doctor, Appointment } from '../store/slices/appointmentSlice';
import { MedicalCondition, HealthMetrics } from '../store/slices/patientSlice';
import { ChatRoom, Message } from '../store/slices/chatSlice';

export const mockDoctors: Doctor[] = [
  {
    id: 'doc1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    rating: 4.8,
    experience: 12,
    consultationFee: 150,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    availability: ['2025-07-25', '2025-07-26', '2025-07-28'],
  },
  {
    id: 'doc2',
    name: 'Dr. Michael Chen',
    specialty: 'Endocrinologist',
    rating: 4.9,
    experience: 15,
    consultationFee: 180,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
    availability: ['2025-07-24', '2025-07-25', '2025-07-27'],
  },
  {
    id: 'doc3',
    name: 'Dr. Emily Davis',
    specialty: 'General Physician',
    rating: 4.7,
    experience: 8,
    consultationFee: 120,
    avatar: 'https://images.unsplash.com/photo-1594824475317-29bb4b8b2b8e?w=150',
    availability: ['2025-07-23', '2025-07-24', '2025-07-26'],
  },
];

export const mockPatientData = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+1 (555) 123-4567',
  dateOfBirth: '1990-05-15',
  healthMetrics: {
    bmi: 24.5,
    heartRate: 72,
    bloodPressure: '120/80',
    weight: 75,
    height: 175,
  } as HealthMetrics,
  conditions: [
    {
      id: '1',
      name: 'Hypertension',
      severity: 'medium' as const,
      diagnosedDate: '2023-01-15',
    },
    {
      id: '2',
      name: 'Type 2 Diabetes',
      severity: 'high' as const,
      diagnosedDate: '2022-08-20',
    },
  ] as MedicalCondition[],
};

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    date: '2025-07-25',
    time: '10:00 AM',
    status: 'scheduled',
    type: 'video',
    notes: 'Follow-up consultation',
  },
  {
    id: '2',
    doctorId: 'doc2',
    doctorName: 'Dr. Michael Chen',
    specialty: 'Endocrinologist',
    date: '2025-07-20',
    time: '2:30 PM',
    status: 'completed',
    type: 'in-person',
    notes: 'Diabetes management',
  },
];

export const mockChatRooms: ChatRoom[] = [
  {
    id: '1',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah Johnson',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    lastMessage: 'Your test results look good. Let me know if you have any questions.',
    lastMessageTime: '2025-07-22T10:30:00Z',
    unreadCount: 2,
    isActive: true,
  },
  {
    id: '2',
    doctorId: 'doc2',
    doctorName: 'Dr. Michael Chen',
    doctorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
    lastMessage: 'Please continue taking your medication as prescribed.',
    lastMessageTime: '2025-07-21T15:45:00Z',
    unreadCount: 0,
    isActive: false,
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'doc1',
    senderName: 'Dr. Sarah Johnson',
    content: 'Hello! I hope you\'re doing well. I wanted to follow up on your recent visit.',
    timestamp: '2025-07-22T09:00:00Z',
    type: 'text',
    isFromDoctor: true,
  },
  {
    id: '2',
    senderId: 'patient1',
    senderName: 'John Doe',
    content: 'Hi Dr. Johnson! I\'m feeling much better, thank you. The medication is working well.',
    timestamp: '2025-07-22T09:15:00Z',
    type: 'text',
    isFromDoctor: false,
  },
];