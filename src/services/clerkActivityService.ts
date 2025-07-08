import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/user";

export class ClerkActivityService {
  /**
   * Retry function với exponential backoff
   */
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryOperation(operation, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Sync user session data từ Clerk
   */
  static async syncUserSession(clerkId: string) {
    return this.retryOperation(async () => {
      try {
        await connectDB();
        
        // Lấy user từ Clerk
        const clerkUserClient = await clerkClient();
        const clerkUser = await clerkUserClient.users.getUser(clerkId);
      
        const now = new Date();

        // Tìm hoặc tạo user
        let user = await User.findOne({ clerkId });
        
        if (!user) {
          user = new User({
            clerkId,
            email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkId}@temp.com`,
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            avatar: clerkUser.imageUrl || '',
            isOnline: true,
            clerkSessionActive: true,
            lastActivity: now,
            lastSignInAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : now
          });
        } else {
          user.isOnline = true;
          user.clerkSessionActive = true;
          user.lastActivity = now;
          user.lastSignInAt = clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : now;
          
          // Update other fields if needed
          if (clerkUser.emailAddresses[0]?.emailAddress) {
            user.email = clerkUser.emailAddresses[0].emailAddress;
          }
          if (clerkUser.firstName) user.firstName = clerkUser.firstName;
          if (clerkUser.lastName) user.lastName = clerkUser.lastName;
          if (clerkUser.imageUrl) user.avatar = clerkUser.imageUrl;
        }

        await user.save();
        
        return user;
      } catch (error) {
        console.error('❌ Failed to sync user session:', error);
        throw error;
      }
    });
  }

  /**
   * Set user offline (khi session ended)
   */
  static async setUserOffline(clerkId: string) {
    try {
      await connectDB();
      
      await User.findOneAndUpdate(
        { clerkId },
        {
          isOnline: false,
          clerkSessionActive: false,
          lastActivity: new Date()
        }
      );
    } catch (error) {
      console.error('Failed to set user offline:', error);
    }
  }

  /**
   * Lấy active users từ Clerk sessions
   */
  static async getActiveUsers() {
    try {
      await connectDB();
      
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000); // Tăng từ 5 phút lên 15 phút
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        onlineUsers, 
        dailyActive,
        weeklyActive
      ] = await Promise.all([
        User.countDocuments(),
        
        // Users với active Clerk session trong 15 phút qua (thay vì 5 phút)
        User.countDocuments({
          clerkSessionActive: true,
          lastActivity: { $gte: fifteenMinutesAgo }
        }),
        
        // Daily active users (based on lastSignInAt or lastActivity)
        User.countDocuments({
          $or: [
            { lastSignInAt: { $gte: oneDayAgo } },
            { lastActivity: { $gte: oneDayAgo } }
          ]
        }),
        
        // Weekly active users
        User.countDocuments({
          $or: [
            { lastSignInAt: { $gte: oneWeekAgo } },
            { lastActivity: { $gte: oneWeekAgo } }
          ]
        })
      ]);

      const activityPercentage = totalUsers > 0 ? Math.round((dailyActive / totalUsers) * 100) : 0;

      return {
        totalUsers,
        activeUsers: {
          daily: dailyActive,
          weekly: weeklyActive,
          monthly: weeklyActive, // Sử dụng weekly làm tạm
          currentlyOnline: onlineUsers
        },
        activityPercentage,
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      console.error('Failed to get active users:', error);
      return {
        totalUsers: 0,
        activeUsers: { daily: 0, weekly: 0, monthly: 0, currentlyOnline: 0 },
        activityPercentage: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Lấy danh sách users online (cho admin)
   */
  static async getOnlineUsersList(limit = 10) {
    try {
      await connectDB();
      
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const onlineUsers = await User.find({
        clerkSessionActive: true,
        lastActivity: { $gte: fifteenMinutesAgo }
      })
      .select('firstName lastName email avatar lastActivity')
      .sort({ lastActivity: -1 })
      .limit(limit);

      return onlineUsers;
    } catch (error) {
      console.error('Failed to get online users list:', error);
      return [];
    }
  }

  /**
   * Cleanup inactive sessions (chạy định kỳ)
   */
  static async cleanupInactiveSessions() {
    try {
      await connectDB();
      
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // Tăng từ 10 phút lên 30 phút
      
      const result = await User.updateMany(
        {
          clerkSessionActive: true,
          lastActivity: { $lt: thirtyMinutesAgo }
        },
        {
          $set: {
            clerkSessionActive: false,
            isOnline: false
          }
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Failed to cleanup inactive sessions:', error);
      return 0;
    }
  }

  /**
   * Force set user online (khi user refresh hoặc login lại)
   */
  static async forceSetUserOnline(clerkId: string) {
    try {
      await connectDB();
      
      const now = new Date();

      // Tìm user trước
      let user = await User.findOne({ clerkId });
      
      if (!user) {
        // Tạo user mới nếu không tồn tại
        user = new User({
          clerkId,
          email: `${clerkId}@temp.com`, // Placeholder, sẽ được update từ Clerk
          isOnline: true,
          clerkSessionActive: true,
          lastActivity: now,
          lastSignInAt: now
        });
        await user.save();
      } else {
        // Update user hiện tại
        user.isOnline = true;
        user.clerkSessionActive = true;
        user.lastActivity = now;
        user.lastSignInAt = now;
        
        await user.save();
      }

      // Verify update
      const verifyUser = await User.findOne({ clerkId });
      
      return verifyUser;
    } catch (error) {
      console.error('❌ Failed to force set user online:', error);
      throw error;
    }
  }
}
