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
  User,
  Bell,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface Order {
  _id: string;
  products: {
    product: {
      _id: string;
      name: string;
      price: number;
      image?: {
        filePath: string;
      };
    };
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  image?: {
    filePath: string;
  };
}

export default function CustomerDashboard() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
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

    const fetchRecentOrders = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/orders/my-orders", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Get the most recent 3 orders
          const orders = Array.isArray(data) ? data : data.data || [];
          setRecentOrders(orders.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      }
    };

    const fetchRecommendedProducts = async () => {
      try {
        // In a real app, this would be a personalized recommendation API
        // For now, we'll just fetch some products
        const response = await fetch("http://localhost:5000/api/products/public", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          // Get 4 random products as recommendations
          const products = Array.isArray(data) ? data : data.data || [];
          const shuffled = [...products].sort(() => 0.5 - Math.random());
          setRecommendedProducts(shuffled.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchRecentOrders();
    fetchRecommendedProducts();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          badge: <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>,
          progress: 25,
        };
      case "Approved":
        return {
          icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
          badge: <Badge className="bg-blue-100 text-blue-800">Approved</Badge>,
          progress: 50,
        };
      case "Shipped":
        return {
          icon: <TruckIcon className="h-5 w-5 text-purple-500" />,
          badge: <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>,
          progress: 75,
        };
      case "Delivered":
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge className="bg-green-100 text-green-800">Delivered</Badge>,
          progress: 100,
        };
      case "Cancelled":
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge className="bg-red-100 text-red-800">Cancelled</Badge>,
          progress: 100,
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          badge: <Badge className="bg-gray-100 text-gray-800">{status}</Badge>,
          progress: 0,
        };
    }
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
                Welcome back, {userData?.name || "Customer"}
              </h1>
              <p className="text-muted-foreground">
                Here's an overview of your recent orders and recommendations
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/orders/create")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Place New Order
              </Button>
            </div>
          </div>

          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentOrders.length}</div>
                <p className="text-xs text-muted-foreground">
                  Orders placed in the last 30 days
                </p>
                <Button
                  variant="link"
                  className="px-0 text-xs"
                  onClick={() => router.push("/orders/history")}
                >
                  View all orders
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentOrders.filter(order => 
                    ["Pending", "Approved", "Shipped"].includes(order.status)
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Orders in progress
                </p>
                <Button
                  variant="link"
                  className="px-0 text-xs"
                  onClick={() => router.push("/orders/history")}
                >
                  Track shipments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-md font-medium truncate">
                  {userData?.email || "Loading..."}
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer account
                </p>
                <Button
                  variant="link"
                  className="px-0 text-xs"
                  onClick={() => router.push("/profile")}
                >
                  Manage profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentOrders.filter(order => 
                    ["Shipped", "Delivered"].includes(order.status)
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recent updates
                </p>
                <Button
                  variant="link"
                  className="px-0 text-xs"
                  onClick={() => router.push("/notifications")}
                >
                  View notifications
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => router.push("/orders/history")}>
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Track and manage your recent orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't placed any orders yet.
                      </p>
                      <Button onClick={() => router.push("/orders/create")}>
                        Place Your First Order
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => {
                        const { icon, badge, progress } = getOrderStatusInfo(order.status);
                        return (
                          <div
                            key={order._id}
                            className="flex flex-col p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {icon}
                                <span className="font-medium">Order #{order._id.substring(0, 8)}</span>
                              </div>
                              {badge}
                            </div>
                            <div className="mb-2">
                              <Progress value={progress} className="h-2" />
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>Placed on {formatDate(order.createdAt)}</span>
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="mt-3 flex justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/orders/details/${order._id}`)}
                              >
                                View Details
                              </Button>
                              {order.status === "Delivered" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Reorder functionality would go here
                                    toast.success("Reorder feature coming soon!");
                                  }}
                                >
                                  Reorder
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recommended For You</CardTitle>
                  <CardDescription>
                    Based on your purchase history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : recommendedProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Place an order to get personalized recommendations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendedProducts.map((product) => (
                        <div
                          key={product._id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                          onClick={() => router.push(`/product/details/${product._id}`)}
                        >
                          <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            {product.image?.filePath ? (
                              <img
                                src={product.image.filePath}
                                alt={product.name}
                                className="h-full w-full object-cover rounded-md"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          <div className="text-sm font-medium">${Number(product.price).toFixed(2)}</div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/product/viewProducts")}
                      >
                        View All Products
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used features
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/orders/create")}
              >
                <ShoppingCart className="h-8 w-8 mb-2" />
                <span>Place New Order</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/orders/history")}
              >
                <Clock className="h-8 w-8 mb-2" />
                <span>Order History</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/product/viewProducts")}
              >
                <Package className="h-8 w-8 mb-2" />
                <span>Browse Products</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => router.push("/profile")}
              >
                <User className="h-8 w-8 mb-2" />
                <span>My Profile</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
