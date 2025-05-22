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
      // First try to get data from the dashboard stats endpoint
      let response = await fetch("http://localhost:5000/api/dashboard/stats", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.sales && data.data.sales.timeSeries) {
          setSalesData(data.data.sales.timeSeries);
          setLoading(false);
          return;
        }
      }

      // If dashboard stats don't have the data we need, try the orders stats endpoint
      response = await fetch("http://localhost:5000/api/orders/stats", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.ordersByDate) {
          // Transform the data into the format we need
          const transformedData = {
            daily: data.data.ordersByDate.map(item => ({
              _id: item._id,
              sales: item.revenue,
              orders: item.count
            })),
            weekly: [],
            monthly: []
          };

          // Group by week
          const weeklyData = {};
          data.data.ordersByDate.forEach(item => {
            const date = new Date(item._id);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = { week: weekKey, sales: 0, orders: 0 };
            }
            weeklyData[weekKey].sales += item.revenue;
            weeklyData[weekKey].orders += item.count;
          });
          transformedData.weekly = Object.values(weeklyData);

          // Group by month
          const monthlyData = {};
          data.data.ordersByDate.forEach(item => {
            const date = new Date(item._id);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { month: monthKey, sales: 0, orders: 0 };
            }
            monthlyData[monthKey].sales += item.revenue;
            monthlyData[monthKey].orders += item.count;
          });
          transformedData.monthly = Object.values(monthlyData);

          setSalesData(transformedData);
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
      // If no data is available, return empty chart
      if (!salesData.daily || salesData.daily.length === 0) {
        return {
          labels: [],
          datasets: [
            {
              label: 'Sales',
              data: [],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
      }

      // Sort data by date
      const sortedData = [...salesData.daily].sort((a, b) => {
        return new Date(a._id).getTime() - new Date(b._id).getTime();
      });

      // Format dates as day names (Mon, Tue, etc.)
      labels = sortedData.map(item => {
        try {
          const date = new Date(item._id);
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } catch (error) {
          console.error('Error formatting date:', error);
          return item._id || 'Unknown';
        }
      });

      data = sortedData.map(item => typeof item.sales === 'number' ? item.sales : Number(item.sales || 0));
    } else if (activeTab === 'weekly') {
      // If no data is available, return empty chart
      if (!salesData.weekly || salesData.weekly.length === 0) {
        return {
          labels: [],
          datasets: [
            {
              label: 'Sales',
              data: [],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
      }

      // Sort data by week
      const sortedData = [...salesData.weekly].sort((a, b) => {
        return new Date(a.week).getTime() - new Date(b.week).getTime();
      });

      // Format dates as week ranges
      labels = sortedData.map(item => {
        try {
          const date = new Date(item.week);
          const endDate = new Date(date);
          endDate.setDate(date.getDate() + 6);

          const startStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return `${startStr} - ${endStr}`;
        } catch (error) {
          console.error('Error formatting week:', error);
          return item.week || 'Unknown';
        }
      });

      data = sortedData.map(item => typeof item.sales === 'number' ? item.sales : Number(item.sales || 0));
    } else if (activeTab === 'monthly') {
      // If no data is available, return empty chart
      if (!salesData.monthly || salesData.monthly.length === 0) {
        return {
          labels: [],
          datasets: [
            {
              label: 'Sales',
              data: [],
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1,
            },
          ],
        };
      }

      // Sort data by month
      const sortedData = [...salesData.monthly].sort((a, b) => {
        const [yearA, monthA] = (a.month || '').split('-');
        const [yearB, monthB] = (b.month || '').split('-');

        if (!yearA || !monthA || !yearB || !monthB) {
          return 0;
        }

        const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1);
        const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1);

        return dateA.getTime() - dateB.getTime();
      });

      // Format dates as month names
      labels = sortedData.map(item => {
        try {
          if (!item.month) return 'Unknown';

          const [year, month] = item.month.split('-');
          if (!year || !month) return item.month;

          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (error) {
          console.error('Error formatting month:', error);
          return item.month || 'Unknown';
        }
      });

      data = sortedData.map(item => typeof item.sales === 'number' ? item.sales : Number(item.sales || 0));
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
