"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Download, FileText, RefreshCw, Filter, AlertTriangle, Package, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface InventoryData {
  inventoryData: {
    _id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    sku: string;
  }[];
  lowStockProducts: {
    _id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    sku: string;
  }[];
  inventorySummary: {
    _id: string;
    totalProducts: number;
    totalValue: number;
    averagePrice: number;
    lowStockCount: number;
  }[];
  inventoryStats: {
    totalProducts: number;
    totalValue: number;
    averagePrice: number;
    totalQuantity: number;
    lowStockCount: number;
  };
  filters: {
    category: string | null;
    lowStockThreshold: number;
  };
}

export default function InventoryReportTab() {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('quantity');
  const [sortOrder, setSortOrder] = useState<string>('asc');

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

  // Fetch inventory report data
  const fetchInventoryReport = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (category) {
        params.append('category', category);
      }

      params.append('lowStockThreshold', lowStockThreshold.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`http://localhost:5000/api/reports/inventory?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInventoryData(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch inventory report');
        }
      } else {
        toast.error('Failed to fetch inventory report');
      }
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      toast.error('An error occurred while fetching the inventory report');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInventoryReport();
  }, []);

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (category) {
        params.append('category', category);
      }

      params.append('lowStockThreshold', lowStockThreshold.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('format', format);

      // Show loading toast
      const loadingToast = toast.loading(`Generating ${format.toUpperCase()} report...`);

      // Fetch the report as a blob
      const response = await fetch(`http://localhost:5000/api/reports/inventory/export?${params.toString()}`, {
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
      link.download = `inventory_report.${format}`;

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
    fetchInventoryReport();
  };

  // Reset filters
  const resetFilters = () => {
    setCategory('all');
    setLowStockThreshold(10);
    setSortBy('quantity');
    setSortOrder('asc');
    // Fetch with reset filters
    setTimeout(() => {
      fetchInventoryReport();
    }, 0);
  };

  // Prepare data for pie chart
  const prepareCategoryChartData = () => {
    if (!inventoryData || !inventoryData.inventorySummary) return [];

    return inventoryData.inventorySummary.map(item => ({
      name: item._id || 'Uncategorized',
      value: item.totalProducts
    }));
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Report Filters</CardTitle>
          <CardDescription>Filter inventory data by category and stock level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Low Stock Threshold</label>
              <Input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
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

      {/* Summary Cards */}
      {inventoryData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryData.inventoryStats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Products in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${typeof inventoryData.inventoryStats.totalValue === 'number' ? inventoryData.inventoryStats.totalValue.toFixed(2) : Number(inventoryData.inventoryStats.totalValue || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total value of inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryData.inventoryStats.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Items below threshold ({lowStockThreshold})
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Distribution of products by category</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inventoryData && inventoryData.inventorySummary && inventoryData.inventorySummary.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prepareCategoryChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareCategoryChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No category data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Low Stock Products</CardTitle>
            <CardDescription>Products below the threshold of {lowStockThreshold} units</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchInventoryReport()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inventoryData && inventoryData.lowStockProducts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.lowStockProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell className="text-right">${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={product.quantity <= 5 ? 'text-red-500 font-bold' : 'text-yellow-500'}>
                          {product.quantity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No low stock products found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Data</CardTitle>
            <CardDescription>Complete inventory listing</CardDescription>
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
          ) : inventoryData && inventoryData.inventoryData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.inventoryData.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell className="text-right">${typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={product.quantity <= lowStockThreshold ? 'text-yellow-500' : ''}>
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">${(product.price * product.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">No inventory data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
