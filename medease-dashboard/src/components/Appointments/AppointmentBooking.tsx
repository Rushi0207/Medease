import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, Calendar, Clock, Video, MapPin } from 'lucide-react';
import { Doctor, addAppointment } from '../../store/slices/appointmentSlice';
import { appointmentAPI } from '../../services/api';
import { format, addDays } from 'date-fns';

interface AppointmentBookingProps {
  doctor: Doctor;
  onClose: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ doctor, onClose }) => {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'VIDEO' | 'IN_PERSON'>('VIDEO');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate available dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE, MMM dd'),
    };
  });

  // Available time slots
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM'
  ];

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const appointmentData = {
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        type: appointmentType,
        notes: notes || undefined,
        patientNotes: notes || undefined,
      };

      const newAppointment = await appointmentAPI.bookAppointment(appointmentData);
      
      // Transform backend response to match frontend structure
      const transformedAppointment = {
        id: newAppointment.id,
        doctorId: newAppointment.doctor.id,
        doctorName: `${newAppointment.doctor.user.firstName} ${newAppointment.doctor.user.lastName}`,
        specialty: newAppointment.doctor.specialty,
        date: newAppointment.appointmentDate,
        time: newAppointment.appointmentTime,
        status: newAppointment.status.toLowerCase(),
        type: newAppointment.type.toLowerCase(),
        notes: newAppointment.notes,
      };

      dispatch(addAppointment(transformedAppointment));
      
      // Show success message
      alert('Appointment booked successfully!');
      onClose();

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setError(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Doctor Info */}
          <div className="flex items-center space-x-4">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-gray-900">{doctor.name}</h3>
              <p className="text-sm text-gray-600">{doctor.specialty}</p>
              <p className="text-sm text-green-600">${doctor.consultationFee} consultation</p>
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Appointment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAppointmentType('VIDEO')}
                className={`flex items-center justify-center p-3 border rounded-lg ${
                  appointmentType === 'VIDEO'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Video className="h-5 w-5 mr-2" />
                Video Call
              </button>
              <button
                onClick={() => setAppointmentType('IN_PERSON')}
                className={`flex items-center justify-center p-3 border rounded-lg ${
                  appointmentType === 'IN_PERSON'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <MapPin className="h-5 w-5 mr-2" />
                In-Person
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  onClick={() => setSelectedDate(date.value)}
                  className={`p-3 text-sm border rounded-lg ${
                    selectedDate === date.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="h-4 w-4 mx-auto mb-1" />
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Time
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`p-2 text-sm border rounded-lg ${
                    selectedTime === time
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="h-4 w-4 mx-auto mb-1" />
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific concerns or symptoms..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBookAppointment}
              disabled={loading || !selectedDate || !selectedTime}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;