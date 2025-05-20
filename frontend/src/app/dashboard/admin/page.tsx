"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  TruckIcon,
  XCircle,
  Users,
  BarChart,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PlusCircle,
  Settings,
  UserCog,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderStats {
  total: number;
  pending: number;
  approved: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalSales: number;
  dailySales: number;
  weeklySales: number;
  monthlySales: number;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  sku: string;
}

interface RecentOrder {
  _id: string;
  customer: {
    name: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    approved: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalSales: 0,
    dailySales: 0,
    weeklySales: 0,
    monthlySales: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users/getuser", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchOrderStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders/stats", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setOrderStats(data.data || {
            total: 0,
            pending: 0,
            approved: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            totalSales: 0,
            dailySales: 0,
            weeklySales: 0,
            monthlySales: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching order stats:", error);
      }
    };

    const fetchLowStockProducts = async () => {
      try {
        // In a real app, this would be a specific API for low stock products
        const response = await fetch("http://localhost:5000/api/products/public", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          // Filter products with low stock (less than 10 units)
          const products = Array.isArray(data) ? data : data.data || [];
          setLowStockProducts(
            products
              .filter((product: Product) => Number(product.quantity) < 10)
              .slice(0, 5)
          );
        }
      } catch (error) {
        console.error("Error fetching low stock products:", error);
      }
    };

    const fetchRecentOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders/all", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Get the most recent 5 orders
          const orders = Array.isArray(data) ? data : data.data || [];
          setRecentOrders(orders.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchOrderStats();
    fetchLowStockProducts();
    fetchRecentOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "Approved":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "Shipped":
        return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case "Delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Mock data for sales chart (in a real app, this would come from the API)
  const salesData = {
    daily: [
      { day: "Mon", sales: 1200 },
      { day: "Tue", sales: 1800 },
      { day: "Wed", sales: 1400 },
      { day: "Thu", sales: 2200 },
      { day: "Fri", sales: 2600 },
      { day: "Sat", sales: 1900 },
      { day: "Sun", sales: 1300 },
    ],
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {userData?.name || "Admin"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/product/addProduct")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
              <Button variant="outline" onClick={() => router.push("/orders/manage")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Manage Orders
              </Button>
            </div>
          </div>

          {/* Sales Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(orderStats.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Sales</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(orderStats.dailySales || 0)}
                </div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>+12.5% from yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.total || 0}</div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pending: {orderStats.pending || 0}</span>
                  <span>Delivered: {orderStats.delivered || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockProducts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Products need attention
                </p>
                <Button
                  variant="link"
                  className="px-0 text-xs"
                  onClick={() => router.push("/product/viewProducts")}
                >
                  View inventory
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sales Overview</CardTitle>
                  <Tabs defaultValue="daily">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  Sales performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* This would be a real chart component in a production app */}
                <div className="h-[200px] w-full">
                  <div className="flex h-full items-end gap-2">
                    {salesData.daily.map((item, index) => (
                      <div key={index} className="relative flex h-full w-full flex-col justify-end">
                        <div
                          className="bg-primary rounded-md w-full"
                          style={{ height: `${(item.sales / 3000) * 100}%` }}
                        ></div>
                        <span className="mt-1 text-xs text-center">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Low Stock Products</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => router.push("/product/viewProducts")}>
                    View All
                  </Button>
                </div>
                <CardDescription>
                  Products that need restocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">All stocked up!</h3>
                    <p className="text-muted-foreground mb-4">
                      No products are currently low on stock.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            Number(product.quantity) <= 5
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {product.quantity} left
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="outline" onClick={() => router.push("/orders/manage")}>
                  View All Orders
                </Button>
              </div>
              <CardDescription>
                Latest customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no orders in the system.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">
                          {order._id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{order.customer?.name || "Customer"}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/details/${order._id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/product/addProduct")}
              >
                <PlusCircle className="h-8 w-8 mb-2" />
                <span>Add Product</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/orders/manage")}
              >
                <ShoppingCart className="h-8 w-8 mb-2" />
                <span>Manage Orders</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/customers")}
              >
                <Users className="h-8 w-8 mb-2" />
                <span>Customer List</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/settings")}
              >
                <Settings className="h-8 w-8 mb-2" />
                <span>System Settings</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
