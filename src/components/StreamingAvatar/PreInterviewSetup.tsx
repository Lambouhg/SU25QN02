import React, { useCallback, useState } from 'react';
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
  onPositionIdChange: (id: string) => void; // New prop for _id
  positions: Position[]; // Add positions prop
}

interface Position {
  id: string;  // Thay đổi từ _id sang id để phù hợp với Prisma
  key: string;
  positionName: string;
  level: string;
  displayName: string;
  order: number;
}

const PreInterviewSetup: React.FC<PreInterviewSetupProps> = ({
  config,
  onConfigChange,
  onStartInterview,
  sessionState,
  AVATARS,
  STT_LANGUAGE_LIST,
  interviewField,
  onFieldChange,
  interviewLevel,
  onLevelChange,
  onPositionIdChange,
  positions // Sử dụng positions từ props
}) => {
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [selectedPositionName, setSelectedPositionName] = useState<string>('');

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

          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chọn Vị trí</label>
            <div className="relative">
              <select
                value={interviewField || ''} // Use empty string as default
                onChange={(e) => {
                  const selectedPosition = positions.find(pos => pos.positionName === e.target.value);
                  if (selectedPosition) {
                    setSelectedPositionName(selectedPosition.positionName);
                    // Get all levels for this position
                    const levels = positions
                      .filter(p => p.positionName === selectedPosition.positionName)
                      .map(p => p.level);
                    setAvailableLevels(levels);
                    // Update the field with selected position name
                    onFieldChange(e.target.value);
                    // Reset only the level and position ID
                    onLevelChange('');
                    onPositionIdChange('');
                  } else {
                    // Clear everything if no position is selected
                    setSelectedPositionName('');
                    setAvailableLevels([]);
                    onFieldChange('');
                    onLevelChange('');
                    onPositionIdChange('');
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">Chọn vị trí</option>
                {Array.from(new Set(positions.map(p => p.positionName))).sort().map(positionName => (
                  <option key={positionName} value={positionName}>
                    {positionName}
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

          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Cấp độ</label>
            <div className="relative">
              <select
                value={interviewLevel || ''}
                onChange={(e) => {
                  const selectedLevel = e.target.value;
                  onLevelChange(selectedLevel);
                  
                  // Find the position with matching name and level
                  const matchingPosition = positions.find(
                    p => p.positionName === selectedPositionName && p.level === selectedLevel
                  );
                  
                  if (matchingPosition) {
                    onFieldChange(matchingPosition.key);
                    onPositionIdChange(matchingPosition.id);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                disabled={!selectedPositionName} // Disabled if no position is selected
              >
                <option value="">Chọn cấp độ</option>
                {availableLevels.sort().map(level => (
                  <option key={level} value={level}>
                    {level}
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