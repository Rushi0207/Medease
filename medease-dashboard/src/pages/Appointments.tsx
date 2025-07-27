import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter } from 'lucide-react';
import { RootState } from '../store';
import { setDoctors } from '../store/slices/appointmentSlice';
import { doctorAPI } from '../services/api';
import DoctorCard from '../components/Appointments/DoctorCard';
import AppointmentBooking from '../components/Appointments/AppointmentBooking';

const Appointments: React.FC = () => {
  const dispatch = useDispatch();
  const { doctors, selectedDoctor } = useSelector((state: RootState) => state.appointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError('');
        
        const doctorsData = await doctorAPI.getAllDoctors();
        
        // Transform backend data to match frontend structure
        const transformedDoctors = doctorsData.map((doctor: any) => ({
          id: doctor.id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          specialty: doctor.specialty,
          rating: doctor.rating,
          experience: doctor.experienceYears,
          consultationFee: doctor.consultationFee,
          avatar: doctor.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user.firstName + ' ' + doctor.user.lastName)}&background=3b82f6&color=fff`,
          availability: doctor.availableDays || [],
          qualification: doctor.qualification,
          hospitalAffiliation: doctor.hospitalAffiliation,
          bio: doctor.bio,
          isAvailable: doctor.available,
        }));

        dispatch(setDoctors(transformedDoctors));
      } catch (error: any) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [dispatch]);

  const specialties = Array.from(new Set(doctors.map(doctor => doctor.specialty)));

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <div className="text-sm text-gray-500">
          {filteredDoctors.length} doctors available
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => (
          <DoctorCard 
            key={doctor.id} 
            doctor={doctor} 
            onBookAppointment={() => setShowBooking(true)}
          />
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No doctors found matching your criteria</p>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {showBooking && selectedDoctor && (
        <AppointmentBooking
          doctor={selectedDoctor}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
};

export default Appointments;