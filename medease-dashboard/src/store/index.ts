import { configureStore } from '@reduxjs/toolkit';
import patientReducer from './slices/patientSlice';
import appointmentReducer from './slices/appointmentSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    patient: patientReducer,
    appointments: appointmentReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;