import React from 'react';
import { Box } from '@mui/material';
import VideoPlayer from './subcomponents/VideoPlayer';
import ChatControls from './subcomponents/ChatControls';
import PreInterviewSetup from './subcomponents/PreInterviewSetup';
import VoiceInteraction from './subcomponents/VoiceInteraction';
import InterviewResult from './subcomponents/InterviewResult';
import { AVATARS, STT_LANGUAGE_LIST, SessionState } from './HeygenConfig';
import { useAvatarInterviewSession, Interview } from './hooks/useAvatarInterviewSession';

const transformedLanguageList = STT_LANGUAGE_LIST;

const InteractiveAvatar: React.FC = () => {
  const [interviewResult, setInterviewResult] = React.useState<Interview | null>(null);

  const handleEndSession = (data: Interview) => {
    setInterviewResult(data);
    // Nếu muốn callback cha, gọi onEndSession(data);
  };

  const handleBackToInterview = () => {
    setInterviewResult(null);
    // Có thể reset thêm các state khác nếu muốn
  };

  // Handler for VideoPlayer onStopSession (no-arg)
  const handleStopSession = () => {
    // Reset UI or state as needed when user stops session manually
    setInterviewResult(null);
    // Optionally: reset other states if needed
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
    isInitializingInterview
  } = useAvatarInterviewSession({ onEndSession: handleEndSession });

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
          <InterviewResult interview={interviewResult} onBack={handleBackToInterview} />
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
            />
            <Box sx={{ p: 2 }}>
              <VoiceInteraction
                onSpeechResult={handleSpeechResult}
                disabled={sessionState !== SessionState.CONNECTED || isInterviewComplete || isSubmitting}
                language={config.language === 'en' ? 'en-US' : 'vi-VN'}
                isAvatarTalking={isAvatarTalking}
              />
            </Box>
            <ChatControls
              sessionState={sessionState}
              inputText={message}
              setInputText={setMessage}
              isAvatarTalking={isAvatarTalking}
              conversation={conversation}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
              isInterviewComplete={isInterviewComplete}
              questionCount={questionCount}
              skillAssessment={interviewState.skillAssessment}
              coveredTopics={interviewState.coveredTopics}
              progress={interviewState.progress || 0}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default InteractiveAvatar;
