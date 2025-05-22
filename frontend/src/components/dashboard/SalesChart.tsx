"use client";

import React, { useState, useEffect } from 'react';
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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface SalesChartProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface SalesData {
  daily: {
    _id: string;
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

const SalesChart: React.FC<SalesChartProps> = ({
  isLoading = false,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [salesData, setSalesData] = useState<SalesData>({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/dashboard/stats", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.sales && data.data.sales.timeSeries) {
          setSalesData(data.data.sales.timeSeries);
        }
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSalesData();
    if (onRefresh) onRefresh();
  };

  // Generate chart data based on active tab
  const getChartData = () => {
    let labels: string[] = [];
    let data: number[] = [];
    
    if (activeTab === 'daily') {
      // If no data is available, use placeholder data
      if (salesData.daily.length === 0) {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Sales',
              data: [1200, 1800, 1400, 2200, 2600, 1900, 1300],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
      }
      
      // Format dates as day names (Mon, Tue, etc.)
      labels = salesData.daily.map(item => {
        const date = new Date(item._id);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });
      data = salesData.daily.map(item => item.sales);
    } else if (activeTab === 'weekly') {
      // If no data is available, use placeholder data
      if (salesData.weekly.length === 0) {
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Sales',
              data: [8000, 9500, 7800, 10200],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
      }
      
      // Format dates as week ranges
      labels = salesData.weekly.map(item => {
        const date = new Date(item.week);
        return `Week ${date.getDate()}/${date.getMonth() + 1}`;
      });
      data = salesData.weekly.map(item => item.sales);
    } else if (activeTab === 'monthly') {
      // If no data is available, use placeholder data
      if (salesData.monthly.length === 0) {
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Sales',
              data: [35000, 42000, 38000, 45000, 48000, 52000],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
      }
      
      // Format dates as month names
      labels = salesData.monthly.map(item => {
        const [year, month] = item.month.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short' });
      });
      data = salesData.monthly.map(item => item.sales);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const options: ChartOptions<'bar'> = {
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
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(context.parsed.y);
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
            return '$' + value;
          }
        }
      }
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sales Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={loading || isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${(loading || isLoading) ? 'animate-spin' : ''}`} />
            </Button>
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
        <CardDescription>
          Sales performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading || isLoading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Bar options={options} data={getChartData()} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
