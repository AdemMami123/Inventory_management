"use client";

import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface ProductHistoryEntry {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
  };
  changeType: "created" | "price" | "quantity" | "information" | "status" | "deleted";
  field: string;
  previousValue: any;
  newValue: any;
  notes: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

interface ProductHistorySectionProps {
  productId: string;
  limit?: number;
}

export default function ProductHistorySection({ productId, limit = 5 }: ProductHistorySectionProps) {
  const router = useRouter();
  const [history, setHistory] = useState<ProductHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ProductHistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}/history?limit=${limit}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch product history");
        }

        const data = await response.json();
        setHistory(data.data.history);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchHistory();
    }
  }, [productId, limit]);

  // Format change type for display
  const formatChangeType = (type: string) => {
    switch (type) {
      case "created": return "Created";
      case "price": return "Price Change";
      case "quantity": return "Quantity Change";
      case "information": return "Information Update";
      case "status": return "Status Change";
      case "deleted": return "Deleted";
      default: return type;
    }
  };

  // Get badge color based on change type
  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case "created": return <Badge className="bg-green-500">Created</Badge>;
      case "price": return <Badge className="bg-blue-500">Price</Badge>;
      case "quantity": return <Badge className="bg-yellow-500">Quantity</Badge>;
      case "information": return <Badge className="bg-purple-500">Info</Badge>;
      case "status": return <Badge className="bg-orange-500">Status</Badge>;
      case "deleted": return <Badge className="bg-red-500">Deleted</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  // View entry details
  const viewEntryDetails = (entry: ProductHistoryEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  };

  // View full history
  const viewFullHistory = () => {
    router.push(`/product/history?productId=${productId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 py-2">
        <p>Error loading history: {error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No history available for this product.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Change Type</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>{formatDate(entry.timestamp)}</TableCell>
                <TableCell>
                  {getChangeTypeBadge(entry.changeType)}
                </TableCell>
                <TableCell>{entry.field}</TableCell>
                <TableCell>{entry.user?.name || "Unknown User"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewEntryDetails(entry)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-center">
        <Button variant="outline" onClick={viewFullHistory}>
          View Full History
        </Button>
      </div>

      {/* Details Dialog */}
      {selectedEntry && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Change Details</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Date</p>
                <p>{formatDate(selectedEntry.timestamp)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">User</p>
                <p>{selectedEntry.user?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Change Type</p>
                <p>{formatChangeType(selectedEntry.changeType)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Field</p>
                <p>{selectedEntry.field}</p>
              </div>
              {selectedEntry.notes && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Notes</p>
                  <p>{selectedEntry.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Change Values</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Previous Value</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                    {selectedEntry.previousValue !== null
                      ? JSON.stringify(selectedEntry.previousValue, null, 2)
                      : "N/A"}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">New Value</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                    {selectedEntry.newValue !== null
                      ? JSON.stringify(selectedEntry.newValue, null, 2)
                      : "N/A"}
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
