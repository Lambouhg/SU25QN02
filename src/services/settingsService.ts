export interface SystemSettings {
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

class SettingsService {
  private static instance: SettingsService;
  private cache: SystemSettings | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Get system settings from cache or API
   */
  async getSettings(): Promise<SystemSettings> {
    const now = Date.now();
    
    // Return cached settings if still valid
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        this.cache = data.settings;
        this.cacheExpiry = now + this.CACHE_DURATION;
        return data.settings;
      }
      
      throw new Error('Invalid settings response');
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      // Return default settings if API fails
      return this.getDefaultSettings();
    }
  }

  /**
   * Update system settings
   */
  async updateSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Invalidate cache
        this.cache = null;
        this.cacheExpiry = 0;
        
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.error || 'Failed to update settings' };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  /**
   * Clear system cache
   */
  async clearCache(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Also clear local cache
        this.cache = null;
        this.cacheExpiry = 0;
        
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.error || 'Failed to clear cache' };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, message: 'Network error occurred' };
    }
  }

  /**
   * Get a specific setting value
   */
  async getSetting<K extends keyof SystemSettings>(key: K): Promise<SystemSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * Check if system is in maintenance mode
   */
  async isMaintenanceMode(): Promise<boolean> {
    return await this.getSetting('maintenanceMode');
  }

  /**
   * Check if registration is enabled
   */
  async isRegistrationEnabled(): Promise<boolean> {
    return await this.getSetting('enableRegistration');
  }

  /**
   * Check if email notifications are enabled
   */
  async areEmailNotificationsEnabled(): Promise<boolean> {
    return await this.getSetting('enableEmailNotifications');
  }

  /**
   * Get maximum file upload size in bytes
   */
  async getMaxFileUploadSize(): Promise<number> {
    const sizeInMB = await this.getSetting('maxFileUploadSize');
    return sizeInMB * 1024 * 1024; // Convert MB to bytes
  }

  /**
   * Check if a file type is allowed
   */
  async isFileTypeAllowed(fileType: string): Promise<boolean> {
    const allowedTypes = await this.getSetting('allowedFileTypes');
    return allowedTypes.includes(fileType.toLowerCase());
  }

  /**
   * Get session timeout in milliseconds
   */
  async getSessionTimeout(): Promise<number> {
    const timeoutInSeconds = await this.getSetting('sessionTimeout');
    return timeoutInSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Invalidate local cache (useful when settings are updated elsewhere)
   */
  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): SystemSettings {
    return {
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
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
export default settingsService;
