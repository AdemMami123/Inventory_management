"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, CreditCard, TrendingUp } from "lucide-react";

interface SalesSummaryCardsProps {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  period: string;
}

export default function SalesSummaryCards({
  totalSales,
  orderCount,
  averageOrderValue,
  period
}: SalesSummaryCardsProps) {
  // Format period label
  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return '';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${typeof totalSales === 'number' ? totalSales.toFixed(2) : Number(totalSales || 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {getPeriodLabel()} sales amount
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orderCount}</div>
          <p className="text-xs text-muted-foreground">
            {getPeriodLabel()} order count
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${typeof averageOrderValue === 'number' ? averageOrderValue.toFixed(2) : Number(averageOrderValue || 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {getPeriodLabel()} average
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
