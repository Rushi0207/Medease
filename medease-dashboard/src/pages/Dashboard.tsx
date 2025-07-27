import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../contexts/AuthContext';
import { RootState } from '../store';
import { setPatientData } from '../store/slices/patientSlice';
import { setAppointments } from '../store/slices/appointmentSlice';
import { patientAPI, appointmentAPI } from '../services/api';
import HealthMetricsCard from '../components/Dashboard/HealthMetricsCard';
import ConditionsCard from '../components/Dashboard/ConditionsCard';
import RecentAppointments from '../components/Dashboard/RecentAppointments';
import QuickActions from '../components/Dashboard/QuickActions';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const patient = useSelector((state: RootState) => state.patient);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch patient profile
        const patientProfile = await patientAPI.getProfile();
        
        // Transform backend data to match frontend structure
        const transformedData = {
          id: patientProfile.id,
          name: `${patientProfile.user.firstName} ${patientProfile.user.lastName}`,
          email: patientProfile.user.email,
          phone: patientProfile.user.phone,
          dateOfBirth: patientProfile.user.dateOfBirth || '',
          healthMetrics: {
            bmi: patientProfile.bmi || 0,
            heartRate: patientProfile.heartRate || 0,
            bloodPressure: patientProfile.bloodPressure || '',
            weight: patientProfile.weight || 0,
            height: patientProfile.height || 0,
          },
          conditions: patientProfile.conditions?.map((condition: any) => ({
            id: condition.id,
            name: condition.name,
            severity: condition.severity,
            diagnosedDate: condition.diagnosedDate,
          })) || [],
        };

        dispatch(setPatientData(transformedData));

        // Fetch recent appointments
        const appointments = await appointmentAPI.getPatientAppointments();
        dispatch(setAppointments(appointments));

      } catch (error: any) {
        console.error('Error fetching patient data:', error);
        setError('Failed to load patient data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPatientData();
    }
  }, [dispatch, user]);

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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-blue-100">Here's your health overview for today</p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthMetricsCard 
          metrics={patient.healthMetrics} 
          onUpdate={() => {
            // Refetch patient data after health metrics update
            if (user) {
              const fetchPatientData = async () => {
                try {
                  const patientProfile = await patientAPI.getProfile();
                  const transformedData = {
                    id: patientProfile.id,
                    name: `${patientProfile.user.firstName} ${patientProfile.user.lastName}`,
                    email: patientProfile.user.email,
                    phone: patientProfile.user.phone,
                    dateOfBirth: patientProfile.user.dateOfBirth || '',
                    healthMetrics: {
                      bmi: patientProfile.healthMetrics?.bmi || 0,
                      heartRate: patientProfile.healthMetrics?.heartRate || 0,
                      bloodPressure: patientProfile.healthMetrics?.bloodPressure || '',
                      weight: patientProfile.healthMetrics?.weight || 0,
                      height: patientProfile.healthMetrics?.height || 0,
                    },
                    conditions: patientProfile.conditions?.map((condition: any) => ({
                      id: condition.id,
                      name: condition.name,
                      severity: condition.severity,
                      diagnosedDate: condition.diagnosedDate,
                    })) || [],
                  };
                  dispatch(setPatientData(transformedData));
                } catch (error) {
                  console.error('Error refetching patient data:', error);
                }
              };
              fetchPatientData();
            }
          }}
        />
        <ConditionsCard conditions={patient.conditions} />
      </div>

      {/* Recent Appointments */}
      <RecentAppointments />
    </div>
  );
};

export default Dashboard;