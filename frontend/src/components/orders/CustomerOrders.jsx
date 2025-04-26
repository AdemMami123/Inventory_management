"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/orders/my-orders", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders. Please try logging in again.");
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "Processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Processing</Badge>;
      case "Shipped":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Shipped</Badge>;
      case "Delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
      case "Cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      case "Refunded":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const orderData = await response.json();
      setSelectedOrder(orderData);
      setOrderDetailsOpen(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "Pending":
        return "Your order has been received and is awaiting confirmation.";
      case "Processing":
        return "Your order has been confirmed and is being prepared.";
      case "Shipped":
        return "Your order is on the way!";
      case "Delivered":
        return "Your order has been delivered successfully.";
      case "Cancelled":
        return "This order has been cancelled.";
      case "Refunded":
        return "Your order has been refunded.";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto my-6 shadow-md">
        <CardHeader className="bg-gray-50 dark:bg-gray-800">
          <CardTitle className="text-xl font-semibold">My Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't placed any orders yet.</p>
              <Button onClick={() => router.push("/product/viewProducts")}>
                Browse Products
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-xs">{order._id.substring(0, 8)}...</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => viewOrderDetails(order._id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Order Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Order Status */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Status</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getStatusMessage(selectedOrder.status)}
                </p>
                {selectedOrder.notes && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm">
                    <strong>Note:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>
              
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Order ID</p>
                  <p className="font-mono">{selectedOrder._id}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Date Placed</p>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
                {selectedOrder.trackingNumber && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Tracking Number</p>
                    <p className="font-mono">{selectedOrder.trackingNumber}</p>
                  </div>
                )}
                {selectedOrder.estimatedDelivery && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Estimated Delivery</p>
                    <p>{formatDate(selectedOrder.estimatedDelivery)}</p>
                  </div>
                )}
              </div>
              
              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Ordered Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.products.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.product.price.toFixed(2)}</TableCell>
                        <TableCell>${(item.quantity * item.product.price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-end mt-4 font-semibold">
                  <p className="mr-4">Total Amount:</p>
                  <p>${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOrderDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}