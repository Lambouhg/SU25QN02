import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import {
  getUserListCache,
  setUserListCache,
  getUserUpdateCache,
  getUserCache,
  USER_LIST_CACHE_DURATION
} from "../../../lib/userCache";
import { withCORS } from '../../../lib/utils';
// import NotificationService from "../../../services/notificationService";

export async function OPTIONS() {
  return withCORS(new NextResponse(null, { status: 200 }));
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    const currentCache = getUserListCache();
    if (currentCache && (now - currentCache.timestamp) < USER_LIST_CACHE_DURATION) {
      return withCORS(NextResponse.json(currentCache.data));
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
    const transformedUsers = users.map((user: { [key: string]: unknown }) => {
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
    setUserListCache(responseData);

    return withCORS(NextResponse.json(responseData));
  } catch (error) {
    console.error("Error fetching users:", error);
    return withCORS(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, clerkId, avatar } = body;

    if (!email || !clerkId) {
      return withCORS(NextResponse.json({ error: "Email and clerkId are required" }, { status: 400 }));
    }

    // Check if user was recently updated (within last hour) to avoid unnecessary updates
    const recentUpdateKey = `user_update_${clerkId}`;
    const userUpdateCache = getUserUpdateCache();
    const lastUpdate = userUpdateCache.get(recentUpdateKey);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    if (lastUpdate && lastUpdate > oneHourAgo) {
      // Return cached user data if recently updated
      const userCache = getUserCache();
      const cachedUser = userCache.get(clerkId);
      if (cachedUser) {
        return withCORS(NextResponse.json({
          message: "User data is current (cached)",
          user: cachedUser,
          action: "cached"
        }));
      }
    }

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        userPackages: {
          where: { isActive: true },
          include: { servicePackage: true }
        }
      }
    });

    const isNewUser = !existingUser;
    
    console.log(`User check - isNewUser: ${isNewUser}, existingUserPackages: ${existingUser?.userPackages?.length || 0}`);

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

    // Sau khi upsert, kiểm tra lại xem user có gói active không
    const userWithPackages = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userPackages: {
          where: { 
            isActive: true,
            endDate: { gte: new Date() } // Chỉ tính gói còn hạn
          }
        }
      }
    });

    const hasActivePackage = userWithPackages && userWithPackages.userPackages.length > 0;
    const shouldAssignFreePackage = isNewUser || !hasActivePackage;
    
    console.log(`User check - isNewUser: ${isNewUser}, hasActivePackage: ${hasActivePackage}, shouldAssignFreePackage: ${shouldAssignFreePackage}`);
    console.log(`User packages count: ${userWithPackages?.userPackages?.length || 0}`);
    
    if (shouldAssignFreePackage) {
      try {
        // Tìm gói free (giá = 0 hoặc tên chứa "free")
        console.log('Đang tìm gói free...');
        const freePackage = await prisma.servicePackage.findFirst({
          where: {
            OR: [
              { price: 0 },
              { 
                name: {
                  contains: 'free',
                  mode: 'insensitive' // Không phân biệt hoa thường
                }
              }
            ],
            isActive: true
          }
        });

        console.log('Gói free tìm được:', freePackage ? `${freePackage.name} (${freePackage.price})` : 'Không tìm thấy');

        if (freePackage) {
          // Kiểm tra xem user đã có gói free này chưa
          const existingFreePackage = await prisma.userPackage.findFirst({
            where: {
              userId: user.id,
              servicePackageId: freePackage.id,
              isActive: true
            }
          });

          if (existingFreePackage) {
            console.log(`User ${user.email} đã có gói free "${freePackage.name}" rồi`);
          } else {
            // Tạo user package với gói free
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // Gói free có thời hạn 1 năm

            await prisma.userPackage.create({
              data: {
                userId: user.id,
                servicePackageId: freePackage.id,
                startDate: new Date(),
                endDate: endDate,
                isActive: true
              }
            });

            const userType = isNewUser ? 'mới' : 'chưa có gói';
            console.log(`Đã tự động gán gói free "${freePackage.name}" cho user ${userType}: ${user.email}`);
          }
        } else {
          console.log('Không tìm thấy gói free trong hệ thống');
        }
      } catch (packageError) {
        console.error('Lỗi khi gán gói free:', packageError);
        // Không throw error để không ảnh hưởng đến việc tạo user
      }
    }

    return withCORS(NextResponse.json(user));
  } catch (error) {
    console.error("Error in user API:", error);
    return withCORS(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}
