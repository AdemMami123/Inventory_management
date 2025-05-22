"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SalesChartProps {
  data: {
    label: string;
    totalSales: number;
    orderCount: number;
    averageOrderValue: number;
    productCount: number;
  }[];
  period: string;
}

export default function SalesChart({ data, period }: SalesChartProps) {
  // Format data for chart
  const chartData = data.map(item => ({
    name: formatLabel(item.label, period),
    sales: item.totalSales,
    orders: item.orderCount,
    average: item.averageOrderValue
  }));

  // Format label based on period
  function formatLabel(label: string, period: string) {
    if (!label) return '';

    switch (period) {
      case 'daily':
        // For daily, format as "Jan 1" or similar
        return label;
      case 'weekly':
        // For weekly, format as "Week 1, 2023"
        try {
          return label.replace('-W', ' Week ');
        } catch (error) {
          console.error('Error formatting weekly label:', error);
          return label;
        }
      case 'monthly':
        // For monthly, format as "Jan 2023"
        try {
          const [year, month] = label.split('-');
          if (!year || !month) return label;

          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = parseInt(month) - 1;
          if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= 12) return label;

          return `${monthNames[monthIndex]} ${year}`;
        } catch (error) {
          console.error('Error formatting monthly label:', error);
          return label;
        }
      case 'yearly':
        // For yearly, just return the year
        return label;
      default:
        return label;
    }
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
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
          formatter={(value: number, name: string) => {
            if (name === 'sales') return [`$${value.toFixed(2)}`, 'Sales'];
            if (name === 'average') return [`$${value.toFixed(2)}`, 'Avg. Order'];
            return [value, name === 'orders' ? 'Orders' : name];
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="sales" name="Sales ($)" fill="#8884d8" />
        <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}
