"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast, Toaster } from "react-hot-toast";

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  image?: FileList;
}

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

export default function EditProductPage() {
  const { control, register, handleSubmit, setValue } = useForm<ProductFormData>();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const productId = searchParams ? searchParams.get('id') : null;

  // Fetch product data when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        toast.error("No product ID provided");
        setTimeout(() => window.location.href = "/product/viewProducts", 1500);
        return;
      }

      setFetchLoading(true);
      try {
        console.log(`Fetching product with ID: ${productId}`);
        const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch product (Status: ${response.status})`);
        }

        const productData = await response.json();
        console.log("Product data fetched:", productData);
        
        // Set product data in state
        setProduct(productData);
        
        // Set form values
        setValue("name", productData.name);
        setValue("sku", productData.sku);
        setValue("category", productData.category);
        setValue("quantity", Number(productData.quantity));
        setValue("price", Number(productData.price));
        setValue("description", productData.description);
        
        // Set preview image if available
        if (productData.image?.filePath) {
          setPreviewImage(`http://localhost:5000/${productData.image.filePath.replace(/\\/g, "/")}`);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch product";
        toast.error(errorMessage);
        // Navigate back to products list after short delay if fetch fails
        setTimeout(() => window.location.href = "/product/viewProducts", 2000);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProduct();
  }, [productId, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPreviewImage(URL.createObjectURL(file));
      setIsModalOpen(true);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!productId) return;
    
    setLoading(true);
    console.log("Submitting updated data:", data);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("sku", data.sku);
    formData.append("category", data.category);
    formData.append("quantity", data.quantity.toString());
    formData.append("price", data.price.toString());
    formData.append("description", data.description);

    // Only append image if a new one was selected
    if (data.image && data.image.length > 0) {
      formData.append("image", data.image[0]);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update product");
      }

      toast.success(`${data.name} was updated successfully!`);
      
      // Navigate back to product list
      setTimeout(() => {
        window.location.href = "/product/viewProducts";
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update product";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto my-10 p-6 shadow-lg dark:bg-gray-900 bg-white">
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Card className="w-full max-w-lg mx-auto  p-2 shadow-lg dark:bg-gray-900 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" {...register("name", { required: true })} placeholder="Enter product name" />
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...register("sku", { required: true })} placeholder="Enter SKU" />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="toys">Toys</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" {...register("quantity", { required: true })} type="number" placeholder="Enter quantity" />
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" {...register("price", { required: true })} type="number" placeholder="Enter price" step="0.01" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description", { required: true })} placeholder="Enter product description" />
            </div>

            <div>
              <Label htmlFor="image">Product Image</Label>
              {product?.image?.filePath && (
                <div className="mb-2">
                  <p className="text-sm text-gray-500 mb-1">Current image:</p>
                  <img 
                    src={`http://localhost:5000/${product.image.filePath.replace(/\\/g, "/")}`}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                    }}
                  />
                </div>
              )}
              <Input
                id="image"
                type="file"
                accept="image/*"
                {...register("image")}
                onChange={handleImageChange}
              />
              <p className="text-xs text-gray-500 mt-1">Upload a new image only if you want to change the current one</p>
            </div>

            {isModalOpen && previewImage && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg max-w-md">
                  <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
                  <Button className="mt-4 w-full" onClick={() => setIsModalOpen(false)}>
                    Close Preview
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => window.location.href = "/product/viewProducts"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
