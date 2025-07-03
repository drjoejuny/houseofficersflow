import React, { useState } from 'react';
import { Plus, Calendar, User, MapPin, FileText, Clock } from 'lucide-react';
import { HouseOfficer } from '../types';
import { calculateSignOutDate } from '../utils/dateUtils';
import { addHouseOfficer } from '../utils/storage';
import { createGoogleCalendarEvent } from '../utils/calendarIntegration';

const UNITS = [
  'Cardiology 1',
  'Cardiology 2',
  'Nephrology',
  'Neurology',
  'Endocrinology',
  'Pulmonology',
  'Gastroenterology',
  'Infectious Disease/Dermatology',
  'Rheumatology'
];

interface Props {
  onOfficerAdded: () => void;
}

export const HouseOfficerForm: React.FC<Props> = ({ onOfficerAdded }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male' as 'Male' | 'Female',
    dateSignedIn: '',
    unitAssigned: '',
    clinicalPresentationTopic: '',
    clinicalPresentationDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newOfficer: HouseOfficer = {
        id: Date.now().toString(),
        ...formData,
        expectedSignOutDate: calculateSignOutDate(formData.dateSignedIn),
        createdAt: new Date().toISOString()
      };

      addHouseOfficer(newOfficer);
      
      // Reset form
      setFormData({
        fullName: '',
        gender: 'Male',
        dateSignedIn: '',
        unitAssigned: '',
        clinicalPresentationTopic: '',
        clinicalPresentationDate: ''
      });

      onOfficerAdded();
      
      // Optionally create calendar events
      if (window.confirm('Would you like to add this to Google Calendar?')) {
        createGoogleCalendarEvent(newOfficer, 'presentation');
        setTimeout(() => createGoogleCalendarEvent(newOfficer, 'signout'), 1000);
      }
    } catch (error) {
      console.error('Error adding house officer:', error);
      alert('Error adding house officer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Plus className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Add New House Officer</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter full name"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            Date Signed In
          </label>
          <input
            type="date"
            name="dateSignedIn"
            value={formData.dateSignedIn}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            Unit Assigned
          </label>
          <select
            name="unitAssigned"
            value={formData.unitAssigned}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Select Unit</option>
            {UNITS.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4" />
            Clinical Presentation Topic
          </label>
          <input
            type="text"
            name="clinicalPresentationTopic"
            value={formData.clinicalPresentationTopic}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter presentation topic"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4" />
            Clinical Presentation Date
          </label>
          <input
            type="date"
            name="clinicalPresentationDate"
            value={formData.clinicalPresentationDate}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {formData.dateSignedIn && (
          <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Expected Sign Out Date:</strong> {calculateSignOutDate(formData.dateSignedIn)}
            </p>
          </div>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add House Officer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};