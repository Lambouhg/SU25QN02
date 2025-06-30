import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import User from '@/models/user';
import { Types } from 'mongoose';
import { IInterview } from '@/models/interview';

interface InterviewTrackingProps {
  interview: {
    _id: string;
    status: string;
    evaluation?: {
      technicalScore: number;
      communicationScore: number;
      problemSolvingScore: number;
      overallRating: number;
    };
  };
}

export function useInterviewTracking({ interview }: InterviewTrackingProps) {
  const { user } = useUser();

  useEffect(() => {
    async function trackInterview() {
      if (!user?.id || interview.status !== 'completed' || !interview.evaluation) {
        return;
      }

      // Lấy MongoDB user ID từ Clerk ID
      const dbUser = await User.findOne({ clerkId: user.id });
      if (!dbUser) {
        console.error('User not found in database');
        return;
      }

      try {
        await TrackingIntegrationService.trackInterviewCompletion(
          dbUser._id.toString(),
          {
            ...interview,
            _id: new Types.ObjectId(interview._id)
          } as IInterview & { _id: Types.ObjectId }
        );
      } catch (error) {
        console.error('Error tracking interview:', error);
      }
    }

    trackInterview();
  }, [interview.status, user?.id, interview]);

  return null;
}
