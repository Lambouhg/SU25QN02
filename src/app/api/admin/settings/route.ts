import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '../../../../lib/prisma';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  enableRegistration: boolean;
  enableEmailNotifications: boolean;
  maintenanceMode: boolean;
  maxUsersPerDay: number;
  sessionTimeout: number;
  allowGuestAccess: boolean;
  defaultUserRole: 'user' | 'admin';
  emailProvider: 'smtp' | 'sendgrid' | 'mailgun';
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  themeColor: string;
  logoUrl: string;
  enableAnalytics: boolean;
  googleAnalyticsId: string;
  enableDebugMode: boolean;
  cacheTimeout: number;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
}

const defaultSettings: SystemSettings = {
  siteName: 'Interview Platform',
  siteDescription: 'AI-Powered Interview Practice Platform',
  siteUrl: 'https://your-domain.com',
  adminEmail: 'admin@example.com',
  enableRegistration: true,
  enableEmailNotifications: true,
  maintenanceMode: false,
  maxUsersPerDay: 100,
  sessionTimeout: 3600,
  allowGuestAccess: false,
  defaultUserRole: 'user',
  emailProvider: 'smtp',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  themeColor: '#3B82F6',
  logoUrl: '',
  enableAnalytics: true,
  googleAnalyticsId: '',
  enableDebugMode: false,
  cacheTimeout: 300,
  maxFileUploadSize: 10,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt']
};

async function isUserAdmin(clerkId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true }
    });
    return user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get settings from database
    const settingsRecord = await prisma.settings.findUnique({
      where: { key: 'system_settings' }
    });

    if (!settingsRecord) {
      // Create default settings if not exists
      await prisma.settings.create({
        data: {
          key: 'system_settings',
          value: JSON.parse(JSON.stringify(defaultSettings))
        }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json({ 
      success: true, 
      settings: settingsRecord.value 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
    }

    // Validate settings structure
    const validatedSettings = { ...defaultSettings };
    for (const [key, value] of Object.entries(settings)) {
      if (key in defaultSettings) {
        (validatedSettings as Record<string, unknown>)[key] = value;
      }
    }

    // Upsert settings in database
    await prisma.settings.upsert({
      where: { key: 'system_settings' },
      update: {
        value: JSON.parse(JSON.stringify(validatedSettings)),
        updatedAt: new Date()
      },
      create: {
        key: 'system_settings',
        value: JSON.parse(JSON.stringify(validatedSettings))
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
