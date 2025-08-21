import React, { useCallback, useState, useEffect } from 'react';
import { SessionState } from '../HeygenConfig';
import { StartAvatarRequest } from '@heygen/streaming-avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { UserPackageService, PackageLimitInfo } from '../../../services/userPackage';

interface PreInterviewSetupProps {
  config: StartAvatarRequest;
  onConfigChange: (config: StartAvatarRequest) => void;
  onStartInterview: () => Promise<void>;
  sessionState: SessionState;
  AVATARS: Array<{ avatar_id: string; name: string }>;
  STT_LANGUAGE_LIST: Array<{ label: string; value: string; key: string }>;
  onJobRoleIdChange: (id: string) => void;
  onPositionKeyChange: (key: string) => void;
  jobRoles: JobRole[];
}

interface JobRole {
  id: string;
  key: string;
  title: string;
  level: 'Intern' | 'Junior' | 'Mid' | 'Senior' | 'Lead';
  description?: string;
  minExperience: number;
  maxExperience?: number;
  order: number;
  category?: {
    id: string;
    name: string;
    skills?: string[];
  };
  categoryId?: string;
  specialization?: {
    id: string;
    name: string;
  };
  specializationId?: string;
}

interface UserPreferences {
  preferredJobRoleId?: string;
  preferredLanguage?: string;
  autoStartWithPreferences?: boolean;
  preferredJobRole?: JobRole;
}

const PreInterviewSetup: React.FC<PreInterviewSetupProps> = ({
  config,
  onConfigChange,
  onStartInterview,
  sessionState,
  AVATARS,
  STT_LANGUAGE_LIST,
  onJobRoleIdChange,
  onPositionKeyChange,
  jobRoles
}) => {
  const router = useRouter();
  const { userId } = useAuth();
  
  // Smart search state
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);

  // User preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);


  // Error state management
  const [errors, setErrors] = useState<{
    start: string;
    search: string;
    language: string;
  }>({
    start: '',
    search: '',
    language: ''
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [packageLimitInfo, setPackageLimitInfo] = useState<PackageLimitInfo | null>(null);
  
  // Question bank stats
  const [questionBankStats, setQuestionBankStats] = useState<{
    totalQuestions: number;
    fields: string[];
    topics: string[];
    levels: string[];
    fieldStats: Array<{ field: string; count: number }>;
    topicStats: Array<{ topic: string; count: number }>;
    levelStats: Array<{ level: string; count: number }>;
  } | null>(null);

  // Load user preferences and question bank stats on component mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!userId) return;
      
      try {
        const response = await fetch('/api/profile/interview-preferences');
        if (response.ok) {
          const preferences = await response.json();
          setUserPreferences(preferences);
          
          // Auto-fill if user has preferences and autoStartWithPreferences is enabled
          if (preferences.autoStartWithPreferences && preferences.preferredJobRoleId) {
            const preferredRole = jobRoles.find(role => role.id === preferences.preferredJobRoleId);
            if (preferredRole) {
              setSelectedJobRole(preferredRole);
              onJobRoleIdChange(preferredRole.id);
              onPositionKeyChange(preferredRole.key);
            }
          }
          
          // Auto-fill language if available
          if (preferences.preferredLanguage && !config.language) {
            onConfigChange({ ...config, language: preferences.preferredLanguage });
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    const loadQuestionBankStats = async () => {
      try {
        const response = await fetch('/api/questions/stats');
        if (response.ok) {
          const stats = await response.json();
          setQuestionBankStats(stats);
        }
      } catch (error) {
        console.error('Error loading question bank stats:', error);
      }
    };

    loadUserPreferences();
    loadQuestionBankStats();
  }, [userId, jobRoles, onJobRoleIdChange, onPositionKeyChange, config, onConfigChange]);

  // Helper functions for error management
  const setError = useCallback((field: keyof typeof errors, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({
      start: '',
      search: '',
      language: ''
    });
  }, []);

  // Generate search suggestions based on query




  // Validation function
  const validateForm = useCallback(() => {
    clearAllErrors();
    let isValid = true;

    if (!selectedJobRole) {
      setError('search', 'Please select a job role');
      isValid = false;
    }

    if (!config.language) {
      setError('language', 'Please select a language');
      isValid = false;
    }

    // Additional validation for AI context
    if (!selectedJobRole?.category?.name) {
      setError('search', 'Job role must have category information');
      isValid = false;
    }

    if (!selectedJobRole?.level) {
      setError('search', 'Job role must have level information');
      isValid = false;
    }

    return isValid;
  }, [selectedJobRole, config.language, clearAllErrors, setError]);

  // Prepare AI context data
  const prepareAIContext = useCallback(() => {
    if (!selectedJobRole) return null;

    return {
      jobRole: {
        id: selectedJobRole.id,
        title: selectedJobRole.title,
        level: selectedJobRole.level,
        description: selectedJobRole.description,
        experience: `${selectedJobRole.minExperience}-${selectedJobRole.maxExperience || '∞'} years`,
        category: selectedJobRole.category?.name,
        specialization: selectedJobRole.specialization?.name,
        skills: selectedJobRole.category?.skills || [],
        key: selectedJobRole.key
      },
      language: config.language,
      avatar: config.avatarName,
      timestamp: new Date().toISOString()
    };
  }, [selectedJobRole, config.language, config.avatarName]);

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Check package limits
      const packageCheck = await UserPackageService.checkActivePackage();
      
      if (!packageCheck.hasActivePackage) {
        setPackageLimitInfo(packageCheck);
        setShowUpgradeModal(true);
        return;
      }

      if (!packageCheck.avatarInterviewCanUse) {
        setPackageLimitInfo(packageCheck);
        setShowUpgradeModal(true);
        return;
      }

      // Prepare AI context data
      const aiContext = prepareAIContext();
      if (aiContext) {
        console.log('AI Context Data:', aiContext);
        // You can send this data to your AI service or store it for later use
      }

      setError('start', '');
      await onStartInterview();
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('start', 'Failed to start interview. Please try again.');
    }
  }, [validateForm, onStartInterview, setError, prepareAIContext]);

  const handleConfigChange = useCallback(<K extends keyof StartAvatarRequest>(
    key: K,
    value: StartAvatarRequest[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
    clearError('language');
  }, [config, onConfigChange, clearError]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">

            <>
              {/* Avatar Selection */}
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Avatar</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {AVATARS.map((avatar) => (
                <div
                  key={avatar.avatar_id}
                  className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 bg-white ${
                    config.avatarName === avatar.avatar_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleConfigChange('avatarName', avatar.avatar_id)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg text-gray-400">👤</span>
                    </div>
                  </div>
                  <p className="text-center text-xs font-medium text-gray-900 truncate">{avatar.name}</p>
                  {config.avatarName === avatar.avatar_id && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
              </div>
            )}
          </div>
              ))}
            </div>
      </div>

      {/* Language Selection */}
      <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
            <div className="relative">
        <select
                value={config.language || ''}
                onChange={(e) => {
                  handleConfigChange('language', e.target.value);
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${errors.language ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="" disabled>Select language</option>
          {STT_LANGUAGE_LIST.map((lang) => (
                  <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.language && <div className="text-red-600 text-xs mt-1">{errors.language}</div>}
      </div>

          {/* Job Role Selection */}
       <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Job Position</label>
         <select
              value={userPreferences?.preferredJobRoleId || ''}
              onChange={(e) => {
                const roleId = e.target.value;
                const role = jobRoles.find(r => r.id === roleId);
                if (role) {
                  setSelectedJobRole(role);
                  onJobRoleIdChange(roleId);
                  onPositionKeyChange(role.key);
                  clearError('search');
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${errors.search ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select job position...</option>
              {jobRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title} • {role.level} • {role.category?.name}
                  {role.specialization?.name && ` (${role.specialization.name})`}
                  {` • ${role.minExperience}-${role.maxExperience || '∞'} years`}
                </option>
              ))}
         </select>
            {errors.search && <div className="text-red-600 text-xs mt-1">{errors.search}</div>}
            
            {/* Selected job role display */}
            {selectedJobRole && (
              <div className="mt-3 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-blue-900">{selectedJobRole.title}</h4>
                        <p className="text-sm text-blue-700 font-medium">
                          {selectedJobRole.category?.name}
                          {selectedJobRole.specialization?.name && ` • ${selectedJobRole.specialization.name}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Level</p>
                        <p className="text-sm text-blue-900 font-semibold">{selectedJobRole.level}</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Experience</p>
                        <p className="text-sm text-blue-900 font-semibold">
                          {selectedJobRole.minExperience}-{selectedJobRole.maxExperience || '∞'} years
                        </p>
                      </div>
                    </div>
                    
                    {selectedJobRole.description && (
                      <div className="bg-white/50 p-3 rounded-lg mb-4">
                        <p className="text-xs text-blue-600 font-medium mb-1">Job Description</p>
                        <p className="text-sm text-blue-800">{selectedJobRole.description}</p>
                      </div>
                    )}

                    {/* Skills display */}
                    {selectedJobRole.category?.skills && selectedJobRole.category.skills.length > 0 && (
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedJobRole.category.skills.slice(0, 8).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {selectedJobRole.category.skills.length > 8 && (
                            <span className="px-2 py-1 bg-blue-200 text-blue-700 text-xs font-medium rounded-full">
                              +{selectedJobRole.category.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedJobRole(null);
                      onJobRoleIdChange('');
                      onPositionKeyChange('');
                    }}
                    className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Select Again"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
       </div>

       {/* Question Bank Info */}
       {questionBankStats && (
         <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center">
               <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               Question Bank Integration
             </h3>
             <span className="text-sm text-blue-600 font-medium">
               {questionBankStats.totalQuestions} questions available
             </span>
           </div>
           
           {selectedJobRole && (
             <div className="space-y-2">
               <div className="flex items-center text-sm text-gray-600">
                 <span className="font-medium mr-2">Field:</span>
                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                   {selectedJobRole.category?.name || 'Unknown'}
                 </span>
                 {selectedJobRole.category?.name && (
                   <span className="ml-2 text-gray-500">
                     {(() => {
                       // Field mapping logic
                       const fieldMapping: Record<string, string[]> = {
                         'Frontend': ['Frontend Development', 'Web Development'],
                         'Backend': ['Backend Development', 'Server Development'],
                         'Full Stack': ['Full Stack Development', 'Web Development'],
                         'Mobile': ['Mobile Development', 'iOS Development', 'Android Development'],
                         'Data Science': ['Data Science', 'Machine Learning', 'AI'],
                         'DevOps': ['DevOps', 'Infrastructure', 'Cloud'],
                         'QA': ['Quality Assurance', 'Testing', 'QA'],
                         'UI/UX': ['UI/UX Design', 'Design', 'User Experience'],
                         'Web Development': ['Frontend Development', 'Web Development'],
                         'Mobile Development': ['Mobile Development', 'iOS Development', 'Android Development'],
                         'AI/ML': ['Data Science', 'Machine Learning', 'AI'],
                         'Product Management': ['Product Management'],
                         'Software Development': ['Frontend Development', 'Backend Development', 'Web Development'],
                         'Cloud': ['Cloud Computing', 'DevOps', 'Infrastructure'],
                         'Security': ['Security', 'Web Security'],
                         'Design': ['UI/UX Design', 'Design', 'User Experience'],
                         'Data': ['Data Science', 'Machine Learning', 'AI']
                       };
                       
                       const mappedFields = fieldMapping[selectedJobRole.category?.name] || [selectedJobRole.category?.name];
                       const totalCount = mappedFields.reduce((total, field) => {
                         const fieldStat = questionBankStats.fieldStats.find(f => f.field === field);
                         return total + (fieldStat?.count || 0);
                       }, 0);
                       
                       return `(${totalCount} questions)`;
                     })()}
                   </span>
                 )}
               </div>
               
               <div className="flex items-center text-sm text-gray-600">
                 <span className="font-medium mr-2">Level:</span>
                 <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                   {selectedJobRole.level}
                 </span>
                                    <span className="ml-2 text-gray-500">
                     {(() => {
                       // Level mapping logic - API stats returns JobRole level names
                       const levelMapping: Record<string, string[]> = {
                         'Intern': ['Intern'],
                         'Junior': ['Junior'],
                         'Mid': ['Mid'],
                         'Senior': ['Senior'],
                         'Lead': ['Senior']
                       };
                       
                       const mappedLevels = levelMapping[selectedJobRole.level] || [selectedJobRole.level];
                       const totalCount = mappedLevels.reduce((total, level) => {
                         const levelStat = questionBankStats.levelStats.find(l => l.level === level);
                         return total + (levelStat?.count || 0);
                       }, 0);
                       
                       return `(${totalCount} questions)`;
                     })()}
                   </span>
               </div>
               
               {selectedJobRole.specialization?.name && (
                 <div className="flex items-center text-sm text-gray-600">
                   <span className="font-medium mr-2">Specialization:</span>
                   <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                     {selectedJobRole.specialization.name}
                   </span>
                 </div>
               )}
             </div>
           )}
           
           <div className="mt-3 text-xs text-gray-500">
             AI will use questions from our curated question bank to conduct your interview
           </div>
         </div>
       )}

       {/* Start Button */}
          <div className="pt-6">
            {errors.start && (
              <div className="mb-4 flex items-center bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
                <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                </svg>
                <span>{errors.start}</span>
              </div>
            )}
       <button
         onClick={handleStartInterview}
         disabled={sessionState === SessionState.CONNECTING}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 ${
                sessionState === SessionState.CONNECTING
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                                  <span>
                  {sessionState === SessionState.CONNECTING ? 'Connecting...' : 'Start Interview'}
                </span>
              </div>
            </button>
          </div>
        </>

        {/* Upgrade Modal */}
       {showUpgradeModal && packageLimitInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Upgrade Service Package
                  </h3>
                  
             <p className="text-gray-600 mb-4">
                    {packageLimitInfo.packageName === 'No Package' 
                      ? 'You do not have a service package or the package has expired.'
                      : `You have used up ${packageLimitInfo.currentUsage}/${packageLimitInfo.totalLimit} avatar interview sessions from package ${packageLimitInfo.packageName}.`
                    }
                  </p>
                  
                                      {packageLimitInfo.packageName !== 'No Package' && (
                                          <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Usage</span>
                        <span>{packageLimitInfo.currentUsage}/{packageLimitInfo.totalLimit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((packageLimitInfo.currentUsage / packageLimitInfo.totalLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Benefits when upgrading:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        More avatar interview sessions
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Access to all premium features
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3">
               <button
                 onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
               >
                      Later
               </button>
               <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        router.push('/Pricing');
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Upgrade Now
               </button>
                  </div>
             </div>
           </div>
         </div>
       )}
        </div>
      </div>
    </div>
  );
};

export default PreInterviewSetup;