import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  consultationFee: number;
  avatar: string;
  availability: string[];
}

export interface Appointment {
  id: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  // Backend fields
  appointmentDate?: string;
  appointmentTime?: string;
  // Legacy fields for backward compatibility
  date?: string;
  time?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'IN_PROGRESS' | 'scheduled' | 'completed' | 'cancelled';
  type: 'VIDEO' | 'IN_PERSON' | 'video' | 'in-person';
  notes?: string;
  patientNotes?: string;
  doctorNotes?: string;
  prescription?: string;
  consultationFee?: number;
  isPaid?: boolean;
  meetingLink?: string;
  meetingId?: string;
  doctor?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    specialty: string;
  };
}

export interface AppointmentState {
  doctors: Doctor[];
  appointments: Appointment[];
  selectedDoctor: Doctor | null;
  isLoading: boolean;
}

const initialState: AppointmentState = {
  doctors: [],
  appointments: [],
  selectedDoctor: null,
  isLoading: false,
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setDoctors: (state, action: PayloadAction<Doctor[]>) => {
      state.doctors = action.payload;
    },
    setAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.appointments = action.payload;
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload);
    },
    updateAppointment: (state, action: PayloadAction<{ id: string; updates: Partial<Appointment> }>) => {
      const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
      if (index !== -1) {
        state.appointments[index] = { ...state.appointments[index], ...action.payload.updates };
      }
    },
    selectDoctor: (state, action: PayloadAction<Doctor>) => {
      state.selectedDoctor = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setDoctors, 
  setAppointments, 
  addAppointment, 
  updateAppointment, 
  selectDoctor, 
  setLoading 
} = appointmentSlice.actions;
export default appointmentSlice.reducer;