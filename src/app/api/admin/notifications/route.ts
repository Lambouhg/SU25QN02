// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
// import { prisma } from '@/lib/prisma';
// import type { ExtendedPrismaClient } from '@/types/extended-prisma';

// // GET - Lấy notifications cho admin
// export async function GET(request: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Check if user is admin
//     const user = await prisma.user.findUnique({
//       where: { clerkId: userId },
//       select: { role: true }
//     });

//     if (!user || user.role !== 'admin') {
//       return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
//     }

//     const { searchParams } = new URL(request.url);
//     const status = searchParams.get('status');
//     const limit = parseInt(searchParams.get('limit') || '20');
//     const offset = parseInt(searchParams.get('offset') || '0');

//     const whereClause: { status?: string } = {};
//     if (status && ['UNREAD', 'READ', 'ARCHIVED'].includes(status)) {
//       whereClause.status = status;
//     }

//     const notifications = await (prisma as ExtendedPrismaClient).notification.findMany({
//       where: whereClause,
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             avatar: true
//           }
//         }
//       },
//       orderBy: { createdAt: 'desc' },
//       take: limit,
//       skip: offset
//     });

//     const totalCount = await (prisma as ExtendedPrismaClient).notification.count({ where: whereClause });

//     return NextResponse.json({
//       notifications,
//       totalCount,
//       hasMore: offset + limit < totalCount
//     });

//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // POST - Tạo notification mới
// export async function POST(request: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const data = await request.json();
//     const { type, title, message, userId: targetUserId, metadata } = data;

//     if (!type || !title || !message) {
//       return NextResponse.json(
//         { error: 'Type, title, and message are required' },
//         { status: 400 }
//       );
//     }

//     const notification = await (prisma as ExtendedPrismaClient).notification.create({
//       data: {
//         type,
//         title,
//         message,
//         userId: targetUserId || null,
//         metadata: metadata || null
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             avatar: true
//           }
//         }
//       }
//     });

//     return NextResponse.json({ notification });

//   } catch (error) {
//     console.error('Error creating notification:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // PATCH - Cập nhật status notification
// export async function PATCH(request: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Check if user is admin
//     const user = await prisma.user.findUnique({
//       where: { clerkId: userId },
//       select: { role: true }
//     });

//     if (!user || user.role !== 'admin') {
//       return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
//     }

//     const data = await request.json();
//     const { ids, status } = data;

//     if (!ids || !Array.isArray(ids) || !status) {
//       return NextResponse.json(
//         { error: 'Notification IDs and status are required' },
//         { status: 400 }
//       );
//     }

//     await (prisma as ExtendedPrismaClient).notification.updateMany({
//       where: { id: { in: ids } },
//       data: { status, updatedAt: new Date() }
//     });

//     return NextResponse.json({ success: true });

//   } catch (error) {
//     console.error('Error updating notifications:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
