import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface HealthMetrics {
  bmi: number;
  heartRate: number;
  bloodPressure: string;
  weight: number;
  height: number;
}

export interface MedicalCondition {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  diagnosedDate: string;
}

export interface PatientState {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  healthMetrics: HealthMetrics;
  conditions: MedicalCondition[];
  isLoading: boolean;
}

const initialState: PatientState = {
  id: '',
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  healthMetrics: {
    bmi: 0,
    heartRate: 0,
    bloodPressure: '',
    weight: 0,
    height: 0,
  },
  conditions: [],
  isLoading: false,
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setPatientData: (state, action: PayloadAction<Partial<PatientState>>) => {
      return { ...state, ...action.payload };
    },
    updateHealthMetrics: (state, action: PayloadAction<Partial<HealthMetrics>>) => {
      state.healthMetrics = { ...state.healthMetrics, ...action.payload };
    },
    addCondition: (state, action: PayloadAction<MedicalCondition>) => {
      state.conditions.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setPatientData, updateHealthMetrics, addCondition, setLoading } = patientSlice.actions;
export default patientSlice.reducer;