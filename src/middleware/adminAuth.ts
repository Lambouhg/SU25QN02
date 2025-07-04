import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function withAdminAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const { userId } = getAuth(req);
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' }, 
          { status: 401 }
        );
      }

      // Kiểm tra role admin từ database
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        return NextResponse.json(
          { error: 'User not found' }, 
          { status: 404 }
        );
      }

      const userData = await userResponse.json();
      
      if (userData.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' }, 
          { status: 403 }
        );
      }

      // Nếu là admin, tiếp tục xử lý request
      return handler(req);
      
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}
