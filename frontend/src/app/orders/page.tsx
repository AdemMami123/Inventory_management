"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ordersApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  TruckIcon,
  XCircle,
  BarChart
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

interface OrderCounts {
  total: number;
  pending: number;
  approved: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export default function OrdersPage() {
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("customer"); // Default to customer
  const router = useRouter();

  useEffect(() => {
    // In a real app, you would get the user role from auth context
    // For now, we'll just simulate it
    checkUserRole();
    fetchOrderCounts();
  }, []);

  const checkUserRole = async () => {
    try {
      // Get the user data directly from the API
      const response = await fetch("http://localhost:5000/api/users/getuser", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUserRole(userData.role || "customer");
      } else {
        // Default to customer if not authenticated
        setUserRole("customer");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      // Default to customer if there's an error
      setUserRole("customer");
    }
  };

  const fetchOrderCounts = async () => {
    setLoading(true);
    try {
      // Fetch orders based on user role
      let orders = [];

      if (userRole === "customer") {
        // Customer can only see their own orders
        const response = await fetch("http://localhost:5000/api/orders/my-orders", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          // Check if the response has a data property (new API format)
          if (responseData && responseData.data) {
            orders = responseData.data;
          } else {
            // Fallback to the old format or empty array if no data
            orders = Array.isArray(responseData) ? responseData : [];
          }
        } else {
          throw new Error("Failed to fetch your orders");
        }
      } else {
        // Staff can see all orders
        const response = await fetch("http://localhost:5000/api/orders/all", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          // Check if the response has a data property (new API format)
          if (responseData && responseData.data) {
            orders = responseData.data;
          } else {
            // Fallback to the old format or empty array if no data
            orders = Array.isArray(responseData) ? responseData : [];
          }
        } else {
          throw new Error("Failed to fetch all orders");
        }
      }

      // Count orders by status
      const counts = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === "Pending").length,
        approved: orders.filter((o: any) => o.status === "Approved").length,
        shipped: orders.filter((o: any) => o.status === "Shipped").length,
        delivered: orders.filter((o: any) => o.status === "Delivered").length,
        cancelled: orders.filter((o: any) => o.status === "Cancelled").length
      };

      setOrderCounts(counts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch order counts";
      toast.error(errorMessage);

      // Set mock data for demonstration
      setOrderCounts({
        total: 0,
        pending: 0,
        approved: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
              <p className="text-muted-foreground">
                Manage your orders, track shipments, and handle customer requests.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigateTo("/orders/create")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Order
              </Button>
              {(userRole === "admin" || userRole === "manager") && (
                <Button variant="outline" onClick={() => navigateTo("/orders/manage")}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Manage All Orders
                </Button>
              )}
            </div>
          </div>

          {/* Order Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : orderCounts.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  All orders in the system
                </p>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button
                    variant="link"
                    className="px-0 text-xs"
                    onClick={() => navigateTo("/orders/manage")}
                  >
                    View all
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">
                  {loading ? "..." : orderCounts.pending}
                </div>
                <p className="text-xs text-muted-foreground">
                  Orders awaiting approval
                </p>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button
                    variant="link"
                    className="px-0 text-xs text-yellow-700 dark:text-yellow-500"
                    onClick={() => navigateTo("/orders/pending")}
                  >
                    Manage pending
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-500">
                  {loading ? "..." : orderCounts.approved}
                </div>
                <p className="text-xs text-muted-foreground">
                  Orders ready to ship
                </p>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button
                    variant="link"
                    className="px-0 text-xs text-blue-700 dark:text-blue-500"
                    onClick={() => navigateTo("/orders/approved")}
                  >
                    Manage approved
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
                <TruckIcon className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-500">
                  {loading ? "..." : orderCounts.shipped}
                </div>
                <p className="text-xs text-muted-foreground">
                  Orders in transit
                </p>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button
                    variant="link"
                    className="px-0 text-xs text-purple-700 dark:text-purple-500"
                    onClick={() => navigateTo("/orders/shipped")}
                  >
                    Track shipments
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-900/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700 dark:text-red-500">
                  {loading ? "..." : orderCounts.cancelled}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cancelled orders
                </p>
                {(userRole === "admin" || userRole === "manager") && (
                  <Button
                    variant="link"
                    className="px-0 text-xs text-red-700 dark:text-red-500"
                    onClick={() => navigateTo("/orders/cancelled")}
                  >
                    View cancelled
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common order management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => navigateTo("/orders/create")}
              >
                <ShoppingCart className="h-8 w-8 mb-2" />
                <span>Create New Order</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center"
                onClick={() => navigateTo("/orders/history")}
              >
                <Clock className="h-8 w-8 mb-2" />
                <span>View Order History</span>
              </Button>

              {(userRole === "admin" || userRole === "manager") && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => navigateTo("/orders/pending")}
                >
                  <Clock className="h-8 w-8 mb-2 text-yellow-500" />
                  <span>Pending Orders</span>
                </Button>
              )}

              {(userRole === "admin" || userRole === "manager") && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => navigateTo("/orders/shipped")}
                >
                  <TruckIcon className="h-8 w-8 mb-2 text-purple-500" />
                  <span>Track Shipments</span>
                </Button>
              )}

              {(userRole === "admin" || userRole === "manager" || userRole === "employee") && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => navigateTo("/orders/manage")}
                >
                  <Package className="h-8 w-8 mb-2" />
                  <span>All Orders</span>
                </Button>
              )}

              {(userRole === "admin" || userRole === "manager") && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => navigateTo("/product/viewProducts")}
                >
                  <BarChart className="h-8 w-8 mb-2" />
                  <span>Inventory Status</span>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
