"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: number;
  isLoading?: boolean;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  change,
  isLoading = false,
  isCurrency = false,
  isPercentage = false,
}) => {
  // Format the value based on type
  const formattedValue = React.useMemo(() => {
    if (isLoading) return '';
    
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(Number(value));
    }
    
    if (isPercentage) {
      return `${Number(value).toFixed(1)}%`;
    }
    
    return value;
  }, [value, isCurrency, isPercentage, isLoading]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-[100px] mb-1" />
            <Skeleton className="h-4 w-[120px]" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{formattedValue}</div>
            {(description || change !== undefined) && (
              <div className="flex items-center text-xs">
                {change !== undefined && (
                  <div className={`flex items-center mr-2 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {change >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                  </div>
                )}
                {description && (
                  <span className="text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
