"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast"; 

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  description: string;
  image: FileList;
}

export default function AddProductForm() {
  const { control, register, handleSubmit, reset } = useForm<ProductFormData>();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPreviewImage(URL.createObjectURL(file));
      setIsModalOpen(true);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    console.log("Submitting data:", data);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("sku", data.sku);
    formData.append("category", data.category);
    formData.append("quantity", data.quantity.toString());
    formData.append("price", data.price.toString());
    formData.append("description", data.description);

    if (data.image && data.image.length > 0) {
      formData.append("image", data.image[0]);
    }

    try {
      const response = await fetch("http://localhost:5000/api/products/", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      reset();
      setPreviewImage(null);

      
      router.push("/product/viewProducts");

      
      setTimeout(() => {
        toast.success(`${data.name} was added successfully!`);
      }, 500); // Delay of 500ms before showing toast
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto my-10 p-6 shadow-lg dark:bg-gray-900 bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Add New Product</CardTitle>
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
                defaultValue=""
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
              <Input id="price" {...register("price", { required: true })} type="number" placeholder="Enter price" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description", { required: true })} placeholder="Enter product description" />
          </div>

          <div>
            <Label htmlFor="image">Product Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              {...register("image", { required: true })}
              onChange={handleImageChange}
            />
          </div>

          {isModalOpen && previewImage && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-4 rounded-lg shadow-lg max-w-md">
                <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
                <Button className="mt-4 w-full" onClick={() => setIsModalOpen(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
