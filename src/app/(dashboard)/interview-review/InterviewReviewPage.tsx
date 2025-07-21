import React from 'react';
import { Box, Typography, Paper, Rating, Chip, List, ListItem, ListItemText, Divider } from '@mui/material';
import { InterviewEvaluation } from '@/services/Avatar-AI';

interface Message {
  id?: string;
  sender?: string;
  role?: string;
  text?: string;
  content?: string;
  timestamp?: string;
  isError?: boolean;
  isThinking?: boolean;
}

interface InterviewReviewPageProps {
  evaluation: InterviewEvaluation;
  conversation: Message[];
}

const InterviewReviewPage = ({ evaluation, conversation }: InterviewReviewPageProps) => {
  const {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    cultureFitScore,
    overallRating,
    technicalStrengths,
    technicalWeaknesses,
    recommendations,
    hiringRecommendation,
    detailedFeedback,
    salary_range,
  } = evaluation;

  const getHiringRecommendationColor = (recommendation: string): "success" | "primary" | "warning" | "error" => {
    const colors = {
      strong_hire: 'success',
      hire: 'primary',
      consider: 'warning',
      reject: 'error',
    } as const;
    return colors[recommendation as keyof typeof colors];
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Kết Quả Phỏng Vấn
      </Typography>

      {/* Điểm số tổng quát */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Điểm số tổng quát
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
          <Box>
            <Typography component="legend">Kỹ thuật</Typography>
            <Rating value={technicalScore / 2} readOnly precision={0.5} />
            <Typography variant="body2">{technicalScore}/10</Typography>
          </Box>
          <Box>
            <Typography component="legend">Giao tiếp</Typography>
            <Rating value={communicationScore / 2} readOnly precision={0.5} />
            <Typography variant="body2">{communicationScore}/10</Typography>
          </Box>
          <Box>
            <Typography component="legend">Giải quyết vấn đề</Typography>
            <Rating value={problemSolvingScore / 2} readOnly precision={0.5} />
            <Typography variant="body2">{problemSolvingScore}/10</Typography>
          </Box>
          <Box>
            <Typography component="legend">Phù hợp văn hóa</Typography>
            <Rating value={cultureFitScore / 2} readOnly precision={0.5} />
            <Typography variant="body2">{cultureFitScore}/10</Typography>
          </Box>
          <Box>
            <Typography component="legend">Đánh giá tổng thể</Typography>
            <Rating value={overallRating / 2} readOnly precision={0.5} />
            <Typography variant="body2">{overallRating}/10</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Đánh giá chi tiết */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Đánh giá chi tiết
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
          <Box>
            <Typography variant="subtitle1">Điểm mạnh kỹ thuật:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {technicalStrengths.map((strength, index) => (
                <Chip 
                  key={typeof strength === 'string' ? strength + '-' + index : index} 
                  label={strength} 
                  color="success" 
                  variant="outlined" 
                  sx={{ cursor: 'default' }}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1">Điểm cần cải thiện:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {technicalWeaknesses.map((weakness, index) => (
                <Chip 
                  key={typeof weakness === 'string' ? weakness + '-' + index : index} 
                  label={weakness} 
                  color="warning" 
                  variant="outlined" 
                  sx={{ cursor: 'default' }}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1">Đề xuất cải thiện:</Typography>
            <List>
              {recommendations.map((recommendation, index) => (
                <ListItem key={typeof recommendation === 'string' ? recommendation + '-' + index : index}>
                  <ListItemText primary={recommendation} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Paper>

      {/* Đề xuất */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Đề xuất
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Đề xuất tuyển dụng:
          </Typography>
          <Chip
            label={hiringRecommendation.replace('_', ' ').toUpperCase()}
            color={getHiringRecommendationColor(hiringRecommendation)}
            sx={{ fontSize: '1rem', py: 1, cursor: 'default' }}
          />
        </Box>
        {salary_range && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Đề xuất mức lương:
            </Typography>
            <Typography>
              {salary_range.min.toLocaleString('en-US')} - {salary_range.max.toLocaleString('en-US')} {salary_range.currency}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Nhận xét chi tiết */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Nhận xét chi tiết
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Kỹ thuật"
              secondary={detailedFeedback.technical}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Kỹ năng mềm"
              secondary={detailedFeedback.softSkills}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Kinh nghiệm"
              secondary={detailedFeedback.experience}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Tiềm năng"
              secondary={detailedFeedback.potential}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Lịch sử cuộc trò chuyện */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lịch sử cuộc trò chuyện
        </Typography>
        <List>
          {conversation.map((message, index) => {
            // Support both 'sender' and 'role' fields, fallback to 'ai'/'user'/'assistant'
            const role = (message.sender || message.role || '').toLowerCase();
            const isUser = role === 'user' || role === 'me' || role === 'client';
            return (
              <React.Fragment key={message.id || index}>
                {index > 0 && <Divider key={'divider-' + (message.id || index)} />}
                <ListItem key={'listitem-' + (message.id || index)}>
                  <ListItemText
                    primary={isUser ? 'Bạn' : 'AI Interviewer'}
                    secondary={message.text || message.content}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: isUser ? 'primary.main' : 'secondary.main',
                      },
                    }}
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};

export default InterviewReviewPage;
