import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { MedicalCondition } from '../../store/slices/patientSlice';
import { format } from 'date-fns';

interface ConditionsCardProps {
  conditions: MedicalCondition[];
}

const ConditionsCard: React.FC<ConditionsCardProps> = ({ conditions }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Conditions</h3>
      <div className="space-y-4">
        {conditions.map((condition) => (
          <div key={condition.id} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{condition.name}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(condition.severity)}`}>
                  {condition.severity}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                Diagnosed: {condition.diagnosedDate ? format(new Date(condition.diagnosedDate), 'MMM dd, yyyy') : 'N/A'}
              </div>
            </div>
          </div>
        ))}
        {conditions.length === 0 && (
          <p className="text-gray-500 text-center py-4">No medical conditions recorded</p>
        )}
      </div>
    </div>
  );
};

export default ConditionsCard;