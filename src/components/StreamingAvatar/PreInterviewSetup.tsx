import React, { useCallback } from 'react';
import { SessionState } from './HeygenConfig';
import { StartAvatarRequest } from '@heygen/streaming-avatar';

interface PreInterviewSetupProps {
  config: StartAvatarRequest;
  onConfigChange: (config: StartAvatarRequest) => void;
  onStartInterview: () => Promise<void>;
  sessionState: SessionState;
  AVATARS: Array<{ avatar_id: string; name: string }>;
  STT_LANGUAGE_LIST: Array<{ label: string; value: string; key: string }>;
  interviewField: string;
  interviewLevel: string;
  onFieldChange: (field: string) => void;
  onLevelChange: (level: string) => void;
}

const INTERVIEW_FIELDS = [
  {
    value: 'frontend',
    label: 'Frontend Development',
    subfields: ['React', 'Vue', 'Angular', 'NextJS']
  },
  {
    value: 'backend',
    label: 'Backend Development',
    subfields: ['Node.js', 'Java', 'Python', 'Go']
  },
  {
    value: 'fullstack',
    label: 'Fullstack Development',
    subfields: ['MERN', 'MEAN', 'Java Full-stack']
  },
  {
    value: 'mobile',
    label: 'Mobile Development',
    subfields: ['React Native', 'Flutter', 'iOS', 'Android']
  },
  {
    value: 'devops',
    label: 'DevOps/Cloud',
    subfields: ['AWS', 'Azure', 'GCP', 'Kubernetes']
  },
  {
    value: 'data',
    label: 'Data Engineering',
    subfields: ['ETL', 'Data Warehouse', 'Big Data']
  },
  {
    value: 'ai',
    label: 'AI/ML Engineering',
    subfields: ['Machine Learning', 'Deep Learning', 'NLP']
  },
  {
    value: 'security',
    label: 'Security Engineering',
    subfields: ['Application Security', 'Network Security']
  },
  {
    value: 'qa',
    label: 'QA/Testing',
    subfields: ['Automation Testing', 'Performance Testing']
  }
];

const INTERVIEW_LEVELS = [
  {
    value: 'intern',
    label: 'Intern/Fresher (0-1 năm)',
    description: 'Kiến thức cơ bản, học việc thực tế'
  },
  {
    value: 'junior',
    label: 'Junior (1-2 năm)',
    description: 'Làm việc độc lập với tasks đơn giản'
  },
  {
    value: 'mid',
    label: 'Mid-level (2-4 năm)',
    description: 'Xử lý vấn đề phức tạp, mentor junior'
  },
  {
    value: 'senior',
    label: 'Senior (4-6 năm)',
    description: 'Thiết kế giải pháp, lead dự án nhỏ'
  },
  {
    value: 'lead',
    label: 'Tech Lead (6+ năm)',
    description: 'Kiến trúc hệ thống, quản lý team'
  },
  {
    value: 'architect',
    label: 'Solution Architect (8+ năm)',
    description: 'Thiết kế kiến trúc, định hướng công nghệ'
  }
];

const PreInterviewSetup: React.FC<PreInterviewSetupProps> = ({
  config,
  onConfigChange,
  onStartInterview,
  sessionState,
  AVATARS,
  STT_LANGUAGE_LIST,
  interviewField,
  interviewLevel,
  onFieldChange,
  onLevelChange,
}) => {
  const handleConfigChange = useCallback(<K extends keyof StartAvatarRequest>(
    key: K,
    value: StartAvatarRequest[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  return (
    <div className="min-h-screen  py-8 px-4">
      <div className="max-w-1xl mx-auto">
       

        <div className="space-y-8">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chọn Avatar</label>
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
                    {/* Avatar placeholder - you can replace with actual avatar images */}
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Ngôn ngữ</label>
            <div className="relative">
              <select
                value={config.language || ''}
                onChange={(e) => handleConfigChange('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="" disabled>Chọn ngôn ngữ</option>
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
          </div>

          {/* Interview Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Lĩnh vực phỏng vấn</label>
            <div className="relative">
              <select
                value={interviewField}
                onChange={(e) => onFieldChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">Chọn lĩnh vực</option>
                {INTERVIEW_FIELDS.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Cấp độ kinh nghiệm</label>
            <div className="relative">
              <select
                value={interviewLevel}
                onChange={(e) => onLevelChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">Chọn cấp độ</option>
                {INTERVIEW_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-6">
            <button
              onClick={() => onStartInterview()}
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
                  {sessionState === SessionState.CONNECTING ? 'Đang kết nối...' : 'Bắt đầu phỏng vấn'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreInterviewSetup;