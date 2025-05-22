"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, RefreshCw, Filter, TrendingUp, TrendingDown, DollarSign, ShoppingBag } from "lucide-react";
import { toast } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ProductsData {
  productPerformance: {
    _id: string;
    name: string;
    category: string;
    sku: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    averageOrderQuantity: number;
    price: number;
  }[];
  categoryPerformance: {
    _id: string;
    totalQuantity: number;
    totalRevenue: number;
    productCount: number;
    orderCount: number;
    averageRevenuePerProduct: number;
  }[];
  filters: {
    startDate: string | null;
    endDate: string | null;
    category: string | null;
    sortBy: string;
    sortOrder: string;
  };
}

export default function ProductsReportTab() {
  const [productsData, setProductsData] = useState<ProductsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('totalRevenue');
  const [sortOrder, setSortOrder] = useState<string>('desc');

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

  // Fetch products report data
  const fetchProductsReport = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      if (category) {
        params.append('category', category);
      }

      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`http://localhost:5000/api/reports/products?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductsData(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch products report');
        }
      } else {
        toast.error('Failed to fetch products report');
      }
    } catch (error) {
      console.error('Error fetching products report:', error);
      toast.error('An error occurred while fetching the products report');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProductsReport();
  }, []);

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString());
      }

      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      if (category) {
        params.append('category', category);
      }

      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('format', format);

      // Show loading toast
      const loadingToast = toast.loading(`Generating ${format.toUpperCase()} report...`);

      // Fetch the report as a blob
      const response = await fetch(`http://localhost:5000/api/reports/products/export?${params.toString()}`, {
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
      link.download = `product_performance_report.${format}`;

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
    fetchProductsReport();
  };

  // Reset filters
  const resetFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setCategory('all');
    setSortBy('totalRevenue');
    setSortOrder('desc');
    // Fetch with reset filters
    setTimeout(() => {
      fetchProductsReport();
    }, 0);
  };

  // Prepare data for category revenue chart
  const prepareCategoryRevenueData = () => {
    if (!productsData || !productsData.categoryPerformance) return [];

    return productsData.categoryPerformance.map(item => ({
      name: item._id || 'Uncategorized',
      revenue: item.totalRevenue,
      quantity: item.totalQuantity,
      products: item.productCount
    }));
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance Report Filters</CardTitle>
          <CardDescription>Filter product performance data by date range, category, and sorting</CardDescription>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalRevenue">Revenue</SelectItem>
                    <SelectItem value="totalQuantity">Quantity</SelectItem>
                    <SelectItem value="orderCount">Order Count</SelectItem>
                    <SelectItem value="averageOrderQuantity">Avg. Quantity</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Top Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Products with the highest {sortBy === 'totalRevenue' ? 'revenue' : sortBy === 'totalQuantity' ? 'quantity sold' : sortBy === 'orderCount' ? 'order count' : 'average order quantity'}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchProductsReport()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : productsData && productsData.productPerformance && productsData.productPerformance.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.productPerformance.slice(0, 10).map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell className="text-right">${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.totalQuantity}</TableCell>
                      <TableCell className="text-right">${product.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">No product performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Revenue and quantity sold by product category</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : productsData && productsData.categoryPerformance && productsData.categoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareCategoryRevenueData()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') {
                      const numValue = Number(value);
                      return isNaN(numValue) ? ['$0.00', 'Revenue'] : [`$${numValue.toFixed(2)}`, 'Revenue'];
                    }
                    return [value, name === 'quantity' ? 'Quantity' : name === 'products' ? 'Products' : name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="quantity" name="Quantity Sold" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No category performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Category Performance Details</CardTitle>
            <CardDescription>Detailed performance metrics by category</CardDescription>
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
          ) : productsData && productsData.categoryPerformance && productsData.categoryPerformance.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg. Revenue/Product</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.categoryPerformance.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category._id || 'Uncategorized'}</TableCell>
                      <TableCell className="text-right">{category.productCount}</TableCell>
                      <TableCell className="text-right">{category.totalQuantity}</TableCell>
                      <TableCell className="text-right">${category.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{category.orderCount}</TableCell>
                      <TableCell className="text-right">${category.averageRevenuePerProduct.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No category performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Products Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Products Performance</CardTitle>
            <CardDescription>Complete product performance data</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : productsData && productsData.productPerformance && productsData.productPerformance.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg. Order Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.productPerformance.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell className="text-right">${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.totalQuantity}</TableCell>
                      <TableCell className="text-right">${product.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.orderCount}</TableCell>
                      <TableCell className="text-right">{product.averageOrderQuantity.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No product performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
