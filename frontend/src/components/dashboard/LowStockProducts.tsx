"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  sku: string;
}

interface LowStockProductsProps {
  products: Product[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const LowStockProducts: React.FC<LowStockProductsProps> = ({
  products,
  isLoading = false,
  onRefresh,
}) => {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getQuantityColor = (quantity: number) => {
    if (quantity <= 3) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    if (quantity <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <CardTitle>Low Stock Products</CardTitle>
          </div>
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
        </div>
        <CardDescription>
          Products with low inventory levels that need attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getQuantityColor(product.quantity)}>
                      {product.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No low stock products found
          </div>
        )}
        
        {products.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/product/viewProducts")}
              className="text-xs"
            >
              View All Products
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockProducts;
