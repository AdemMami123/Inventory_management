"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Mail, ShoppingBag, Tag, Package } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'react-hot-toast';

const NotificationsTab = () => {
  const { settings, updateSettings, isLoading } = useSettings();

  const handleNotificationChange = (key: keyof typeof settings.notifications, value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    })
      .then(() => {
        toast.success(`Notification setting updated`);
      })
      .catch((error) => {
        toast.error('Failed to update notification settings');
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose what notifications you want to receive
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Select which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <Label htmlFor="order-updates" className="flex flex-col space-y-1">
                <span>Order Updates</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive notifications about your order status changes
                </span>
              </Label>
            </div>
            <Switch
              id="order-updates"
              checked={settings.notifications.orderUpdates}
              onCheckedChange={(checked) => handleNotificationChange('orderUpdates', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <Label htmlFor="promotions" className="flex flex-col space-y-1">
                <span>Promotions</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive notifications about sales and special offers
                </span>
              </Label>
            </div>
            <Switch
              id="promotions"
              checked={settings.notifications.promotions}
              onCheckedChange={(checked) => handleNotificationChange('promotions', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <Label htmlFor="product-updates" className="flex flex-col space-y-1">
                <span>Product Updates</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Get notified about new products and inventory changes
                </span>
              </Label>
            </div>
            <Switch
              id="product-updates"
              checked={settings.notifications.productUpdates}
              onCheckedChange={(checked) => handleNotificationChange('productUpdates', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive notifications via email
                </span>
              </Label>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <Label htmlFor="in-app-notifications" className="flex flex-col space-y-1">
                <span>In-App Notifications</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive notifications within the application
                </span>
              </Label>
            </div>
            <Switch
              id="in-app-notifications"
              checked={settings.notifications.inApp}
              onCheckedChange={(checked) => handleNotificationChange('inApp', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;
