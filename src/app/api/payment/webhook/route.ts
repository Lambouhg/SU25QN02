import { WebhookType } from '@payos/node/lib/type';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WebhookType;
    const {
      success,
      data: { orderCode },
    } = body;

    console.log('Webhook received:', body);

        // Tìm PaymentHistory theo orderCode
    const paymentHistory = await prisma.paymentHistory.findFirst({
      where: {
        orderCode: String(orderCode),
      },
      include: {
        servicePackage: true,
        user: true,
      },
    });

    console.log('Found PaymentHistory:', paymentHistory);

    if (paymentHistory && success) {
      console.log('Payment successful, updating PaymentHistory and creating UserPackage...');
      
      // Cập nhật PaymentHistory thành success
      await prisma.paymentHistory.update({
        where: { id: paymentHistory.id },
        data: {
          status: 'success',
          transactionId: String(body.data?.orderCode || ''),
          paidAt: new Date()
        }
      });

      // Tạo hoặc cập nhật UserPackage cho gói đã mua thành công
      const now = new Date();
      const endDate = new Date(now.getTime() + paymentHistory.servicePackage.duration * 24 * 60 * 60 * 1000);

      const newUserPackage = await prisma.userPackage.upsert({
        where: {
          userId_servicePackageId: {
            userId: paymentHistory.userId,
            servicePackageId: paymentHistory.servicePackageId
          }
        },
        update: {
          startDate: now,
          endDate,
          isActive: true,
          avatarInterviewUsed: 0,
          testQuizEQUsed: 0,
          jdUploadUsed: 0
        },
        create: {
          userId: paymentHistory.userId,
          servicePackageId: paymentHistory.servicePackageId,
          startDate: now,
          endDate,
          isActive: true,
          avatarInterviewUsed: 0,
          testQuizEQUsed: 0,
          jdUploadUsed: 0
        }
      });

      // Deactivate tất cả gói cũ của user này
      await prisma.userPackage.updateMany({
        where: {
          userId: paymentHistory.userId,
          isActive: true,
          id: { not: newUserPackage.id }
        },
        data: { isActive: false }
      });

      console.log(`PaymentHistory ${paymentHistory.id} updated to success`);
      console.log(`New UserPackage ${newUserPackage.id} created for user ${paymentHistory.userId}`);
      console.log(`Old packages deactivated for user ${paymentHistory.userId}`);
    }

    return NextResponse.json(
      {
        success: true,
        error: 0,
        message: 'Ok',
        data: body,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      {
        success: true,
        error: 0,
        message: 'Ok',
      },
      { status: 200 }
    );
  }
}