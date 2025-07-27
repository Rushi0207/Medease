const API_BASE_URL = 'http://localhost:8080/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Create headers with auth token
const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(!endpoint.includes('/auth/')),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    dateOfBirth?: string;
    gender?: string;
    roles?: string[];
  }) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// Patient API
export const patientAPI = {
  getProfile: async () => {
    return apiRequest('/patients/profile');
  },

  updateProfile: async (profileData: any) => {
    return apiRequest('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  addCondition: async (condition: any) => {
    return apiRequest('/patients/conditions', {
      method: 'POST',
      body: JSON.stringify(condition),
    });
  },

  updateHealthMetrics: async (healthMetrics: {
    weight?: number;
    height?: number;
    heartRate?: number;
    bloodPressure?: string;
  }) => {
    return apiRequest('/patients/health-metrics', {
      method: 'PUT',
      body: JSON.stringify(healthMetrics),
    });
  },
};

// Doctor API
export const doctorAPI = {
  getAllDoctors: async () => {
    return apiRequest('/doctors/all');
  },

  getAvailableDoctors: async () => {
    return apiRequest('/doctors/available');
  },

  searchDoctors: async (query: string) => {
    return apiRequest(`/doctors/search?query=${encodeURIComponent(query)}`);
  },

  getDoctorById: async (id: string) => {
    return apiRequest(`/doctors/${id}`);
  },

  getDoctorsBySpecialty: async (specialty: string) => {
    return apiRequest(`/doctors/specialty/${encodeURIComponent(specialty)}`);
  },
};

// Appointment API
export const appointmentAPI = {
  bookAppointment: async (appointmentData: {
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    type: 'VIDEO' | 'IN_PERSON';
    notes?: string;
    patientNotes?: string;
  }) => {
    return apiRequest('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  getPatientAppointments: async () => {
    return apiRequest('/appointments/patient');
  },

  getUpcomingPatientAppointments: async () => {
    return apiRequest('/appointments/patient/upcoming');
  },

  getAppointmentById: async (id: string) => {
    return apiRequest(`/appointments/${id}`);
  },

  cancelAppointment: async (id: string) => {
    return apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Chat API (placeholder for future implementation)
export const chatAPI = {
  getChatRooms: async () => {
    // This would be implemented when WebSocket chat is added
    return [];
  },

  getMessages: async (chatRoomId: string) => {
    // This would be implemented when WebSocket chat is added
    return [];
  },

  sendMessage: async (messageData: any) => {
    // This would be implemented when WebSocket chat is added
    return {};
  },
};

export default {
  auth: authAPI,
  patient: patientAPI,
  doctor: doctorAPI,
  appointment: appointmentAPI,
  chat: chatAPI,
};