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
import { XCircle, Search, Filter, ArrowUpDown, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  statusHistory: {
    status: string;
    notes: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function CancelledOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCancelledOrders();
  }, []);

  const fetchCancelledOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/orders/all?status=Cancelled", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cancelled orders");
      }

      const responseData = await response.json();
      
      // Check if the response has a data property (new API format)
      if (responseData && responseData.data) {
        setOrders(responseData.data);
      } else {
        // Fallback to the old format
        setOrders(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch cancelled orders";
      toast.error(errorMessage);
      setOrders([]);
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
      // Check if the response has a data property (new API format)
      if (responseData && responseData.data) {
        setSelectedOrder(responseData.data);
      } else {
        // Fallback to the old format
        setSelectedOrder(responseData);
      }
      setOrderDetailsOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load order details";
      toast.error(errorMessage);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchTermLower = searchQuery.toLowerCase();
    const customerName = order.customer?.name || order.customerInfo?.name || "";
    const customerEmail = order.customer?.email || order.customerInfo?.email || "";
    const notes = order.notes || "";
    
    return (
      order._id.toLowerCase().includes(searchTermLower) ||
      customerName.toLowerCase().includes(searchTermLower) ||
      customerEmail.toLowerCase().includes(searchTermLower) ||
      notes.toLowerCase().includes(searchTermLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Find the cancellation reason from status history
  const getCancellationReason = (order: Order) => {
    if (!order.statusHistory || order.statusHistory.length === 0) return "No reason provided";
    
    // Find the entry where status changed to Cancelled
    const cancellationEntry = order.statusHistory.find(entry => entry.status === "Cancelled");
    return cancellationEntry?.notes || "No reason provided";
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                <div className="flex items-center">
                  <XCircle className="mr-2 h-6 w-6 text-red-500" />
                  Cancelled Orders
                </div>
              </CardTitle>
              <CardDescription>
                Orders that were cancelled at any stage
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchCancelledOrders}>
                Refresh
              </Button>
              <Button onClick={() => router.push("/orders/manage")}>
                All Orders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search by order ID, customer, or notes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No cancelled orders found</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Cancelled Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">
                          {order._id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.customer?.name || order.customerInfo?.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer?.email || order.customerInfo?.email || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.updatedAt)}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {getCancellationReason(order)}
                          </div>
                        </TableCell>
                        <TableCell>${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : Number(order.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewOrderDetails(order._id)}
                            >
                              Details
                            </Button>
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
              userRole="admin" // In a real app, this would come from auth context
              onClose={() => setOrderDetailsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
