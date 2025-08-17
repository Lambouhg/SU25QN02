import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { JobRole } from '../../hooks/useJobRoles';

interface InterviewPreferencesFormProps {
  jobRoles: JobRole[];
  onSave?: (preferences: InterviewPreferences) => void;
}

interface InterviewPreferences {
  preferredJobRoleId?: string;
  preferredLanguage: string;
  autoStartWithPreferences: boolean;
  interviewPreferences: {
    showJobRoleSelector?: boolean;
    defaultAvatarId?: string;
    enableVoiceInteraction?: boolean;
    
  };
}

const InterviewPreferencesForm: React.FC<InterviewPreferencesFormProps> = ({
  jobRoles,
  onSave
}) => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);



  const [preferences, setPreferences] = useState<InterviewPreferences>({
    preferredLanguage: 'vi',
    autoStartWithPreferences: true,
    interviewPreferences: {
      showJobRoleSelector: true,
      defaultAvatarId: '',
      enableVoiceInteraction: true,
    },
  });

  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);
  
  // Step-by-step selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedExperience, setSelectedExperience] = useState<string>('');

  // Load existing preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/profile/interview-preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            preferredJobRoleId: data.preferredJobRoleId,
            preferredLanguage: data.preferredLanguage || 'vi',
            autoStartWithPreferences: data.autoStartWithPreferences ?? true,
            interviewPreferences: data.interviewPreferences || {
              showJobRoleSelector: true,
              defaultAvatarId: '',
              enableVoiceInteraction: true,
            },
          });
          
          if (data.preferredJobRole) {
            setSelectedJobRole(data.preferredJobRole);
            // Auto-fill step-by-step selection
            setSelectedCategory(data.preferredJobRole.category?.name || '');
            setSelectedSpecialization(data.preferredJobRole.specialization?.name || '');
            setSelectedLevel(data.preferredJobRole.level || '');
            setSelectedExperience(`${data.preferredJobRole.minExperience}-${data.preferredJobRole.maxExperience || '∞'}`);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    if (userId) {
      loadPreferences();
    }
  }, [userId]);



  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/interview-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const savedPreferences = await response.json();
        onSave?.(savedPreferences);
        // Show success message
        alert('Preferences saved successfully!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Interview Preferences</h3>
        <p className="text-sm text-gray-600 mt-1">
          Customize your interview experience and set default preferences
        </p>
      </div>

      {/* Preferred Job Role - Step by Step Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Job Role
        </label>
        
        {/* Step 1: Select Category */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Bước 1: Chọn lĩnh vực
          </label>
          <select
            value={selectedCategory ?? ''}
            onChange={(e) => {
              const categoryName = e.target.value;
              setSelectedCategory(categoryName);
              setSelectedSpecialization('');
              setSelectedLevel('');
              setSelectedExperience('');
              setSelectedJobRole(null);
              setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="">Chọn lĩnh vực...</option>
            {Array.from(new Set(jobRoles.map(role => role.category?.name).filter(Boolean))).map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Specialization (if category has specializations) */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Bước 2: Chọn chuyên ngành
            </label>
            <select
              value={selectedSpecialization ?? ''}
              onChange={(e) => {
                const specializationName = e.target.value;
                setSelectedSpecialization(specializationName);
                setSelectedLevel('');
                setSelectedExperience('');
                setSelectedJobRole(null);
                setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="">Chọn chuyên ngành...</option>
              {Array.from(new Set(
                jobRoles
                  .filter(role => role.category?.name === selectedCategory)
                  .map(role => role.specialization?.name)
                  .filter(Boolean)
              )).map((specializationName) => (
                <option key={specializationName} value={specializationName}>
                  {specializationName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 3: Select Level */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Bước 3: Chọn cấp bậc
            </label>
            <select
              value={selectedLevel ?? ''}
              onChange={(e) => {
                const level = e.target.value;
                setSelectedLevel(level);
                setSelectedExperience('');
                setSelectedJobRole(null);
                setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="">Chọn cấp bậc...</option>
              {Array.from(new Set(
                jobRoles
                  .filter(role => 
                    role.category?.name === selectedCategory &&
                    (selectedSpecialization ? role.specialization?.name === selectedSpecialization : true)
                  )
                  .map(role => role.level)
              )).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Step 4: Select Experience Range */}
        {selectedCategory && selectedLevel && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Bước 4: Chọn năm kinh nghiệm
            </label>
            <select
              value={selectedExperience ?? ''}
              onChange={(e) => {
                const experience = e.target.value;
                setSelectedExperience(experience);
                
                // Find matching job role
                const matchingRole = jobRoles.find(role => 
                  role.category?.name === selectedCategory &&
                  (selectedSpecialization ? role.specialization?.name === selectedSpecialization : true) &&
                  role.level === selectedLevel &&
                  `${role.minExperience}-${role.maxExperience || '∞'}` === experience
                );
                
                if (matchingRole) {
                  setSelectedJobRole(matchingRole);
                  setPreferences(prev => ({
                    ...prev,
                    preferredJobRoleId: matchingRole.id,
                  }));
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="">Chọn năm kinh nghiệm...</option>
              {Array.from(new Set(
                jobRoles
                  .filter(role => 
                    role.category?.name === selectedCategory &&
                    (selectedSpecialization ? role.specialization?.name === selectedSpecialization : true) &&
                    role.level === selectedLevel
                  )
                  .map(role => `${role.minExperience}-${role.maxExperience || '∞'}`)
              )).map((experience) => (
                <option key={experience} value={experience}>
                  {experience === '0-∞' ? '0+ năm' : `${experience} năm`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Selected job role display */}
        {selectedJobRole && (
          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">{selectedJobRole.title}</h4>
                <p className="text-sm text-blue-700">
                  {selectedJobRole.category?.name}
                  {selectedJobRole.specialization?.name && ` • ${selectedJobRole.specialization.name}`}
                  {` • ${selectedJobRole.level}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedJobRole(null);
                  setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
                }}
                className="text-blue-500 hover:text-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferred Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Language
        </label>
        <select
          value={preferences.preferredLanguage ?? 'vi'}
          onChange={(e) => setPreferences(prev => ({ ...prev, preferredLanguage: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Auto-start with preferences */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Auto-start with preferences
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Automatically fill interview setup with your saved preferences
          </p>
        </div>
        <input
          type="checkbox"
          checked={preferences.autoStartWithPreferences ?? true}
          onChange={(e) => setPreferences(prev => ({ ...prev, autoStartWithPreferences: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>

      {/* Additional preferences */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Additional Options</h4>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-gray-700">Show job role selector</label>
            <p className="text-xs text-gray-500">Allow changing job role during setup</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.interviewPreferences.showJobRoleSelector ?? true}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              interviewPreferences: {
                ...prev.interviewPreferences,
                showJobRoleSelector: e.target.checked
              }
            }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-gray-700">Enable voice interaction</label>
            <p className="text-xs text-gray-500">Allow voice input during interviews</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.interviewPreferences.enableVoiceInteraction ?? true}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              interviewPreferences: {
                ...prev.interviewPreferences,
                enableVoiceInteraction: e.target.checked
              }
            }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default InterviewPreferencesForm;
