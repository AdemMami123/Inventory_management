"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, RefreshCw, ShieldAlert, Eye, Edit, Trash2, ShoppingCart, PlusCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import RoleIndicator from "@/components/common/RoleIndicator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  image?: {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: string;
  };
}

const API_URL = "http://localhost:5000/api/products/";

export default function ViewProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "category">("name");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 5;

  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users/getuser", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const fetchProducts = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching products from API...");

      const response = await fetch("http://localhost:5000/api/products/", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API Error:", response.status, errorData);
        throw new Error(
          errorData?.message ||
          `Failed to fetch products (Status: ${response.status})`
        );
      }

      const data = await response.json();
      console.log("Products fetched successfully:", data);

      // Ensure data is an array before setting it to state
      const productArray = Array.isArray(data) ? data : [];
      setProducts(productArray);

      // Reset to first page when refreshing or initial load
      if (showRefreshingState || currentPage > Math.ceil(productArray.length / itemsPerPage)) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch products";
      setError(errorMessage);
      toast.error(errorMessage);
      setProducts([]); // Set to empty array on error
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = () => {
    fetchProducts(true);
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;

    try {
      const response = await fetch(`${API_URL}${deleteProductId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete product");
      }

      setProducts((prevProducts) => prevProducts.filter((product) => product._id !== deleteProductId));
      setDeleteProductId(null);

      toast.success("Product deleted successfully!", { duration: 3000 });

      // If we deleted the last item on a page, go to previous page
      const remainingProducts = products.filter(p => p._id !== deleteProductId);
      const newTotalPages = Math.ceil(remainingProducts.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
      toast.error(errorMessage);
    }
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) =>
        product[searchType]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Card className="w-full max-w-5xl mx-auto my-10 p-6 shadow-lg dark:bg-gray-900 bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">Product List</CardTitle>
            <RoleIndicator showLabel={true} />

            {/* Role-based access information */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 cursor-help">
                    <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Access Info</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Role-Based Access:</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Customers:</span> Can view products and place orders</p>
                      <p><span className="font-medium">Admin/Manager:</span> Full product management (create, edit, delete)</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            {/* Add Product button - only for admin/manager */}
            {userRole && ['admin', 'manager'].includes(userRole) && (
              <Button
                size="sm"
                variant="default"
                onClick={() => window.location.href = '/product/addProduct'}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 text-gray-500" size={18} />
              <Input
                type="text"
                placeholder={`Search by ${searchType}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg"
              />
            </div>

            <Select value={searchType} onValueChange={(value) => setSearchType(value as "name" | "category")}>
              <SelectTrigger className="w-32 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => fetchProducts()}
              >
                Try Again
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No products found</p>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          {product.image?.filePath ? (
                            <img
                              src={`http://localhost:5000/${product.image.filePath.replace(/\\/g, "/")}`}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                            {product.category}
                          </span>
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* View button for all users */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.location.href = `/product/details/${product._id}`}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Admin/Manager only actions */}
                            {userRole && ['admin', 'manager'].includes(userRole) ? (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.location.href = `/product/editProduct?id=${product._id}`}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit Product</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeleteProductId(product._id)}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete Product</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.location.href = `/orders/create?productId=${product._id}`}
                                      className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                                    >
                                      <ShoppingCart className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Order Product</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        isActive={currentPage === index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
