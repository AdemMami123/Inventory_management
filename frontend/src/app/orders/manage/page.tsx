"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import OrderDetail from "@/components/orders/OrderDetail";

interface StatusHistoryEntry {
  status: string;
  notes: string;
  timestamp: string;
  updatedBy?: {
    _id: string;
    name: string;
  };
}

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
      quantity?: number;
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
  statusHistory: StatusHistoryEntry[];
  trackingNumber?: string;
  estimatedDelivery?: string;
  canCancel?: boolean;
  canReturn?: boolean;
  daysSinceOrder?: number;
  isRecentOrder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/orders/all", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders. Please check your permissions.");
      }

      const responseData = await response.json();
      // Check if the response has a data property (new API format)
      if (responseData && responseData.data) {
        setOrders(responseData.data);
      } else {
        // Fallback to the old format or empty array if no data
        setOrders(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load orders";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const baseStyle = "px-2 py-1 text-xs rounded-full";

    switch (status) {
      case "Pending":
        return <span className={`${baseStyle} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case "Approved":
        return <span className={`${baseStyle} bg-green-100 text-green-800`}>Approved</span>;
      case "Cancelled":
        return <span className={`${baseStyle} bg-red-100 text-red-800`}>Cancelled</span>;
      case "Shipped":
        return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>Shipped</span>;
      case "Delivered":
        return <span className={`${baseStyle} bg-purple-100 text-purple-800`}>Delivered</span>;
      default:
        return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      console.log("Fetching order details for ID:", orderId);
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "GET",
        credentials: "include",
      });

      console.log("Order details response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to fetch order details (Status: ${response.status})`
        );
      }

      const responseData = await response.json();
      console.log("Order details response data:", responseData);

      // Check if the response has a data property (new API format)
      if (responseData && responseData.data) {
        setSelectedOrder(responseData.data);
      } else {
        // Fallback to the old format
        setSelectedOrder(responseData);
      }
      setOrderDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load order details";
      toast.error(errorMessage);
    }
  };

  const openUpdateStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNotes("");
    setTrackingNumber(order.trackingNumber || "");
    setEstimatedDelivery(
      order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toISOString().split('T')[0]
        : ""
    );
    setUpdateStatusOpen(true);
  };

  const updateOrderStatus = async (status: string, notes: string, trackingNumber?: string, estimatedDelivery?: string) => {
    if (!selectedOrder) {
      toast.error("No order selected");
      return;
    }

    if (!selectedOrder._id) {
      toast.error("Invalid order ID");
      return;
    }

    setIsUpdating(true);

    try {
      // Check if the status transition is valid
      const validTransitions = {
        "Pending": ["Approved", "Cancelled"],
        "Approved": ["Shipped", "Cancelled"],
        "Shipped": ["Delivered", "Cancelled"],
        "Delivered": [], // Terminal state
        "Cancelled": []  // Terminal state
      };

      // Validate the status transition
      if (selectedOrder.status !== status) {
        // Check if the transition is allowed
        if (!validTransitions[selectedOrder.status as keyof typeof validTransitions]?.includes(status)) {
          throw new Error(`Invalid status transition from ${selectedOrder.status} to ${status}`);
        }

        // Additional validation for Shipped status
        if (status === "Shipped" && !trackingNumber) {
          throw new Error("Tracking number is required for shipped orders");
        }
      }

      // Prepare request data
      const requestData: any = {
        status,
        notes
      };

      // Add tracking number and estimated delivery for shipped orders
      if (status === "Shipped") {
        if (trackingNumber) {
          requestData.trackingNumber = trackingNumber;
        }

        if (estimatedDelivery) {
          requestData.estimatedDelivery = estimatedDelivery;
        }
      }

      console.log("Sending order status update:", requestData);
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      console.log("Status update response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update order status (Status: ${response.status})`
        );
      }

      const responseData = await response.json();

      // Extract the updated order from the response
      const updatedOrder = responseData.data || responseData;

      // Update the orders list with the updated order
      setOrders(orders.map(order =>
        order._id === updatedOrder._id ? updatedOrder : order
      ));

      toast.success(`Order status updated to ${status}`);
      setUpdateStatusOpen(false);

      // If we were looking at order details, update that view too
      if (orderDetailsOpen) {
        setSelectedOrder(updatedOrder);
      }

      return updatedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update order status";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePaymentInfo = async (paymentStatus: string, paymentMethod: string, notes: string) => {
    if (!selectedOrder) {
      toast.error("No order selected");
      return;
    }

    if (!selectedOrder._id) {
      toast.error("Invalid order ID");
      return;
    }

    setIsUpdating(true);

    try {
      console.log("Sending payment update:", { paymentStatus, paymentMethod, notes, orderId: selectedOrder._id });
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentStatus,
          paymentMethod,
          notes
        }),
      });

      console.log("Payment update response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to update payment information (Status: ${response.status})`
        );
      }

      const responseData = await response.json();

      // Extract the updated order from the response
      const updatedOrder = responseData.data || responseData;

      // Update the orders list with the updated order
      setOrders(orders.map(order =>
        order._id === updatedOrder._id ? updatedOrder : order
      ));

      toast.success(`Payment status updated to ${paymentStatus}`);

      // If we were looking at order details, update that view too
      if (orderDetailsOpen) {
        setSelectedOrder(updatedOrder);
      }

      return updatedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update payment information";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchTermLower = searchQuery.toLowerCase();
    const customerName = order.customer?.name || order.customerInfo?.name || "";
    const customerEmail = order.customer?.email || order.customerInfo?.email || "";

    return (
      order._id.toLowerCase().includes(searchTermLower) ||
      customerName.toLowerCase().includes(searchTermLower) ||
      customerEmail.toLowerCase().includes(searchTermLower) ||
      order.status.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <Card className="bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Order Management</CardTitle>
            <Button variant="outline" onClick={fetchAllOrders}>Refresh Orders</Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search by order ID, customer name, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-lg"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No orders found</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">
                          {order._id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
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
                        <TableCell>${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : Number(order.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewOrderDetails(order._id)}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openUpdateStatusDialog(order)}
                              disabled={order.status === "Delivered" || order.status === "Cancelled"}
                            >
                              Update Status
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

        {/* Order Details Dialog */}
        {selectedOrder && (
          <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <OrderDetail
                order={selectedOrder}
                userRole="admin" // In a real app, this would come from auth context
                onStatusUpdate={updateOrderStatus}
                onPaymentUpdate={updatePaymentInfo}
                onClose={() => setOrderDetailsOpen(false)}
              />
              {/* Debug info */}
              <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 text-xs">
                <p>Order ID: {selectedOrder._id}</p>
                <p>Current Status: {selectedOrder.status}</p>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Update Status Dialog */}
        {selectedOrder && (
          <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Change the status of order #{selectedOrder._id.substring(0, 8)}...
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedOrder.status === "Pending" && (
                        <>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </>
                      )}
                      {selectedOrder.status === "Approved" && (
                        <>
                          <SelectItem value="Shipped">Shipped</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </>
                      )}
                      {selectedOrder.status === "Shipped" && (
                        <>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show tracking number and estimated delivery fields for Shipped status */}
                {newStatus === "Shipped" && (
                  <>
                    <div>
                      <Label htmlFor="trackingNumber">Tracking Number</Label>
                      <Input
                        id="trackingNumber"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        disabled={isUpdating}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
                      <Input
                        id="estimatedDelivery"
                        type="date"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        disabled={isUpdating}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add notes about this status change"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateStatusOpen(false)} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Validate tracking number for shipped orders
                    if (newStatus === "Shipped" && !trackingNumber) {
                      toast.error("Please provide a tracking number for shipped orders");
                      return;
                    }

                    // Validate the status transition
                    const validTransitions = {
                      "Pending": ["Approved", "Cancelled"],
                      "Approved": ["Shipped", "Cancelled"],
                      "Shipped": ["Delivered", "Cancelled"],
                      "Delivered": [], // Terminal state
                      "Cancelled": []  // Terminal state
                    };

                    if (selectedOrder.status !== newStatus &&
                        !validTransitions[selectedOrder.status as keyof typeof validTransitions]?.includes(newStatus)) {
                      toast.error(`Invalid status transition from ${selectedOrder.status} to ${newStatus}`);
                      return;
                    }

                    updateOrderStatus(newStatus, statusNotes, trackingNumber, estimatedDelivery);
                  }}
                  disabled={isUpdating || newStatus === selectedOrder.status}
                >
                  {isUpdating ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}