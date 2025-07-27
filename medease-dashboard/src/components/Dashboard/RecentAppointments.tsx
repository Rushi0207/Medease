import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';
import { RootState } from '../../store';
import { setAppointments } from '../../store/slices/appointmentSlice';
import { format } from 'date-fns';

const RecentAppointments: React.FC = () => {
  const dispatch = useDispatch();
  const appointments = useSelector((state: RootState) => state.appointments.appointments);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:8080/api/appointments/patient', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            dispatch(setAppointments(data));
          }
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        // Fallback to mock data if API fails
        dispatch(setAppointments([
          {
            id: '1',
            doctorId: 'doc1',
            doctorName: 'Dr. Sarah Johnson',
            specialty: 'Cardiologist',
            appointmentDate: '2025-07-25',
            appointmentTime: '10:00 AM',
            status: 'SCHEDULED',
            type: 'VIDEO',
            notes: 'Follow-up consultation',
          },
        ]));
      }
    };

    fetchAppointments();
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50';
      case 'rescheduled':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const recentAppointments = appointments.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {recentAppointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 truncate">
                  {appointment.doctorName || 
                   (appointment.doctor ? `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}` : 'Unknown Doctor')}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status?.toLowerCase().replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-sm text-gray-500">{appointment.specialty || appointment.doctor?.specialty}</p>
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {(appointment.appointmentDate || appointment.date) ? 
                    format(new Date(appointment.appointmentDate || appointment.date!), 'MMM dd, yyyy') : 'N/A'}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {appointment.appointmentTime || appointment.time || 'N/A'}
                </div>
                <div className="flex items-center">
                  {appointment.type?.toLowerCase() === 'video' ? (
                    <Video className="h-4 w-4 mr-1" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-1" />
                  )}
                  {appointment.type?.toLowerCase() === 'video' ? 'Video Call' : 'In-Person'}
                </div>
              </div>
              
              {appointment.notes && (
                <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
              )}
            </div>
          </div>
        ))}
        
        {recentAppointments.length === 0 && (
          <p className="text-gray-500 text-center py-8">No recent appointments</p>
        )}
      </div>
    </div>
  );
};

export default RecentAppointments;