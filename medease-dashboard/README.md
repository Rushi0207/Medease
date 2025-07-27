# MedEase - Patient Health Dashboard

A responsive and interactive healthcare dashboard for patients to track their health records, book appointments, and communicate with doctors.

## 🚀 Features

### 🩺 Patient Overview Dashboard

- Personal health summary with BMI, heart rate, blood pressure metrics
- Medical conditions tracking with severity indicators
- Quick action buttons for common tasks
- Recent appointments overview

### 📅 Appointment Booking System

- Doctor directory with search and filter functionality
- Detailed doctor profiles with ratings, experience, and fees
- Interactive appointment booking modal
- Support for both video and in-person consultations
- Date and time slot selection

### 💬 Telemedicine Chat Interface

- Real-time chat layout with doctors
- Chat room management with unread message indicators
- Message history and timestamps
- Online status indicators
- Voice and video call buttons (UI ready)

### 📂 Medical Reports Viewer

- Document upload with drag-and-drop functionality
- File type categorization (Lab Results, Prescriptions, Scans, Reports)
- Search and filter capabilities
- Document preview and download options

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Dashboard/          # Dashboard-specific components
│   ├── Appointments/       # Appointment booking components
│   ├── Chat/              # Chat interface components
│   ├── Reports/           # Medical reports components
│   ├── Layout/            # Layout and navigation
│   └── UI/                # Reusable UI components
├── pages/                 # Main page components
├── store/                 # Redux store and slices
├── hooks/                 # Custom React hooks
└── utils/                 # Utility functions and mock data
```

## 🎨 Design System

The dashboard uses a consistent design system with:

- **Primary Colors**: Blue (#3b82f6) for main actions
- **Status Colors**: Green (success), Yellow (warning), Red (error)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent padding and margins using Tailwind's spacing scale
- **Components**: Reusable cards, buttons, and form elements

## 🚀 Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 📱 Responsive Design

The dashboard is fully responsive and works seamlessly across:

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔧 State Management

Uses Redux Toolkit with separate slices for:

- **Patient Data**: Health metrics, conditions, personal info
- **Appointments**: Doctor listings, bookings, scheduling
- **Chat**: Messages, chat rooms, communication state

## 🎯 Key Features Implemented

✅ **Patient Dashboard** - Health metrics, conditions, quick actions
✅ **Doctor Directory** - Search, filter, and book appointments
✅ **Appointment Booking** - Interactive modal with date/time selection
✅ **Chat Interface** - Real-time messaging layout
✅ **Medical Reports** - Document management and upload
✅ **Responsive Design** - Mobile-first approach
✅ **Redux State Management** - Centralized state with TypeScript
✅ **Modern UI/UX** - Clean, professional healthcare interface

## 🚀 Future Enhancements

- Real-time chat with WebSocket integration
- File upload to cloud storage
- Push notifications for appointments
- Integration with healthcare APIs
- Advanced health analytics and charts
- Prescription management
- Insurance integration
- Multi-language support

## 💡 Perfect for Healthcare Portfolios

This project demonstrates:

- **Healthcare Domain Knowledge**: Understanding of patient workflows
- **Modern React Patterns**: Hooks, Redux Toolkit, TypeScript
- **UI/UX Excellence**: Professional healthcare interface design
- **Component Architecture**: Scalable and maintainable code structure
- **Responsive Design**: Cross-device compatibility
- **State Management**: Complex application state handling

---

Built with ❤️ for modern healthcare experiences
