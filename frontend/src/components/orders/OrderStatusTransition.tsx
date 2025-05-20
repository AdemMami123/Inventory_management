import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, InfoIcon, TruckIcon, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Order {
  _id: string;
  status: string;
  customer?: {
    name: string;
    email: string;
  };
  customerInfo?: {
    name: string;
    email: string;
  };
}

interface OrderStatusTransitionProps {
  order: Order;
  onStatusUpdate: (status: string, notes: string, trackingNumber?: string, estimatedDelivery?: string) => void;
  allowedTransitions: string[];
  onCancel: () => void;
}

export default function OrderStatusTransition({
  order,
  onStatusUpdate,
  allowedTransitions,
  onCancel
}: OrderStatusTransitionProps) {
  const [selectedStatus, setSelectedStatus] = useState(allowedTransitions[0] || "");
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedStatus) {
      return;
    }

    // Validate tracking number for shipped orders
    if (selectedStatus === "Shipped" && !trackingNumber) {
      return;
    }

    setIsSubmitting(true);
    
    // Convert date to string format if it exists
    const estimatedDeliveryStr = estimatedDelivery 
      ? format(estimatedDelivery, "yyyy-MM-dd") 
      : undefined;

    onStatusUpdate(
      selectedStatus, 
      notes, 
      selectedStatus === "Shipped" ? trackingNumber : undefined,
      selectedStatus === "Shipped" ? estimatedDeliveryStr : undefined
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "Shipped":
        return <TruckIcon className="h-5 w-5 text-purple-500" />;
      case "Delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "Approved":
        return "Mark this order as approved and ready for shipping";
      case "Shipped":
        return "Mark this order as shipped to the customer";
      case "Delivered":
        return "Mark this order as successfully delivered to the customer";
      case "Cancelled":
        return "Cancel this order (this action cannot be undone)";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Select New Status</Label>
        <div className="grid grid-cols-1 gap-2">
          {allowedTransitions.map((status) => (
            <Button
              key={status}
              type="button"
              variant={selectedStatus === status ? "default" : "outline"}
              className={cn(
                "justify-start text-left h-auto py-3",
                selectedStatus === status && status === "Cancelled" && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setSelectedStatus(status)}
            >
              <div className="flex items-center">
                {getStatusIcon(status)}
                <div className="ml-2">
                  <div className="font-medium">{status}</div>
                  <div className="text-xs text-muted-foreground">
                    {getStatusDescription(status)}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {selectedStatus === "Shipped" && (
        <div className="space-y-4 border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-2">
            <Label htmlFor="trackingNumber" className="text-sm font-medium">
              Tracking Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDelivery" className="text-sm font-medium">
              Estimated Delivery Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !estimatedDelivery && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {estimatedDelivery ? (
                    format(estimatedDelivery, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={estimatedDelivery}
                  onSelect={setEstimatedDelivery}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            selectedStatus === "Cancelled"
              ? "Please provide a reason for cancellation"
              : "Add any additional notes about this status change"
          }
          rows={3}
        />
      </div>

      {selectedStatus === "Cancelled" && (
        <Alert variant="destructive">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Cancelling an order is a permanent action and cannot be undone. The customer will be notified.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={
            isSubmitting || 
            !selectedStatus || 
            (selectedStatus === "Shipped" && !trackingNumber)
          }
          variant={selectedStatus === "Cancelled" ? "destructive" : "default"}
        >
          {isSubmitting ? "Processing..." : `Update to ${selectedStatus}`}
        </Button>
      </div>
    </div>
  );
}
