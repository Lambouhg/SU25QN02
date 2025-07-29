import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TrackingIntegrationService } from '@/services/trackingIntegrationService';
import { corsOptionsResponse, withCORS } from '@/lib/utils';

// Helper function to create CORS-enabled JSON response
function corsJsonResponse(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  return withCORS(response);
}

// Define AssessmentType enum locally
enum AssessmentType {
  test = 'test',
  eq = 'eq'
}

// Handle preflight requests
export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return withCORS(response);
  }

  try {
    const body = await request.json();
    const { type = 'test', positionId, position, topic, ...rest } = body; // Nhận positionId/position và topic

    // Kiểm tra type hợp lệ
    if (type !== 'test' && type !== 'eq') {
      return NextResponse.json({ error: 'Invalid type. Must be "test" or "eq"' }, { status: 400 });
    }
    
    // Yêu cầu có position hoặc positionId
    if (!positionId && !position) {
      return NextResponse.json({ error: 'Position or positionId is required' }, { status: 400 });
    }

    // Xây dựng data object
    const data = {
      userId,
      type: type as AssessmentType,
      ...rest,
    };
    
    // Lưu topic vào realTimeScores nếu có
    if (topic) {
      // Nếu đã có realTimeScores, thêm topic vào đó
      if (data.realTimeScores) {
        data.realTimeScores = {
          ...JSON.parse(JSON.stringify(data.realTimeScores)),
          topic
        };
      } else {
        // Nếu chưa có realTimeScores, tạo mới với topic
        data.realTimeScores = { topic };
      }
    }

    // Nếu có positionId, sử dụng positionId
    if (positionId) {
      const positionRecord = await prisma.position.findUnique({
        where: { id: positionId }
      });
      if (!positionRecord) {
        return NextResponse.json({ error: 'Position not found' }, { status: 400 });
      }
      data.positionId = positionId;
    } else if (position) {
      // Nếu không có positionId nhưng có position string, tìm hoặc tạo position
      let positionRecord = await prisma.position.findFirst({
        where: { positionName: position }
      });
      
      if (!positionRecord) {
        // Tạo position mới nếu chưa có
        positionRecord = await prisma.position.create({
          data: {
            key: position.toLowerCase().replace(/\s+/g, '_'),
            positionName: position,
            level: 'Junior', // Default level
            displayName: position,
            order: 0
          }
        });
      }
      data.positionId = positionRecord.id;
    }

    const assessment = await prisma.assessment.create({
      data,
      include: {
        position: true, // Include position data trong response
      },
    });

    // Find the database user ID for the Clerk user
    let dbUserId = null;
    try {
      // Look up the user in the database using clerkId
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true }
      });
      
      if (dbUser) {
        dbUserId = dbUser.id;
        console.log(`[API] Found database user ID ${dbUserId} for Clerk user ${userId}`);
      } else {
        console.log(`[API] Could not find database user for Clerk ID ${userId}`);
      }
    } catch (userLookupError) {
      console.error('[API] Error looking up database user:', userLookupError);
    }
    
    // Prepare response with both IDs for client
    const responseData = {
      ...assessment,
      userId,          // The Clerk ID
      clerkId: userId, // Explicitly labeled Clerk ID
      dbUserId         // The database user ID
    };

    // Log position và topic information
    console.log(`[API] Assessment created with position: ${assessment.position?.positionName || 'Unknown'}, level: ${assessment.position?.level || 'Unknown'}`);
    if (topic) {
      console.log(`[API] Assessment includes topic: ${topic}`);
    }

    // Track assessment completion
    try {
      if (dbUserId) {
        // We have a valid database user ID - pass both IDs for complete context
        await TrackingIntegrationService.trackAssessmentCompletion(dbUserId, assessment, { clerkId: userId });
        console.log(`[API] Successfully tracked assessment completion for user ${dbUserId} (Clerk ID: ${userId})`);
      } else {
        console.warn(`[API] Skipping tracking - could not find database user ID for Clerk user ${userId}`);
      }
    } catch (trackingError) {
      console.error('[API] Error tracking assessment completion:', trackingError);
      // Continue and return results, just log the error
    }

    return corsJsonResponse(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return corsJsonResponse({ 
      error: 'Lưu kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return corsJsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'test' hoặc 'eq'

    // Nếu có type, filter theo type. Nếu không, lấy tất cả
    const where = typeParam && (typeParam === 'test' || typeParam === 'eq')
      ? { userId, type: typeParam as AssessmentType }
      : { userId };

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        position: true, // Include position data
      },
      orderBy: { createdAt: 'desc' },
    });

    return corsJsonResponse(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return corsJsonResponse({ 
      error: 'Lấy kết quả thất bại', 
      detail: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
