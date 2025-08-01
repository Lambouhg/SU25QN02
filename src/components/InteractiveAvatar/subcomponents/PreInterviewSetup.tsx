import React, { useCallback, useState } from 'react';
import { SessionState } from '../HeygenConfig';
import { StartAvatarRequest } from '@heygen/streaming-avatar';
import { useRouter } from 'next/navigation';

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
  onPositionKeyChange: (key: string) => void; // New prop for key
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
  onPositionKeyChange, // Add new prop
  positions // Sử dụng positions từ props
}) => {
  const router = useRouter();
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [selectedPositionName, setSelectedPositionName] = useState<string>('');
  const [startError, setStartError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [levelError, setLevelError] = useState('');
  const [languageError, setLanguageError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [packageLimitInfo, setPackageLimitInfo] = useState<{
    currentUsage: number;
    totalLimit: number;
    packageName: string;
  } | null>(null);

  const handleConfigChange = useCallback(<K extends keyof StartAvatarRequest>(
    key: K,
    value: StartAvatarRequest[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  }, [config, onConfigChange]);

  const handleStartInterview = async () => {
    let hasError = false;
    if (!config.language) {
      setLanguageError('Vui lòng chọn ngôn ngữ.');
      hasError = true;
    } else {
      setLanguageError('');
    }
    if (!interviewField) {
      setFieldError('Vui lòng chọn vị trí.');
      hasError = true;
    } else {
      setFieldError('');
    }
    if (!interviewLevel) {
      setLevelError('Vui lòng chọn cấp bậc.');
      hasError = true;
    } else {
      setLevelError('');
    }
    if (hasError) {
      setStartError('Vui lòng điền đầy đủ thông tin trước khi bắt đầu phỏng vấn.');
      return;
    }

    // Kiểm tra hạn mức avatarInterview bằng API check-active
    try {
      const res = await fetch('/api/user-package/check-active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (!data.hasActivePackage) {
        setPackageLimitInfo({
          currentUsage: 0,
          totalLimit: 0,
          packageName: 'Chưa có gói'
        });
        setShowUpgradeModal(true);
        return;
      }
      
      if (!data.canUse.avatarInterview) {
        // Lấy thông tin gói hiện tại để hiển thị
        setPackageLimitInfo({
          currentUsage: data.currentUsage?.avatarInterview || 0,
          totalLimit: data.totalLimit?.avatarInterview || 0,
          packageName: data.packageName || 'Gói hiện tại'
        });
        setShowUpgradeModal(true);
        return;
      }
    } catch (error) {
      console.error('Error checking package limits:', error);
      setStartError('Không kiểm tra được hạn mức. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
      return;
    }

    setStartError('');
    await onStartInterview();
  };

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
                onChange={(e) => {
                  handleConfigChange('language', e.target.value);
                  setLanguageError('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${languageError ? 'border-red-400' : 'border-gray-300'}`}
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
            {languageError && <div className="text-red-600 text-xs mt-1">{languageError}</div>}
          </div>

          {/* Position Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chọn Vị trí</label>
            <div className="relative">
              <select
                value={interviewField || ''}
                onChange={(e) => {
                  const selectedPosition = positions.find(pos => pos.positionName === e.target.value);
                  if (selectedPosition) {
                    setSelectedPositionName(selectedPosition.positionName);
                    const levels = positions
                      .filter(p => p.positionName === selectedPosition.positionName)
                      .map(p => p.level);
                    setAvailableLevels(levels);
                    onFieldChange(e.target.value);
                    onLevelChange('');
                    onPositionIdChange('');
                    setFieldError('');
                  } else {
                    setSelectedPositionName('');
                    setAvailableLevels([]);
                    onFieldChange('');
                    onLevelChange('');
                    onPositionIdChange('');
                    setFieldError('Vui lòng chọn vị trí.');
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${fieldError ? 'border-red-400' : 'border-gray-300'}`}
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
            {fieldError && <div className="text-red-600 text-xs mt-1">{fieldError}</div>}
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
                  const matchingPosition = positions.find(
                    p => p.positionName === selectedPositionName && p.level === selectedLevel
                  );
                  if (matchingPosition) {
                    onPositionKeyChange(matchingPosition.key);
                    onPositionIdChange(matchingPosition.id);
                    setLevelError('');
                  } else {
                    setLevelError('Vui lòng chọn cấp bậc.');
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${levelError ? 'border-red-400' : 'border-gray-300'}`}
                disabled={!selectedPositionName}
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
            {levelError && <div className="text-red-600 text-xs mt-1">{levelError}</div>}
          </div>

          {/* Start Button */}
          <div className="pt-6">
            {startError && (
              <div className="mb-4 flex items-center bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
                <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                </svg>
                <span>{startError}</span>
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
                  {sessionState === SessionState.CONNECTING ? 'Đang kết nối...' : 'Bắt đầu phỏng vấn'}
                </span>
              </div>
            </button>
          </div>

          {/* Upgrade Modal */}
          {showUpgradeModal && packageLimitInfo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="text-center">
                  {/* Icon */}
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Nâng cấp gói dịch vụ
                  </h3>
                  
                  {/* Message */}
                  <p className="text-gray-600 mb-4">
                    {packageLimitInfo.packageName === 'Chưa có gói' 
                      ? 'Bạn chưa có gói dịch vụ hoặc gói đã hết hạn.'
                      : `Bạn đã sử dụng hết ${packageLimitInfo.currentUsage}/${packageLimitInfo.totalLimit} lượt phỏng vấn avatar của gói ${packageLimitInfo.packageName}.`
                    }
                  </p>
                  
                  {/* Usage Progress */}
                  {packageLimitInfo.packageName !== 'Chưa có gói' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Lượt sử dụng</span>
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
                  
                  {/* Benefits */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Lợi ích khi nâng cấp:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Nhiều lượt phỏng vấn avatar hơn
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Truy cập tất cả tính năng premium
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Hỗ trợ ưu tiên
                      </li>
                    </ul>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                    >
                      Để sau
                    </button>
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        router.push('/Pricing');
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Nâng cấp ngay
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