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
import { CheckCircle, Search, Filter, ArrowUpDown, TruckIcon, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OrderStatusTransition from "@/components/orders/OrderStatusTransition";

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
  createdAt: string;
  updatedAt: string;
}

export default function ApprovedOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchApprovedOrders();
  }, []);

  const fetchApprovedOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/orders/all?status=Approved", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch approved orders");
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
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch approved orders";
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, notes: string, trackingNumber?: string, estimatedDelivery?: string) => {
    try {
      const requestData: any = {
        status: newStatus,
        notes: notes
      };

      // Add tracking number and estimated delivery for shipped orders
      if (newStatus === "Shipped") {
        if (trackingNumber) {
          requestData.trackingNumber = trackingNumber;
        }

        if (estimatedDelivery) {
          requestData.estimatedDelivery = estimatedDelivery;
        }
      }

      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      toast.success(`Order status updated to ${newStatus}`);
      fetchApprovedOrders(); // Refresh the list
      setStatusDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update order status";
      toast.error(errorMessage);
    }
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const searchTermLower = searchQuery.toLowerCase();
    const customerName = order.customer?.name || order.customerInfo?.name || "";
    const customerEmail = order.customer?.email || order.customerInfo?.email || "";
    
    return (
      order._id.toLowerCase().includes(searchTermLower) ||
      customerName.toLowerCase().includes(searchTermLower) ||
      customerEmail.toLowerCase().includes(searchTermLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
                  <CheckCircle className="mr-2 h-6 w-6 text-blue-500" />
                  Approved Orders
                </div>
              </CardTitle>
              <CardDescription>
                Orders that have been approved and are ready to ship
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchApprovedOrders}>
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
                  placeholder="Search by order ID or customer..."
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
                <p className="text-gray-500">No approved orders found</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
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
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : Number(order.totalAmount || 0).toFixed(2)}</TableCell>
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
                              onClick={() => router.push(`/orders/details/${order._id}`)}
                            >
                              Details
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openStatusDialog(order)}
                            >
                              Ship
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

      {/* Status Update Dialog */}
      {selectedOrder && (
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            <OrderStatusTransition
              order={selectedOrder}
              onStatusUpdate={(newStatus, notes, trackingNumber, estimatedDelivery) => {
                handleStatusUpdate(selectedOrder._id, newStatus, notes, trackingNumber, estimatedDelivery);
              }}
              allowedTransitions={["Shipped", "Cancelled"]}
              onCancel={() => setStatusDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
