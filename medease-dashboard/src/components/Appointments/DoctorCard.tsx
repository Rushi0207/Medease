import React from 'react';
import { useDispatch } from 'react-redux';
import { Star, Calendar, DollarSign, Award } from 'lucide-react';
import { Doctor, selectDoctor } from '../../store/slices/appointmentSlice';

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookAppointment }) => {
  const dispatch = useDispatch();

  const handleBookAppointment = () => {
    dispatch(selectDoctor(doctor));
    onBookAppointment();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <img
          src={doctor.avatar}
          alt={doctor.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{doctor.name}</h3>
          <p className="text-blue-600 font-medium">{doctor.specialty}</p>
          
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span>{doctor.rating}</span>
            </div>
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1" />
              <span>{doctor.experience} years</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>${doctor.consultationFee} consultation</span>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Available today</span>
          </div>
        </div>

        <button
          onClick={handleBookAppointment}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;