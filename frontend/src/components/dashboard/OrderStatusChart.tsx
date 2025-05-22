"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface OrderStatusCounts {
  Pending?: number;
  Approved?: number;
  Shipped?: number;
  Delivered?: number;
  Cancelled?: number;
  [key: string]: number | undefined;
}

interface OrderStatusChartProps {
  statusCounts: OrderStatusCounts;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
  statusCounts,
  isLoading = false,
  onRefresh,
}) => {
  // Define colors for each status
  const statusColors = {
    Pending: 'rgba(255, 193, 7, 0.8)',
    Approved: 'rgba(13, 110, 253, 0.8)',
    Shipped: 'rgba(111, 66, 193, 0.8)',
    Delivered: 'rgba(25, 135, 84, 0.8)',
    Cancelled: 'rgba(220, 53, 69, 0.8)',
  };

  const statusBorderColors = {
    Pending: 'rgb(255, 193, 7)',
    Approved: 'rgb(13, 110, 253)',
    Shipped: 'rgb(111, 66, 193)',
    Delivered: 'rgb(25, 135, 84)',
    Cancelled: 'rgb(220, 53, 69)',
  };

  // Prepare chart data
  const chartData = {
    labels: Object.keys(statusCounts).filter(key => statusCounts[key] && statusCounts[key]! > 0),
    datasets: [
      {
        data: Object.keys(statusCounts)
          .filter(key => statusCounts[key] && statusCounts[key]! > 0)
          .map(key => statusCounts[key]!),
        backgroundColor: Object.keys(statusCounts)
          .filter(key => statusCounts[key] && statusCounts[key]! > 0)
          .map(key => statusColors[key] || 'rgba(200, 200, 200, 0.8)'),
        borderColor: Object.keys(statusCounts)
          .filter(key => statusCounts[key] && statusCounts[key]! > 0)
          .map(key => statusBorderColors[key] || 'rgb(200, 200, 200)'),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Calculate total orders
  const totalOrders = Object.values(statusCounts).reduce((sum, count) => sum + (count || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Status</CardTitle>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <CardDescription>
          Distribution of orders by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full flex items-center justify-center">
          {isLoading ? (
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : totalOrders > 0 ? (
            <Doughnut data={chartData} options={options} />
          ) : (
            <div className="text-center text-muted-foreground">
              No order data available
            </div>
          )}
        </div>
        
        {!isLoading && totalOrders > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <div className="font-medium">Total Orders</div>
              <div className="text-2xl">{totalOrders}</div>
            </div>
            <div>
              <div className="font-medium">Completion Rate</div>
              <div className="text-2xl">
                {Math.round(((statusCounts.Delivered || 0) / totalOrders) * 100)}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusChart;
