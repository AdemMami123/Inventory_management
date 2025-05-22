"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Define the shape of our settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    productUpdates: boolean;
    email: boolean;
    inApp: boolean;
  };
  display: {
    itemsPerPage: number;
    defaultView: 'list' | 'grid';
  };
}

// Default settings
const defaultSettings: UserSettings = {
  theme: 'system',
  notifications: {
    orderUpdates: true,
    promotions: true,
    productUpdates: true,
    email: true,
    inApp: true,
  },
  display: {
    itemsPerPage: 10,
    defaultView: 'list',
  },
};

// Context interface
interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await settingsApi.getSettings();
        
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        // Don't show toast on initial load if settings don't exist yet
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Merge new settings with existing settings
      const updatedSettings = {
        ...settings,
        ...newSettings,
        // Handle nested objects
        notifications: newSettings.notifications 
          ? { ...settings.notifications, ...newSettings.notifications }
          : settings.notifications,
        display: newSettings.display
          ? { ...settings.display, ...newSettings.display }
          : settings.display,
      };
      
      // Update in the backend
      const response = await settingsApi.updateSettings(updatedSettings);
      
      if (response.success && response.data) {
        setSettings(response.data);
        toast.success('Settings updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update in the backend
      const response = await settingsApi.updateSettings(defaultSettings);
      
      if (response.success && response.data) {
        setSettings(response.data);
        toast.success('Settings reset to defaults');
      } else {
        throw new Error(response.message || 'Failed to reset settings');
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
