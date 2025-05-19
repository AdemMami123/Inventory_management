"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";

interface Order {
  _id: string;
  products: {
    product: {
      _id: string;
      name: string;
      price: number;
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

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
      case "Declined":
        return <span className={`${baseStyle} bg-red-100 text-red-800`}>Declined</span>;
      case "Shipped":
        return <span className={`${baseStyle} bg-blue-100 text-blue-800`}>Shipped</span>;
      case "Delivered":
        return <span className={`${baseStyle} bg-purple-100 text-purple-800`}>Delivered</span>;
      default:
        return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "Pending":
        return "Your order has been received and is awaiting approval.";
      case "Approved":
        return "Your order has been approved and is being prepared.";
      case "Declined":
        return "Your order could not be processed. Please see notes for details.";
      case "Shipped":
        return "Your order is on the way!";
      case "Delivered":
        return "Your order has been delivered successfully.";
      default:
        return "";
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

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <Card className="bg-white dark:bg-gray-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">My Orders</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchMyOrders}>
                Refresh
              </Button>
              <Button variant="default" onClick={() => router.push("/orders/create")}>
                Place New Order
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">You havent placed any orders yet.</p>
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
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
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
                        <TableCell>${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : Number(order.totalAmount).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewOrderDetails(order._id)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedOrder && (
          <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details</DialogTitle>
              </DialogHeader>

              {/* Status Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Status:</span>
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
                        <TableCell>${typeof item.product.price === 'number' ? item.product.price.toFixed(2) : Number(item.product.price).toFixed(2)}</TableCell>
                        <TableCell>${(item.quantity * (typeof item.product.price === 'number' ? item.product.price : Number(item.product.price))).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end mt-4 font-semibold">
                  <p className="mr-4">Total Amount:</p>
                  <p>${typeof selectedOrder.totalAmount === 'number' ? selectedOrder.totalAmount.toFixed(2) : Number(selectedOrder.totalAmount).toFixed(2)}</p>
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
      </div>
    </>
  );
}