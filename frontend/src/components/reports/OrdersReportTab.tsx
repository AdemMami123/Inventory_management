"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, RefreshCw, Filter, Clock, CheckCircle, TruckIcon, XCircle, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface OrdersData {
  statusCounts: {
    [key: string]: number;
  };
  fulfillmentTimeStats: {
    avgApprovalTime: number;
    avgShippingTime: number;
    avgDeliveryTime: number;
    avgTotalFulfillmentTime: number;
    minTotalFulfillmentTime: number;
    maxTotalFulfillmentTime: number;
  };
  orderTrend: {
    label: string;
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  }[];
  period: string;
  filters: {
    startDate: string | null;
    endDate: string | null;
    status: string | null;
  };
}

export default function OrdersReportTab() {
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [status, setStatus] = useState<string>('');

  // Status options
  const statusOptions = ['Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled'];

  // Fetch orders report data
  const fetchOrdersReport = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('period', period);

      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`http://localhost:5000/api/reports/orders?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrdersData(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch orders report');
        }
      } else {
        toast.error('Failed to fetch orders report');
      }
    } catch (error) {
      console.error('Error fetching orders report:', error);
      toast.error('An error occurred while fetching the orders report');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchOrdersReport();
  }, [period]);

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('format', format);

      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      if (status) {
        params.append('status', status);
      }

      // Show loading toast
      const loadingToast = toast.loading(`Generating ${format.toUpperCase()} report...`);

      // Fetch the report as a blob
      const response = await fetch(`http://localhost:5000/api/reports/orders/export?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()} report`);
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_report.${format}`;

      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`${format.toUpperCase()} report downloaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to download ${format.toUpperCase()} report`;
      toast.error(errorMessage);
    }
  };

  // Apply filters
  const applyFilters = () => {
    fetchOrdersReport();
  };

  // Reset filters
  const resetFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setStatus('all');
    setPeriod('daily');
    // Fetch with reset filters
    setTimeout(() => {
      fetchOrdersReport();
    }, 0);
  };

  // Prepare data for status pie chart
  const prepareStatusChartData = () => {
    if (!ordersData || !ordersData.statusCounts) return [];

    return Object.entries(ordersData.statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  // Colors for status pie chart
  const STATUS_COLORS = {
    Pending: '#f59e0b',
    Approved: '#3b82f6',
    Shipped: '#8b5cf6',
    Delivered: '#10b981',
    Cancelled: '#ef4444'
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    return (STATUS_COLORS as any)[status] || '#6b7280';
  };

  // Format time in hours to a readable format
  const formatTime = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined || isNaN(Number(hours))) return 'N/A';

    const numHours = Number(hours);

    if (numHours < 1) {
      return `${Math.round(numHours * 60)} minutes`;
    } else if (numHours < 24) {
      return `${numHours.toFixed(1)} hours`;
    } else {
      const days = Math.floor(numHours / 24);
      const remainingHours = numHours % 24;
      return `${days} day${days !== 1 ? 's' : ''} ${remainingHours.toFixed(1)} hours`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Order Fulfillment Report Filters</CardTitle>
          <CardDescription>Filter order data by date range, period, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range as any)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((statusOption) => (
                    <SelectItem key={statusOption} value={statusOption}>{statusOption}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary Cards */}
      {ordersData && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(ordersData.statusCounts).reduce((sum, count) => sum + count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersData.statusCounts.Pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped</CardTitle>
              <TruckIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersData.statusCounts.Shipped || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersData.statusCounts.Delivered || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersData.statusCounts.Cancelled || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Distribution of orders by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ordersData && Object.keys(ordersData.statusCounts).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareStatusChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareStatusChartData().map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No order status data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fulfillment Time Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Time Statistics</CardTitle>
            <CardDescription>Average time for each fulfillment stage</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : ordersData && ordersData.fulfillmentTimeStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Approval Time</div>
                    <div className="text-2xl font-bold">
                      {formatTime(ordersData.fulfillmentTimeStats.avgApprovalTime)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Shipping Time</div>
                    <div className="text-2xl font-bold">
                      {formatTime(ordersData.fulfillmentTimeStats.avgShippingTime)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Delivery Time</div>
                    <div className="text-2xl font-bold">
                      {formatTime(ordersData.fulfillmentTimeStats.avgDeliveryTime)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Total Fulfillment</div>
                    <div className="text-2xl font-bold">
                      {formatTime(ordersData.fulfillmentTimeStats.avgTotalFulfillmentTime)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Fastest Fulfillment:</span>{' '}
                      {formatTime(ordersData.fulfillmentTimeStats.minTotalFulfillmentTime)}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Slowest Fulfillment:</span>{' '}
                      {formatTime(ordersData.fulfillmentTimeStats.maxTotalFulfillmentTime)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No fulfillment time data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Order Trend</CardTitle>
            <CardDescription>
              {period.charAt(0).toUpperCase() + period.slice(1)} order counts by status
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => fetchOrdersReport()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ordersData && ordersData.orderTrend && ordersData.orderTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ordersData.orderTrend}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pendingOrders" name="Pending" stackId="a" fill={getStatusColor('Pending')} />
                <Bar dataKey="approvedOrders" name="Approved" stackId="a" fill={getStatusColor('Approved')} />
                <Bar dataKey="shippedOrders" name="Shipped" stackId="a" fill={getStatusColor('Shipped')} />
                <Bar dataKey="deliveredOrders" name="Delivered" stackId="a" fill={getStatusColor('Delivered')} />
                <Bar dataKey="cancelledOrders" name="Cancelled" stackId="a" fill={getStatusColor('Cancelled')} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No order trend data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Order Data</CardTitle>
            <CardDescription>Detailed order data by {period}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ordersData && ordersData.orderTrend && ordersData.orderTrend.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Cancelled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.orderTrend.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="text-right">{item.totalOrders}</TableCell>
                      <TableCell className="text-right">{item.pendingOrders}</TableCell>
                      <TableCell className="text-right">{item.approvedOrders}</TableCell>
                      <TableCell className="text-right">{item.shippedOrders}</TableCell>
                      <TableCell className="text-right">{item.deliveredOrders}</TableCell>
                      <TableCell className="text-right">{item.cancelledOrders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No order data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
