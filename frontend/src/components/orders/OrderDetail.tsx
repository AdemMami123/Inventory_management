"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

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
    product: Product;
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
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailProps {
  order: Order;
  userRole: string;
  onStatusUpdate?: (status: string, notes: string) => Promise<void>;
  onPaymentUpdate?: (paymentStatus: string, paymentMethod: string, notes: string) => Promise<void>;
  onClose?: () => void;
}

export default function OrderDetail({
  order,
  userRole,
  onStatusUpdate,
  onPaymentUpdate,
  onClose,
}: OrderDetailProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [newPaymentStatus, setNewPaymentStatus] = useState(order.paymentStatus);
  const [newPaymentMethod, setNewPaymentMethod] = useState(order.paymentMethod);
  const [statusNotes, setStatusNotes] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusStyles = {
      Unpaid: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Partially Paid": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const handleStatusUpdate = async () => {
    if (!onStatusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(newStatus, statusNotes);
      toast.success(`Order status updated to ${newStatus}`);
      setStatusNotes("");
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePaymentUpdate = async () => {
    if (!onPaymentUpdate) return;

    setIsUpdatingPayment(true);
    try {
      await onPaymentUpdate(newPaymentStatus, newPaymentMethod, paymentNotes);
      toast.success(`Payment status updated to ${newPaymentStatus}`);
      setPaymentNotes("");
    } catch (error) {
      toast.error("Failed to update payment status");
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const canUpdateStatus = () => {
    return (
      userRole === "admin" ||
      userRole === "manager" ||
      (userRole === "employee" && order.status !== "Delivered" && order.status !== "Declined")
    );
  };

  const canUpdatePayment = () => {
    return userRole === "admin" || userRole === "manager";
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Order Details</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Order Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Order ID:</span> {order._id}</p>
              <p><span className="font-medium">Date:</span> {formatDate(order.createdAt)}</p>
              <p>
                <span className="font-medium">Status:</span> {getStatusBadge(order.status)}
              </p>
              <p>
                <span className="font-medium">Payment Status:</span> {getPaymentStatusBadge(order.paymentStatus)}
              </p>
              <p><span className="font-medium">Payment Method:</span> {order.paymentMethod}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {order.customerInfo.name}</p>
              <p><span className="font-medium">Email:</span> {order.customerInfo.email}</p>
              {order.customerInfo.phone && (
                <p><span className="font-medium">Phone:</span> {order.customerInfo.phone}</p>
              )}
              {order.customerInfo.address && (
                <p><span className="font-medium">Address:</span> {order.customerInfo.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="font-semibold mb-2">Ordered Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.products.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>${typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right">${(typeof item.price === 'number' ? item.price * item.quantity : Number(item.price) * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4 font-semibold">
            <p className="mr-4">Total Amount:</p>
            <p>${typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div>
            <h3 className="font-semibold mb-2">Order Notes</h3>
            <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">{order.notes}</p>
          </div>
        )}

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Status History</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <ul className="space-y-2">
                {order.statusHistory.map((entry, index) => (
                  <li key={index} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{entry.status}</span>
                      <span className="text-gray-500">{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.notes && <p className="mt-1 text-gray-600 dark:text-gray-400">{entry.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Status Update Form (for staff) */}
        {canUpdateStatus() && onStatusUpdate && (
          <div className="border p-4 rounded-md">
            <h3 className="font-semibold mb-3">Update Order Status</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={isUpdatingStatus}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change"
                  className="w-full"
                  disabled={isUpdatingStatus}
                />
              </div>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus || newStatus === order.status}
              >
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        )}

        {/* Payment Update Form (for admin/manager) */}
        {canUpdatePayment() && onPaymentUpdate && (
          <div className="border p-4 rounded-md">
            <h3 className="font-semibold mb-3">Update Payment Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Status</label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    disabled={isUpdatingPayment}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    disabled={isUpdatingPayment}
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add notes about this payment update"
                  className="w-full"
                  disabled={isUpdatingPayment}
                />
              </div>
              <Button
                onClick={handlePaymentUpdate}
                disabled={isUpdatingPayment || (newPaymentStatus === order.paymentStatus && newPaymentMethod === order.paymentMethod)}
              >
                {isUpdatingPayment ? "Updating..." : "Update Payment"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
