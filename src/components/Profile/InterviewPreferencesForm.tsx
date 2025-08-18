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
    selectedSkills?: string[];
    customSkills?: string[];
  };
}

const InterviewPreferencesForm: React.FC<InterviewPreferencesFormProps> = ({
  jobRoles,
  onSave
}) => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [preferences, setPreferences] = useState<InterviewPreferences>({
    preferredLanguage: 'vi',
    autoStartWithPreferences: true,
    interviewPreferences: {
      showJobRoleSelector: true,
      defaultAvatarId: '',
      enableVoiceInteraction: true,
      selectedSkills: [],
      customSkills: [],
    },
  });

  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);
  
  // Step-by-step selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedExperience, setSelectedExperience] = useState<string>('');

  // Current step tracking
  const [currentStep, setCurrentStep] = useState(1);

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
              selectedSkills: [],
              customSkills: [],
            },
          });
          
          if (data.preferredJobRole) {
            setSelectedJobRole(data.preferredJobRole);
            // Auto-fill step-by-step selection
            setSelectedCategory(data.preferredJobRole.category?.name || '');
            setSelectedSpecialization(data.preferredJobRole.specialization?.name || '');
            setSelectedLevel(data.preferredJobRole.level || '');
            setSelectedExperience(`${data.preferredJobRole.minExperience}-${data.preferredJobRole.maxExperience || '∞'}`);
            
            // Set current step based on what's filled
            if (data.preferredJobRole.minExperience !== undefined) {
              setCurrentStep(4);
            } else if (data.preferredJobRole.level) {
              setCurrentStep(3);
            } else if (data.preferredJobRole.specialization?.name) {
              setCurrentStep(2);
            } else if (data.preferredJobRole.category?.name) {
              setCurrentStep(1);
            }
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

  // Get unique categories from jobRoles
  const categories = React.useMemo(() => {
    if (!jobRoles || jobRoles.length === 0) return [];
    return Array.from(new Set(
      jobRoles
        .map(role => role.category?.name)
        .filter(Boolean)
    )).sort();
  }, [jobRoles]);

  // Get specializations for selected category
  const specializations = React.useMemo(() => {
    if (!selectedCategory || !jobRoles) return [];
    return Array.from(new Set(
      jobRoles
        .filter(role => role.category?.name === selectedCategory)
        .map(role => role.specialization?.name)
        .filter(Boolean)
    )).sort();
  }, [selectedCategory, jobRoles]);

  // Get levels for selected category and specialization
  const levels = React.useMemo(() => {
    if (!selectedCategory || !jobRoles) return [];
    return Array.from(new Set(
      jobRoles
        .filter(role => 
          role.category?.name === selectedCategory &&
          (selectedSpecialization ? role.specialization?.name === selectedSpecialization : true)
        )
        .map(role => role.level)
    )).sort();
  }, [selectedCategory, selectedSpecialization, jobRoles]);

  // Get experience ranges for selected filters
  const experienceRanges = React.useMemo(() => {
    if (!selectedCategory || !selectedLevel || !jobRoles) return [];
    return Array.from(new Set(
      jobRoles
        .filter(role => 
          role.category?.name === selectedCategory &&
          (selectedSpecialization ? role.specialization?.name === selectedSpecialization : true) &&
          role.level === selectedLevel
        )
        .map(role => `${role.minExperience}-${role.maxExperience || '∞'}`)
    )).sort();
  }, [selectedCategory, selectedSpecialization, selectedLevel, jobRoles]);

  // Get skills for selected category from JobCategory
  const categorySkills = React.useMemo(() => {
    if (!selectedCategory || !jobRoles) return [];
    const category = jobRoles.find(role => role.category?.name === selectedCategory)?.category;
    return category?.skills || [];
  }, [selectedCategory, jobRoles]);



  // Show toast notification
  const showToastNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle step navigation
  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  // Check if step is completed
  const isStepCompleted = (step: number) => {
    switch (step) {
      case 1: return !!selectedCategory;
      case 2: return !!selectedSpecialization;
      case 3: return !!selectedLevel;
      case 4: return !!selectedExperience;
      default: return false;
    }
  };

  // Check if step is accessible
  const isStepAccessible = (step: number) => {
    switch (step) {
      case 1: return true;
      case 2: return !!selectedCategory;
      case 3: return !!selectedCategory && !!selectedSpecialization;
      case 4: return !!selectedCategory && !!selectedSpecialization && !!selectedLevel;
      default: return false;
    }
  };

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
        showToastNotification('Preferences saved successfully!', 'success');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToastNotification('Failed to save preferences. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state if no job roles
  if (!jobRoles || jobRoles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Interview Preferences</h3>
          <p className="text-sm text-gray-600 mt-1">
            Customize your interview experience and set default preferences
          </p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job roles...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we load available job positions</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no categories available
  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Interview Preferences</h3>
          <p className="text-sm text-gray-600 mt-1">
            Customize your interview experience and set default preferences
          </p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600">No job categories available</p>
            <p className="text-sm text-gray-500 mt-2">Please contact administrator to set up job roles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toastType === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toastType === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Interview Preferences</h3>
        <p className="text-sm text-gray-600 mt-1">
          Customize your interview experience and set default preferences
        </p>
      </div>

      {/* Job Role Selection Summary */}
      {(selectedCategory || selectedSpecialization || selectedLevel || selectedExperience) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Selected Job Position
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {selectedCategory}
              </span>
            )}
            {selectedSpecialization && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {selectedSpecialization}
              </span>
            )}
            {selectedLevel && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                {selectedLevel}
              </span>
            )}
            {selectedExperience && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                {selectedExperience === '0-∞' ? '0+ years' : `${selectedExperience} years`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Job Role Selection Wizard */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
            Job Position Selection
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Follow the steps below to select your preferred job position
          </p>
        </div>

        {/* Stepper Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { number: 1, title: 'Industry', icon: '🏢' },
              { number: 2, title: 'Specialization', icon: '🎯' },
              { number: 3, title: 'Level', icon: '📊' },
              { number: 4, title: 'Experience', icon: '⏰' }
            ].map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <button
                  onClick={() => handleStepChange(step.number)}
                  disabled={!isStepAccessible(step.number)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    currentStep === step.number
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isStepCompleted(step.number)
                      ? 'border-green-500 bg-green-500 text-white'
                      : isStepAccessible(step.number)
                      ? 'border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isStepCompleted(step.number) ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </button>
                <span className="text-xs text-gray-600 mt-2 text-center">{step.title}</span>
                {step.number < 4 && (
                  <div className={`w-12 h-0.5 mt-2 ${
                    isStepCompleted(step.number + 1) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Industry Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🏢</div>
                <h5 className="text-lg font-medium text-gray-900">Select Main Industry</h5>
                <p className="text-sm text-gray-600">Choose the broad industry field you&apos;re interested in</p>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => {
                  const categoryName = e.target.value;
                  setSelectedCategory(categoryName);
                  setSelectedSpecialization('');
                  setSelectedLevel('');
                  setSelectedExperience('');
                  setSelectedJobRole(null);
                  setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
                  if (categoryName) setCurrentStep(2);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm text-lg"
              >
                <option value="">Choose your main industry...</option>
                {categories.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>Selected:</strong> {selectedCategory}
                  </p>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Specialization →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Specialization Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎯</div>
                <h5 className="text-lg font-medium text-gray-900">Select Specialization</h5>
                <p className="text-sm text-gray-600">Choose your specific area of expertise within {selectedCategory}</p>
              </div>
              
              <select
                value={selectedSpecialization}
                onChange={(e) => {
                  const specializationName = e.target.value;
                  setSelectedSpecialization(specializationName);
                  setSelectedLevel('');
                  setSelectedExperience('');
                  setSelectedJobRole(null);
                  setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
                  if (specializationName) setCurrentStep(3);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm text-lg"
              >
                <option value="">Choose your specialization...</option>
                {specializations.map((specializationName) => (
                  <option key={specializationName} value={specializationName}>
                    {specializationName}
                  </option>
                ))}
              </select>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ← Back to Industry
                </button>
                {selectedSpecialization && (
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Level →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Level Selection */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📊</div>
                <h5 className="text-lg font-medium text-gray-900">Select Experience Level</h5>
                <p className="text-sm text-gray-600">Choose your professional experience level</p>
              </div>
              
              <select
                value={selectedLevel}
                onChange={(e) => {
                  const level = e.target.value;
                  setSelectedLevel(level);
                  setSelectedExperience('');
                  setSelectedJobRole(null);
                  setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
                  if (level) setCurrentStep(4);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm text-lg"
              >
                <option value="">Choose your experience level...</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === 'Intern' ? 'Intern (Entry Level)' :
                     level === 'Junior' ? 'Junior (Fresh Graduate)' :
                     level === 'Mid' ? 'Mid-level (Experienced)' :
                     level === 'Senior' ? 'Senior (Advanced)' :
                     level === 'Lead' ? 'Lead (Team Management)' : level}
                  </option>
                ))}
              </select>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ← Back to Specialization
                </button>
                {selectedLevel && (
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to Experience →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Experience Selection */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">⏰</div>
                <h5 className="text-lg font-medium text-gray-900">Select Years of Experience</h5>
                <p className="text-sm text-gray-600">Choose your specific years of experience</p>
              </div>
              
              <select
                value={selectedExperience}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white shadow-sm text-lg"
              >
                <option value="">Choose your years of experience...</option>
                {experienceRanges.map((experience) => (
                  <option key={experience} value={experience}>
                    {experience === '0-∞' ? '0+ years (Beginner)' : 
                     experience === '1-3' ? '1-3 years (Junior)' :
                     experience === '3-5' ? '3-5 years (Mid-level)' :
                     experience === '5-8' ? '5-8 years (Senior)' :
                     experience === '8-12' ? '8-12 years (Lead)' : `${experience} years`}
                  </option>
                ))}
              </select>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ← Back to Level
                </button>
                {selectedExperience && (
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✓ Complete Selection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
        
      {/* Selected job role display */}
      {selectedJobRole && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-emerald-900">{selectedJobRole.title}</h4>
                  <p className="text-sm text-emerald-700 font-medium">
                    {selectedJobRole.category?.name}
                    {selectedJobRole.specialization?.name && ` • ${selectedJobRole.specialization.name}`}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium">Level</p>
                  <p className="text-sm text-emerald-900 font-semibold">{selectedJobRole.level}</p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium">Experience</p>
                  <p className="text-sm text-emerald-900 font-semibold">
                    {selectedJobRole.minExperience}-{selectedJobRole.maxExperience || '∞'} years
                  </p>
                </div>
              </div>
              
              {selectedJobRole.description && (
                <div className="bg-white/50 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Job Description</p>
                  <p className="text-sm text-emerald-800">{selectedJobRole.description}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setSelectedJobRole(null);
                setSelectedCategory('');
                setSelectedSpecialization('');
                setSelectedLevel('');
                setSelectedExperience('');
                setPreferences(prev => ({ ...prev, preferredJobRoleId: undefined }));
                setCurrentStep(1);
              }}
              className="text-emerald-500 hover:text-emerald-700 p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Select Again"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

             {/* Skills for selected category */}
       {selectedCategory && (
         <div className="bg-white border border-gray-200 rounded-lg p-6">
           <div className="flex items-center gap-2 mb-4">
             <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
             </svg>
             <h4 className="text-lg font-medium text-gray-900">Required Skills for {selectedCategory}</h4>
             <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
               From JobCategory.skills
             </span>
           </div>
           
           {categorySkills.length > 0 ? (
             <>
               <div className="flex flex-wrap gap-2 mb-4">
                 {categorySkills.slice(0, 12).map((skill: string, index: number) => (
                   <span
                     key={index}
                     className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200"
                     title={skill}
                   >
                     {skill}
                   </span>
                 ))}
                 {categorySkills.length > 12 && (
                   <details className="w-full">
                     <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                       Show {categorySkills.length - 12} more skills
                     </summary>
                     <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                       {categorySkills.slice(12).map((skill: string, index: number) => (
                         <span
                           key={index + 12}
                           className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100"
                           title={skill}
                         >
                           {skill}
                         </span>
                       ))}
                     </div>
                   </details>
                 )}
               </div>
               
               <p className="text-xs text-gray-600">
                 These skills are defined in the JobCategory.skills field in the database for the {selectedCategory} field
               </p>
             </>
           ) : (
             <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
               <p className="text-sm text-gray-600">
                 No skills defined for {selectedCategory} in JobCategory.skills yet. Please contact administrator.
               </p>
             </div>
           )}
         </div>
       )}

      {/* Personal Skills Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900">Personal Skills & Expertise</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Core Skills
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose the skills that best represent your expertise and experience
            </p>
            
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-lg">
              {categorySkills.map((skill: string, index: number) => (
                <label key={index} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPreferences(prev => ({
                          ...prev,
                          interviewPreferences: {
                            ...prev.interviewPreferences,
                            selectedSkills: [...(prev.interviewPreferences.selectedSkills || []), skill]
                          }
                        }));
                      } else {
                        setPreferences(prev => ({
                          ...prev,
                          interviewPreferences: {
                            ...prev.interviewPreferences,
                            selectedSkills: (prev.interviewPreferences.selectedSkills || []).filter(s => s !== skill)
                          }
                        }));
                      }
                    }}
                    checked={(preferences.interviewPreferences.selectedSkills || []).includes(skill)}
                  />
                  <span className="text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Custom Skills
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter custom skill (e.g., AWS, Docker, etc.)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newSkill = e.currentTarget.value.trim();
                    setPreferences(prev => ({
                      ...prev,
                      interviewPreferences: {
                        ...prev.interviewPreferences,
                        customSkills: [...(prev.interviewPreferences.customSkills || []), newSkill]
                      }
                    }));
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input.value.trim()) {
                    const newSkill = input.value.trim();
                    setPreferences(prev => ({
                      ...prev,
                      interviewPreferences: {
                        ...prev.interviewPreferences,
                        customSkills: [...(prev.interviewPreferences.customSkills || []), newSkill]
                      }
                    }));
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Display selected skills */}
          {((preferences.interviewPreferences.selectedSkills && preferences.interviewPreferences.selectedSkills.length > 0) || 
            (preferences.interviewPreferences.customSkills && preferences.interviewPreferences.customSkills.length > 0)) && (
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Your Selected Skills:</h5>
              <div className="flex flex-wrap gap-2">
                {preferences.interviewPreferences.selectedSkills?.map((skill: string, index: number) => (
                  <span
                    key={`selected-${index}`}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200 flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => {
                        setPreferences(prev => ({
                          ...prev,
                          interviewPreferences: {
                            ...prev.interviewPreferences,
                            selectedSkills: (prev.interviewPreferences.selectedSkills || []).filter(s => s !== skill)
                          }
                        }));
                      }}
                      className="text-yellow-600 hover:text-yellow-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {preferences.interviewPreferences.customSkills?.map((skill: string, index: number) => (
                  <span
                    key={`custom-${index}`}
                    className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full border border-orange-200 flex items-center gap-1"
                  >
                    {skill}
                    <button
                      onClick={() => {
                        setPreferences(prev => ({
                          ...prev,
                          interviewPreferences: {
                            ...prev.interviewPreferences,
                            customSkills: (prev.interviewPreferences.customSkills || []).filter(s => s !== skill)
                          }
                        }));
                      }}
                      className="text-orange-600 hover:text-orange-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language & Auto-start Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900">Language & Auto-start Settings</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Language
            </label>
            <select
              value={preferences.preferredLanguage ?? 'vi'}
              onChange={(e) => setPreferences(prev => ({ ...prev, preferredLanguage: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="vi">Vietnamese</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        </div>
      </div>

      {/* Additional Interview Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900">Additional Interview Options</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Show job role selector</label>
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

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable voice interaction</label>
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
      </div>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InterviewPreferencesForm;
