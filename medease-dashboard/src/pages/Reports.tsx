import React, { useState } from 'react';
import { Upload, FileText, Download, Eye, Calendar, Search } from 'lucide-react';

interface MedicalReport {
  id: string;
  name: string;
  type: 'lab-result' | 'prescription' | 'scan' | 'report';
  date: string;
  doctor: string;
  size: string;
  url?: string;
}

const Reports: React.FC = () => {
  const [reports] = useState<MedicalReport[]>([
    {
      id: '1',
      name: 'Blood Test Results - Complete Blood Count',
      type: 'lab-result',
      date: '2025-07-20',
      doctor: 'Dr. Sarah Johnson',
      size: '245 KB',
    },
    {
      id: '2',
      name: 'Prescription - Diabetes Medication',
      type: 'prescription',
      date: '2025-07-18',
      doctor: 'Dr. Michael Chen',
      size: '156 KB',
    },
    {
      id: '3',
      name: 'Chest X-Ray Report',
      type: 'scan',
      date: '2025-07-15',
      doctor: 'Dr. Emily Davis',
      size: '1.2 MB',
    },
    {
      id: '4',
      name: 'Annual Health Checkup Report',
      type: 'report',
      date: '2025-07-10',
      doctor: 'Dr. Emily Davis',
      size: '890 KB',
    },
    {
      id: '5',
      name: 'Cardiology Consultation Report',
      type: 'report',
      date: '2025-07-05',
      doctor: 'Dr. Sarah Johnson',
      size: '567 KB',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lab-result':
        return 'bg-blue-100 text-blue-800';
      case 'prescription':
        return 'bg-green-100 text-green-800';
      case 'scan':
        return 'bg-purple-100 text-purple-800';
      case 'report':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lab-result':
        return 'Lab Result';
      case 'prescription':
        return 'Prescription';
      case 'scan':
        return 'Medical Scan';
      case 'report':
        return 'Medical Report';
      default:
        return 'Document';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || report.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload
      console.log('Files dropped:', e.dataTransfer.files);
      alert('File upload functionality would be implemented here');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Handle file upload
      console.log('File selected:', e.target.files[0]);
      alert('File upload functionality would be implemented here');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
        <div className="text-sm text-gray-500">
          {filteredReports.length} documents
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Medical Documents
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your files here, or click to browse
        </p>
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileInput}
          />
        </label>
        <p className="text-xs text-gray-400 mt-2">
          Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search reports by name or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="lab-result">Lab Results</option>
            <option value="prescription">Prescriptions</option>
            <option value="scan">Medical Scans</option>
            <option value="report">Reports</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{report.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {getTypeLabel(report.type)}
                      </span>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(report.date).toLocaleDateString()}
                      </div>
                      <span>by {report.doctor}</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Eye className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No reports found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;