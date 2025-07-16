import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cache for user list to prevent frequent database queries
interface UserListCacheData {
  success: boolean;
  users: object[];
  totalCount: number;
}

let userListCache: { data: UserListCacheData; timestamp: number } | null = null;
const USER_LIST_CACHE_DURATION = 30000; // 30 seconds

// Function to invalidate the cache
export function invalidateUserListCache() {
  userListCache = null;
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (userListCache && (now - userListCache.timestamp) < USER_LIST_CACHE_DURATION) {
      return NextResponse.json(userListCache.data);
    }
    
    // Select specific fields including activity tracking fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        lastLogin: true,
        lastActivity: true,
        lastSignInAt: true,
        isOnline: true,
        clerkSessionActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { lastActivity: 'desc' },
        { lastLogin: 'desc' }
      ]
    });
    
    // Transform the users to ensure fullName and imageUrl are properly set
    const transformedUsers = users.map(user => {
      // Calculate fullName from firstName and lastName
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
      
      return {
        ...user,
        fullName,
        imageUrl: user.avatar // Add imageUrl as alias for avatar
      };
    });
    
    const responseData = {
      success: true,
      users: transformedUsers,
      totalCount: transformedUsers.length
    };

    // Update cache
    userListCache = { data: responseData, timestamp: now };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, clerkId, avatar } = body;

    if (!email || !clerkId) {
      return NextResponse.json({ error: "Email and clerkId are required" }, { status: 400 });
    }

    // Sử dụng upsert để tránh race condition
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        avatar: avatar || undefined,
        lastLogin: new Date()
      },
      create: {
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        avatar: avatar || '',
        lastLogin: new Date(),
        role: 'user'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        clerkId: true,
        role: true,
        avatar: true,
        lastLogin: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
