"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TimeSeriesData {
  daily: {
    _id?: string;
    day?: string;
    date?: string;
    sales: number;
    orders: number;
  }[];
  weekly: {
    week: string;
    sales: number;
    orders: number;
  }[];
  monthly: {
    month: string;
    sales: number;
    orders: number;
  }[];
}

interface DashboardChartProps {
  title: string;
  description?: string;
  timeSeriesData: TimeSeriesData;
  dataType: 'sales' | 'orders';
  isLoading?: boolean;
  onRefresh?: () => void;
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  title,
  description,
  timeSeriesData,
  dataType,
  isLoading = false,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = React.useState('daily');

  // Format data for chart based on active tab
  const getChartData = (): ChartData<'line' | 'bar'> => {
    let labels: string[] = [];
    let data: number[] = [];
    
    if (activeTab === 'daily') {
      labels = timeSeriesData.daily.map(item => {
        // Format date as "May 21" or use the day property if available
        if (item.day) return item.day;
        if (item._id) {
          const date = new Date(item._id);
          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        return '';
      });
      data = timeSeriesData.daily.map(item => dataType === 'sales' ? item.sales : item.orders);
    } else if (activeTab === 'weekly') {
      labels = timeSeriesData.weekly.map(item => {
        // Format week as "May 15-21"
        const date = new Date(item.week);
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}-${endDate.getDate()}`;
      });
      data = timeSeriesData.weekly.map(item => dataType === 'sales' ? item.sales : item.orders);
    } else if (activeTab === 'monthly') {
      labels = timeSeriesData.monthly.map(item => {
        // Format month as "May 2023"
        const [year, month] = item.month.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });
      data = timeSeriesData.monthly.map(item => dataType === 'sales' ? item.sales : item.orders);
    }

    return {
      labels,
      datasets: [
        {
          label: dataType === 'sales' ? 'Sales' : 'Orders',
          data,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          tension: 0.2,
        },
      ],
    };
  };

  // Chart options
  const options: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (dataType === 'sales') {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            } else {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (dataType === 'sales') {
              return '$' + value;
            }
            return value;
          }
        }
      }
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
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
            <Tabs 
              defaultValue="daily" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === 'daily' ? (
            <Bar options={options} data={getChartData()} />
          ) : (
            <Line options={options} data={getChartData()} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardChart;
