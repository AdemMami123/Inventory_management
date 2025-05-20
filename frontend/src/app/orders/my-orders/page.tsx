"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Search, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Filter, 
  ArrowUpDown, 
  Download, 
  ShoppingCart, 
  Clock, 
  Package, 
  CheckCircle, 
  XCircle, 
  Truck 
} from "lucide-react";
import OrderDetail from "@/components/orders/OrderDetail";

interface Order {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  products: {
    product: {
      _id: string;
      name: string;
      price: number;
      image: {
        filePath: string;
      };
    };
    quantity: number;
    price: number;
    name: string;
  }[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  statusHistory: {
    status: string;
    notes: string;
    timestamp: string;
    updatedBy: {
      _id: string;
      name: string;
      role: string;
    };
  }[];
  canCancel: boolean;
  canReturn: boolean;
  daysSinceOrder: number;
  isRecentOrder: boolean;
  statusTimeline: {
    status: string;
    timestamp: string;
    notes: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  Pending: number;
  Approved: number;
  Shipped: number;
  Delivered: number;
  Cancelled: number;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    Pending: 0,
    Approved: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchMyOrders();
  }, [activeTab, startDate, endDate]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add status filter if not "all"
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }
      
      // Add date filters if set
      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }
      
      // Add search query if present
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`http://localhost:5000/api/orders/my-orders?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch your orders");
      }

      const responseData = await response.json();
      
      if (responseData.success) {
        setOrders(responseData.data);
        setStatusCounts(responseData.statusCounts || {
          Pending: 0,
          Approved: 0,
          Shipped: 0,
          Delivered: 0,
          Cancelled: 0
        });
      } else {
        throw new Error(responseData.message || "Failed to fetch orders");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch orders";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const responseData = await response.json();
      
      if (responseData.success) {
        setSelectedOrder(responseData.data);
        setOrderDetailsOpen(true);
      } else {
        throw new Error(responseData.message || "Failed to fetch order details");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load order details";
      toast.error(errorMessage);
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Generating invoice...");
      
      // Fetch the invoice as a blob
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/invoice`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${orderId}.pdf`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download invoice";
      toast.error(errorMessage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMyOrders();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Approved": return <Package className="h-4 w-4 text-blue-500" />;
      case "Shipped": return <Truck className="h-4 w-4 text-purple-500" />;
      case "Delivered": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Cancelled": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <Card className="bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">My Orders</CardTitle>
              <CardDescription>
                View and manage your order history
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchMyOrders}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button onClick={() => router.push("/orders/create")}>
                <ShoppingCart className="h-4 w-4 mr-1" />
                New Order
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search orders by product or ID..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {startDate && endDate ? (
                        <span>
                          {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                        </span>
                      ) : (
                        <span>Date Range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 border-b">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Date Range</h4>
                        <p className="text-xs text-gray-500">
                          Select a date range to filter orders
                        </p>
                      </div>
                    </div>
                    <div className="p-3 flex gap-2">
                      <div>
                        <h4 className="text-xs font-medium mb-1">Start Date</h4>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium mb-1">End Date</h4>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </div>
                    </div>
                    <div className="p-3 border-t flex justify-end">
                      <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tabs for status filtering */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="all">
                  All ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
                </TabsTrigger>
                <TabsTrigger value="Pending">
                  Pending ({statusCounts.Pending})
                </TabsTrigger>
                <TabsTrigger value="Approved">
                  Approved ({statusCounts.Approved})
                </TabsTrigger>
                <TabsTrigger value="Shipped">
                  Shipped ({statusCounts.Shipped})
                </TabsTrigger>
                <TabsTrigger value="Delivered">
                  Delivered ({statusCounts.Delivered})
                </TabsTrigger>
                <TabsTrigger value="Cancelled">
                  Cancelled ({statusCounts.Cancelled})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Orders Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium mb-2">No orders found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {activeTab === "all"
                    ? "You haven't placed any orders yet."
                    : `You don't have any ${activeTab.toLowerCase()} orders.`}
                </p>
                <Button onClick={() => router.push("/orders/create")}>
                  Place Your First Order
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">
                          {order._id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {getStatusBadge(order.status)}
                          </div>
                        </TableCell>
                        <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === "Paid" ? "default" : "outline"}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewOrderDetails(order._id)}
                            >
                              Details
                            </Button>
                            {order.status === "Delivered" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadInvoice(order._id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Invoice
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            <OrderDetail
              order={selectedOrder}
              userRole="customer"
              onClose={() => setOrderDetailsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
