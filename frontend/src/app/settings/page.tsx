"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from 'react-hot-toast';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

// Import settings tabs
import AppearanceTab from '@/components/settings/AppearanceTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import AccountTab from '@/components/settings/AccountTab';
import DisplayTab from '@/components/settings/DisplayTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('appearance');
  const router = useRouter();
  const { resetSettings } = useSettings();

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle reset all settings
  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        await resetSettings();
        toast.success('All settings have been reset to defaults');
      } catch (error) {
        toast.error('Failed to reset settings');
      }
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.back()} className="p-0 h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              </div>
              <p className="text-muted-foreground">
                Customize your experience and manage your account preferences
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleResetAll}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All
              </Button>
            </div>
          </div>

          {/* Settings Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Manage your settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="display">Display</TabsTrigger>
                </TabsList>
                
                <TabsContent value="appearance" className="mt-6">
                  <AppearanceTab />
                </TabsContent>
                
                <TabsContent value="notifications" className="mt-6">
                  <NotificationsTab />
                </TabsContent>
                
                <TabsContent value="account" className="mt-6">
                  <AccountTab />
                </TabsContent>
                
                <TabsContent value="display" className="mt-6">
                  <DisplayTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
