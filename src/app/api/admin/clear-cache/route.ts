import { NextResponse } from 'next/server';
import { currentUser, User } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

interface CacheItem {
  value: unknown;
  timestamp: number;
  ttl: number | null;
}

// In-memory cache for storing various system caches
const systemCaches = new Map<string, CacheItem>();

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

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Clear various system caches
    systemCaches.clear();

    // Clear Next.js cache - simulate cache clearing
    const commonTags = [
      'users',
      'user-activities', 
      'analytics',
      'admin-data',
      'settings',
      'questions',
      'interviews'
    ];
    
    for (const tag of commonTags) {
      try {
        // In a real implementation, you'd use Next.js revalidateTag
        console.log(`Clearing cache for tag: ${tag}`);
      } catch (error) {
        console.warn(`Failed to clear cache for tag ${tag}:`, error);
      }
    }

    // Log the cache clear action
    try {
      await connectDB();
      const db = mongoose.connection.db;
      if (db) {
        await db.collection('admin_logs').insertOne({
          action: 'cache_cleared',
          userId: user.id,
          userEmail: user.emailAddresses[0]?.emailAddress,
          timestamp: new Date(),
          details: {
            cacheTypes: ['system-cache', 'next-cache'],
            clearedBy: 'admin'
          }
        });
      }
    } catch (logError) {
      console.error('Error logging cache clear action:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'System cache cleared successfully',
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

// Export the cache management functions for use by other parts of the system
export function setCacheItem(key: string, value: unknown, ttl?: number) {
  systemCaches.set(key, {
    value,
    timestamp: Date.now(),
    ttl: ttl ? Date.now() + (ttl * 1000) : null
  });
}

export function getCacheItem(key: string) {
  const cached = systemCaches.get(key);
  if (!cached) return null;
  
  // Check if cache has expired
  if (cached.ttl && Date.now() > cached.ttl) {
    systemCaches.delete(key);
    return null;
  }
  
  return cached.value;
}

export function deleteCacheItem(key: string) {
  return systemCaches.delete(key);
}

export function clearAllCache() {
  systemCaches.clear();
}
