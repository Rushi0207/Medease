import React, { useState } from 'react';
import { Heart, Activity, Scale, Ruler, Edit } from 'lucide-react';
import { HealthMetrics } from '../../store/slices/patientSlice';
import HealthMetricsForm from './HealthMetricsForm';

interface HealthMetricsCardProps {
  metrics: HealthMetrics;
  onUpdate?: () => void;
}

const HealthMetricsCard: React.FC<HealthMetricsCardProps> = ({ metrics, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const metricItems = [
    {
      label: 'BMI',
      value: metrics.bmi.toFixed(1),
      icon: Scale,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      status: metrics.bmi < 25 ? 'Normal' : metrics.bmi < 30 ? 'Overweight' : 'Obese',
    },
    {
      label: 'Heart Rate',
      value: `${metrics.heartRate} bpm`,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      status: metrics.heartRate >= 60 && metrics.heartRate <= 100 ? 'Normal' : 'Abnormal',
    },
    {
      label: 'Blood Pressure',
      value: metrics.bloodPressure,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      status: 'Normal',
    },
    {
      label: 'Weight',
      value: `${metrics.weight} kg`,
      icon: Ruler,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      status: 'Stable',
    },
  ];

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Health Metrics</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <Edit className="h-4 w-4 mr-1" />
            Update
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {metricItems.map((item) => (
            <div key={item.label} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="font-semibold text-gray-900">{item.value}</p>
                <p className={`text-xs ${
                  item.status === 'Normal' || item.status === 'Stable' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {item.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <HealthMetricsForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onUpdate={() => {
          if (onUpdate) onUpdate();
        }}
        currentMetrics={{
          weight: metrics.weight,
          height: metrics.height,
          heartRate: metrics.heartRate,
          bloodPressure: metrics.bloodPressure,
        }}
      />
    </>
  );
};

export default HealthMetricsCard;