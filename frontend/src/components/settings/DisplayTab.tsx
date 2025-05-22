"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Grid2X2, List } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'react-hot-toast';

const DisplayTab = () => {
  const { settings, updateSettings, isLoading } = useSettings();

  const handleViewChange = (value: 'list' | 'grid') => {
    updateSettings({
      display: {
        ...settings.display,
        defaultView: value
      }
    })
      .then(() => {
        toast.success(`Default view changed to ${value}`);
      })
      .catch((error) => {
        toast.error('Failed to update display settings');
      });
  };

  const handleItemsPerPageChange = (value: number[]) => {
    updateSettings({
      display: {
        ...settings.display,
        itemsPerPage: value[0]
      }
    })
      .then(() => {
        toast.success(`Items per page set to ${value[0]}`);
      })
      .catch((error) => {
        toast.error('Failed to update display settings');
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Display Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize how content is displayed in the application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default View</CardTitle>
          <CardDescription>
            Choose how you want to view lists of items by default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            defaultValue={settings.display.defaultView} 
            className="grid grid-cols-2 gap-4"
            onValueChange={(value) => handleViewChange(value as 'list' | 'grid')}
          >
            <div>
              <RadioGroupItem 
                value="list" 
                id="view-list" 
                className="peer sr-only" 
                checked={settings.display.defaultView === 'list'}
              />
              <Label
                htmlFor="view-list"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <List className="mb-3 h-6 w-6" />
                <span className="text-center">List View</span>
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="grid" 
                id="view-grid" 
                className="peer sr-only" 
                checked={settings.display.defaultView === 'grid'}
              />
              <Label
                htmlFor="view-grid"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Grid2X2 className="mb-3 h-6 w-6" />
                <span className="text-center">Grid View</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items Per Page</CardTitle>
          <CardDescription>
            Set how many items to display per page in lists
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Slider
              defaultValue={[settings.display.itemsPerPage]}
              min={5}
              max={100}
              step={5}
              onValueCommit={handleItemsPerPageChange}
              disabled={isLoading}
            />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">5</span>
              <span className="text-sm font-medium">{settings.display.itemsPerPage} items</span>
              <span className="text-sm text-muted-foreground">100</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This setting affects how many items are shown per page in lists throughout the application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisplayTab;
