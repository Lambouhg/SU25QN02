import React from 'react';
import { Box } from '@mui/material';
import VideoPlayer from './subcomponents/VideoPlayer';
import ChatControls from './subcomponents/ChatControls';
import PreInterviewSetup from './subcomponents/PreInterviewSetup';
import InterviewResult from './subcomponents/InterviewResult';
import AutoPromptIndicator from './subcomponents/AutoPromptIndicator';
import { AVATARS, STT_LANGUAGE_LIST, SessionState } from './HeygenConfig';
import { useAvatarInterviewSession, Interview } from './hooks/useAvatarInterviewSession';

const transformedLanguageList = STT_LANGUAGE_LIST;

interface InteractiveAvatarProps {
  onEndSession?: (data?: Interview) => void;
}

const InteractiveAvatar: React.FC<InteractiveAvatarProps> = ({ onEndSession }) => {
  const [interviewResult, setInterviewResult] = React.useState<Interview | null>(null);



  // UI callback khi nhận kết quả phỏng vấn
  const handleEndSessionUI = (data: Interview) => {
    console.log('handleEndSessionUI called with data:', data);
    setInterviewResult(data);
    // Gọi onEndSession từ component cha nếu có
    if (onEndSession) {
      onEndSession(data);
    }
  };

  // Handler để chuyển đến trang evaluation
  const handleViewEvaluation = () => {
    if (interviewResult?.id) {
      window.location.href = `/avatar-interview/evaluation?id=${interviewResult.id}`;
    }
  };

  const handleBackToInterview = () => {
    setInterviewResult(null);
    // Có thể reset thêm các state khác nếu muốn
  };

  // Handler for VideoPlayer onStopSession (no-arg)
  const handleStopSession = async () => {
    // Reset UI or state as needed when user stops session manually
    setInterviewResult(null);
    resetAutoPrompt(); // Reset auto-prompt when stopping session
    await handleEndSession(); // cleanup Heygen/avatar session đúng chuẩn
    if (onEndSession) {
      onEndSession();
    }
  };

  // Enhanced handlers that reset auto-prompt
  const handleSendMessageWithReset = async () => {
    resetAutoPrompt(); // Reset auto-prompt when user sends message
    await handleSendMessage();
  };

  const handleSpeechResultWithReset = (text: string) => {
    resetAutoPrompt(); // Reset auto-prompt when user speaks
    handleSpeechResult(text);
  };

  const {
    config, setConfig,
    connectionQuality,
    positions,
    isAvatarTalking,
    message, setMessage,
    positionType, setPositionType,
    positionName, setPositionName,
    isInterviewComplete,
    isSubmitting,
    elapsedTime,
    formatElapsedTime,
    sessionState,
    videoRef,
    initializeSession,
    handleSendMessage,
    handleSpeechResult,
    conversation,
    isThinking,
    interviewState,
    questionCount,
    handleInterruptAvatar,
    isInterrupting,
    setPositionKey,
    setPositionId,
    isSavingInterview,
    isInitializingInterview,
    autoPromptCount,
    isAutoPromptActive,
    resetAutoPrompt,
    handleEndSession
  } = useAvatarInterviewSession({ onEndSession: handleEndSessionUI });

  return (
    <>
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {(isSavingInterview || isInitializingInterview) && (
          <div
            style={{
              position: 'absolute',
              zIndex: 9999,
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <svg className="animate-spin mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="#3B82F6" strokeWidth="4" opacity="0.2" />
              <path d="M44 24c0-11.046-8.954-20-20-20" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <div style={{fontSize: '1.2rem', color: '#2563eb', fontWeight: 500}}>
              {isSavingInterview
                ? 'Đang lưu kết quả phỏng vấn...'
                : 'Đang chuẩn bị phỏng vấn...'}
            </div>
          </div>
        )}
        {interviewResult ? (
          <InterviewResult 
            interview={interviewResult} 
            onBack={handleBackToInterview} 
            onViewEvaluation={handleViewEvaluation}
          />
        ) : sessionState === SessionState.INACTIVE ? (
          <PreInterviewSetup
            config={config}
            onConfigChange={setConfig}
            onStartInterview={initializeSession}
            sessionState={sessionState}
            AVATARS={AVATARS}
            STT_LANGUAGE_LIST={transformedLanguageList}
            interviewField={positionName}
            interviewLevel={positionType}
            onFieldChange={setPositionName}
            onLevelChange={setPositionType}
            onPositionIdChange={setPositionId}
            onPositionKeyChange={setPositionKey}
            positions={positions}
          />
        ) : (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <VideoPlayer
              videoRef={videoRef}
              connectionQuality={connectionQuality}
              sessionState={sessionState}
              avatarId={config.avatarName}
              avatarName={AVATARS.find(a => a.avatar_id === config.avatarName)?.name || ''}
              SessionState={SessionState}
              onStopSession={handleStopSession}
              onInterruptAvatar={handleInterruptAvatar}
              isAvatarTalking={isAvatarTalking}
              isInterrupting={isInterrupting}
              elapsedTime={formatElapsedTime(elapsedTime)}
              onSpeechResult={handleSpeechResultWithReset}
              voiceDisabled={sessionState !== SessionState.CONNECTED || isInterviewComplete || isSubmitting}
              voiceLanguage={config.language === 'en' ? 'en-US' : 'vi-VN'}
            />
            
            <ChatControls
              sessionState={sessionState}
              inputText={message}
              setInputText={setMessage}
              isAvatarTalking={isAvatarTalking}
              conversation={conversation}
              onSendMessage={handleSendMessageWithReset}
              isThinking={isThinking}
              isInterviewComplete={isInterviewComplete}
              questionCount={questionCount}
              skillAssessment={interviewState.skillAssessment}
              coveredTopics={interviewState.coveredTopics}
              progress={interviewState.progress || 0}
            />
            
            {/* Auto-prompt indicator with remaining prompts info */}
            {isAutoPromptActive && !isAvatarTalking && !isThinking && !isInterviewComplete && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: '80px',
                  right: '20px',
                  background: 'rgba(33, 150, 243, 0.9)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  zIndex: 999,
                  border: '1px solid #2196f3',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ color: 'white', fontSize: '0.8rem', textAlign: 'center' }}>
                  {config.language === 'en' 
                    ? `AI auto-prompts remaining: ${3 - autoPromptCount}`
                    : `AI sẽ nhắc lại: ${3 - autoPromptCount} lần`
                  }
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', textAlign: 'center', marginTop: '2px' }}>
                  {config.language === 'en' 
                    ? 'AI will generate contextual prompts'
                    : 'AI sẽ tạo lời nhắc phù hợp'
                  }
                </div>
              </Box>
            )}
            
            <AutoPromptIndicator
              isActive={isAutoPromptActive && !isAvatarTalking && !isThinking && !isInterviewComplete}
              duration={10000} // 10 seconds to match AUTO_PROMPT_DELAY
              onTimeout={() => {}} // Timer được handle trong useAIConversation
              language={config.language === 'en' ? 'en-US' : 'vi-VN'}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default InteractiveAvatar;
