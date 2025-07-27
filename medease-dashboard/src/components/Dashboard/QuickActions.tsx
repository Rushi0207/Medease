import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, FileText, Plus } from 'lucide-react';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Book Appointment',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/appointments'),
    },
    {
      label: 'Chat with Doctor',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => navigate('/chat'),
    },
    {
      label: 'View Reports',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/reports'),
    },
    {
      label: 'Add Health Data',
      icon: Plus,
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => {
        // This would open a modal to add health data
        console.log('Add health data');
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`${action.color} text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2`}
        >
          <action.icon className="h-6 w-6" />
          <span className="text-sm font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;