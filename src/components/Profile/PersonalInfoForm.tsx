'use client';

import React from 'react';

interface PersonalInfoFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  };
  isEditing: boolean;
  onDataChange: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  }) => void;
  onEditToggle: () => void;
  onSubmit: () => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  isEditing,
  onDataChange,
  onEditToggle,
  onSubmit
}) => {
  const handleFieldChange = (field: string, value: string) => {
    onDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={isEditing ? onSubmit : onEditToggle}
          className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 ${
            isEditing 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Enter your last name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Enter your phone number"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Department
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => handleFieldChange('department', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Enter your department"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Job Position
          </label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => handleFieldChange('position', e.target.value)}
            disabled={!isEditing}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Enter your job position"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Bio / About Yourself
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleFieldChange('bio', e.target.value)}
            disabled={!isEditing}
            rows={4}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
              !isEditing 
                ? 'bg-gray-50 border-gray-200 text-gray-600' 
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
