import { NextRequest, NextResponse } from 'next/server';
import { currentUser, User } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

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

async function isUserAdmin(user: User): Promise<boolean> {
  if (!user) return false;

  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) return false;
    
    const userDoc = await db.collection('users').findOne({ clerkId: user.id });
    return userDoc?.role === 'admin';
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

    const isAdmin = await isUserAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get settings from database
    const settingsDoc = await db.collection('system_settings').findOne({ type: 'global' });
    const settings = settingsDoc ? { ...defaultSettings, ...settingsDoc.settings } : defaultSettings;

    return NextResponse.json({ 
      success: true, 
      settings 
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

    const isAdmin = await isUserAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
    }

    // Validate settings structure
    const validatedSettings: Partial<SystemSettings> = {};
    Object.keys(defaultSettings).forEach(key => {
      if (settings.hasOwnProperty(key)) {
        validatedSettings[key as keyof SystemSettings] = settings[key];
      }
    });

    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Upsert settings in database
    await db.collection('system_settings').updateOne(
      { type: 'global' },
      {
        $set: {
          type: 'global',
          settings: validatedSettings,
          updatedAt: new Date(),
          updatedBy: user.id
        }
      },
      { upsert: true }
    );

    // Log the settings change
    await db.collection('admin_logs').insertOne({
      action: 'settings_updated',
      userId: user.id,
      userEmail: user.emailAddresses[0]?.emailAddress,
      timestamp: new Date(),
      details: {
        settingsChanged: Object.keys(validatedSettings)
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
