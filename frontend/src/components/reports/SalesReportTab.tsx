"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, RefreshCw, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import SalesChart from '@/components/reports/charts/SalesChart';
import SalesSummaryCards from '@/components/reports/SalesSummaryCards';

interface SalesData {
  salesData: {
    label: string;
    totalSales: number;
    orderCount: number;
    averageOrderValue: number;
    productCount: number;
  }[];
  summary: {
    totalSales: number;
    orderCount: number;
    averageOrderValue: number;
    minOrderValue: number;
    maxOrderValue: number;
  };
  topProducts: {
    _id: string;
    name: string;
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  period: string;
  filters: {
    startDate: string | null;
    endDate: string | null;
    category: string | null;
  };
}

export default function SalesReportTab() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products/public', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          const uniqueCategories = [...new Set(data.map((product: any) => product.category))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch sales report data
  const fetchSalesReport = async () => {
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

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`http://localhost:5000/api/reports/sales?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSalesData(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch sales report');
        }
      } else {
        toast.error('Failed to fetch sales report');
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
      toast.error('An error occurred while fetching the sales report');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSalesReport();
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

      if (category) {
        params.append('category', category);
      }

      // Show loading toast
      const loadingToast = toast.loading(`Generating ${format.toUpperCase()} report...`);

      // Fetch the report as a blob
      const response = await fetch(`http://localhost:5000/api/reports/sales/export?${params.toString()}`, {
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
      link.download = `sales_report.${format}`;

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
    fetchSalesReport();
  };

  // Reset filters
  const resetFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setCategory('all');
    setPeriod('daily');
    // Fetch with reset filters
    setTimeout(() => {
      fetchSalesReport();
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Report Filters</CardTitle>
          <CardDescription>Filter sales data by date range, period, and category</CardDescription>
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
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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

      {/* Summary Cards */}
      {salesData && (
        <SalesSummaryCards
          totalSales={salesData.summary.totalSales}
          orderCount={salesData.summary.orderCount}
          averageOrderValue={salesData.summary.averageOrderValue}
          period={period}
        />
      )}

      {/* Sales Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>
              {period.charAt(0).toUpperCase() + period.slice(1)} sales over time
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => fetchSalesReport()} disabled={isLoading}>
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
          ) : salesData && salesData.salesData.length > 0 ? (
            <SalesChart data={salesData.salesData} period={period} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales Data</CardTitle>
            <CardDescription>Detailed sales data by {period}</CardDescription>
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
          ) : salesData && salesData.salesData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg. Order Value</TableHead>
                    <TableHead className="text-right">Products Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.salesData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="text-right">${item.totalSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.orderCount}</TableCell>
                      <TableCell className="text-right">${item.averageOrderValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{item.productCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
