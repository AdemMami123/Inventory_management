"use client";

import React, { useState } from 'react';
//import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SalesReportTab from '@/components/reports/SalesReportTab';
import InventoryReportTab from '@/components/reports/InventoryReportTab';
import OrdersReportTab from '@/components/reports/OrdersReportTab';
import ProductsReportTab from '@/components/reports/ProductsReportTab';
import RoleProtectedRoute from '@/components/common/RoleProtectedRoute';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
//  const router = useRouter();

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              View and export comprehensive reports for your business
            </p>
          </div>
        </div>

        <Tabs defaultValue="sales" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="grid grid-cols-4 w-[600px]">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sales" className="space-y-4">
            <SalesReportTab />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryReportTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrdersReportTab />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductsReportTab />
          </TabsContent>
        </Tabs>
      </div>
    </RoleProtectedRoute>
  );
}
