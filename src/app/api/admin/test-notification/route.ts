import { NextRequest, NextResponse } from 'next/server';
import NotificationService from '@/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      );
    }

    // Simulate user registration notification
    await NotificationService.notifyUserRegistration({
      userId: userId,
      firstName: firstName || '',
      lastName: lastName || '',
      email
    });

    return NextResponse.json({
      success: true,
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
