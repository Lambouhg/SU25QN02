'use client';

import { useState, useEffect, useCallback } from 'react';
import { settingsService, SystemSettings } from '@/services/settingsService';

interface UseSettingsResult {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<{ success: boolean; message?: string }>;
  clearCache: () => Promise<{ success: boolean; message?: string }>;
  refreshSettings: () => Promise<void>;
  getSetting: <K extends keyof SystemSettings>(key: K) => SystemSettings[K] | null;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newSettings = await settingsService.getSettings();
      setSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<SystemSettings>) => {
    try {
      const result = await settingsService.updateSettings(newSettings);
      
      if (result.success) {
        // Refresh settings after successful update
        await fetchSettings();
      }
      
      return result;
    } catch (err) {
      console.error('Error updating settings:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to update settings' 
      };
    }
  }, [fetchSettings]);

  const clearCache = useCallback(async () => {
    try {
      const result = await settingsService.clearCache();
      
      if (result.success) {
        // Refresh settings after clearing cache
        await fetchSettings();
      }
      
      return result;
    } catch (err) {
      console.error('Error clearing cache:', err);
      return { 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to clear cache' 
      };
    }
  }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    settingsService.invalidateCache();
    await fetchSettings();
  }, [fetchSettings]);

  const getSetting = useCallback(<K extends keyof SystemSettings>(key: K): SystemSettings[K] | null => {
    return settings?.[key] || null;
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    clearCache,
    refreshSettings,
    getSetting
  };
}

// Hook for getting a specific setting
export function useSetting<K extends keyof SystemSettings>(key: K): {
  value: SystemSettings[K] | null;
  loading: boolean;
  error: string | null;
} {
  const { settings, loading, error } = useSettings();
  
  return {
    value: settings?.[key] || null,
    loading,
    error
  };
}

// Hook for maintenance mode check
export function useMaintenanceMode() {
  const { value: maintenanceMode, loading, error } = useSetting('maintenanceMode');
  
  return {
    isMaintenanceMode: maintenanceMode ?? false,
    loading,
    error
  };
}

// Hook for registration status
export function useRegistrationEnabled() {
  const { value: enableRegistration, loading, error } = useSetting('enableRegistration');
  
  return {
    isRegistrationEnabled: enableRegistration ?? true,
    loading,
    error
  };
}
