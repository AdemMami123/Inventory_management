"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  Calendar as CalendarIcon,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import RoleProtectedRoute from "@/components/common/RoleProtectedRoute";

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

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function ProductHistoryPage() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
      <ProductHistoryContent />
    </RoleProtectedRoute>
  );
}

function ProductHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [history, setHistory] = useState<ProductHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  // Filters
  const [productFilter, setProductFilter] = useState<string>(productId || "all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Product details dialog
  const [selectedEntry, setSelectedEntry] = useState<ProductHistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Products list for filter
  const [products, setProducts] = useState<{_id: string, name: string}[]>([]);
  const [users, setUsers] = useState<{_id: string, name: string}[]>([]);

  // Fetch product history
  const fetchHistory = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pagination.limit.toString());
      params.append("sortOrder", sortOrder);

      if (productFilter && productFilter !== "all") {
        params.append("product", productFilter);
      }

      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }

      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      if (changeTypeFilter && changeTypeFilter !== "all") {
        params.append("changeType", changeTypeFilter);
      }

      if (userFilter && userFilter !== "all") {
        params.append("user", userFilter);
      }

      // Determine which endpoint to use
      const endpoint = productFilter && productFilter !== "all"
        ? `http://localhost:5000/api/products/${productFilter}/history?${params.toString()}`
        : `http://localhost:5000/api/products/history/all?${params.toString()}`;

      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch product history");
      }

      const data = await response.json();

      setHistory(data.data.history);
      setPagination(data.data.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      toast.error(error instanceof Error ? error.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for filter dropdown
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products/", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.map((p: any) => ({ _id: p._id, name: p.name })));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Fetch users for filter dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users/customers", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.map((u: any) => ({ _id: u._id, name: u.name })));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchHistory();
    fetchProducts();
    fetchUsers();
  }, [productId]);

  // Fetch when filters change
  useEffect(() => {
    fetchHistory(1); // Reset to first page when filters change
  }, [productFilter, startDate, endDate, changeTypeFilter, userFilter, sortOrder]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchHistory(page);
  };

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

  // Reset filters
  const resetFilters = () => {
    setProductFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setChangeTypeFilter("all");
    setUserFilter("all");
    setSortOrder("desc");
  };

  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-right" />

      <Card className="bg-white dark:bg-gray-900 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">
            {productId ? "Product History" : "All Product History"}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchHistory(pagination.page)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {!productId && (
              <div>
                <label className="text-sm font-medium mb-1 block">Product</label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Change Type</label>
              <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Changes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Changes</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="price">Price Change</SelectItem>
                  <SelectItem value="quantity">Quantity Change</SelectItem>
                  <SelectItem value="information">Information Update</SelectItem>
                  <SelectItem value="status">Status Change</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Sort Order</label>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* History Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No history found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No product history entries match your current filters.
              </p>
              {Object.values({productFilter, changeTypeFilter, userFilter, startDate, endDate}).some(v => v) && (
                <Button onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      {!productFilter && <TableHead>Product</TableHead>}
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
                        {!productFilter && (
                          <TableCell>
                            {entry.product?.name || "Unknown Product"}
                          </TableCell>
                        )}
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
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    {pagination.page > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(pagination.page - 1)}>
                          Previous
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === pagination.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {pagination.page < pagination.pages && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(pagination.page + 1)}>
                          Next
                        </PaginationLink>
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
                <p className="text-gray-500 dark:text-gray-400">Product</p>
                <p>{selectedEntry.product?.name || "Unknown"}</p>
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
