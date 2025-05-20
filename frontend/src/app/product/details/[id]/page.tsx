"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShoppingCart, Edit, AlertTriangle, History } from "lucide-react";
import RoleIndicator from "@/components/common/RoleIndicator";
import toast, { Toaster } from "react-hot-toast";
import ProductHistorySection from "@/components/products/ProductHistorySection";

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

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
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

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5000/api/products/${params.id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to fetch product (Status: ${response.status})`);
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch product";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
    fetchProduct();
  }, [params.id]);

  const handleGoBack = () => {
    router.back();
  };

  const handleOrder = () => {
    router.push(`/orders/create?productId=${product?._id}`);
  };

  const handleEdit = () => {
    router.push(`/product/editProduct?id=${product?._id}`);
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = isAdmin || isManager;

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-80 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4 mt-6">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGoBack}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested product could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGoBack}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={handleGoBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <RoleIndicator showLabel={true} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
            {product.image?.filePath ? (
              <img
                src={`http://localhost:5000/${product.image.filePath.replace(/\\/g, "/")}`}
                alt={product.name}
                className="w-full h-80 object-contain p-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                }}
              />
            ) : (
              <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No Image Available</p>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{product.category}</Badge>
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            </div>

            <div className="mb-4">
              <p className="text-2xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
              <p className="text-sm mt-1">
                {product.quantity > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    In Stock ({product.quantity} available)
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Out of Stock</span>
                )}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleOrder}
                className="flex items-center gap-2"
                disabled={product.quantity <= 0}
              >
                <ShoppingCart className="h-4 w-4" />
                Order Now
              </Button>

              {isStaff && (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Product
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Product History Section (Admin/Manager only) */}
        {isStaff && (
          <div className="mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Product History
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/product/history?productId=${product._id}`)}
                >
                  View Full History
                </Button>
              </CardHeader>
              <CardContent>
                <ProductHistorySection productId={product._id} limit={5} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
