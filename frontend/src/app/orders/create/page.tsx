"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast, { Toaster } from "react-hot-toast";
import { PlusCircle, Trash2, ShoppingCart } from "lucide-react";

interface Product {
  _id: string;
  name: string;
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

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function CreateOrder() {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("Other");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAvailableProducts();
    fetchUserRole();
  }, []);

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

        // If user is staff (admin, manager, employee), show customer form by default
        if (userData.role === 'admin' || userData.role === 'manager' || userData.role === 'employee') {
          setShowCustomerForm(true);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/orders/available-products", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setAvailableProducts(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch products";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setProductDialogOpen(true);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.product._id === selectedProduct._id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += selectedQuantity;

      // Validate against available stock
      if (updatedItems[existingItemIndex].quantity > selectedProduct.quantity) {
        toast.error(`Cannot add more than ${selectedProduct.quantity} units of ${selectedProduct.name}`);
        return;
      }

      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, {
        product: selectedProduct,
        quantity: selectedQuantity
      }]);
    }

    setProductDialogOpen(false);
    toast.success(`Added ${selectedQuantity} × ${selectedProduct.name} to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product._id !== productId));
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    const product = availableProducts.find(p => p._id === productId);
    if (!product) return;

    // Validate against available stock
    if (quantity > product.quantity) {
      toast.error(`Cannot add more than ${product.quantity} units of ${product.name}`);
      return;
    }

    setCartItems(cartItems.map(item =>
      item.product._id === productId ? { ...item, quantity } : item
    ));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate customer info if form is shown
    if (showCustomerForm) {
      if (!customerInfo.name || !customerInfo.email) {
        toast.error("Please provide customer name and email");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare the request body
      const orderData = {
        products: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity
        })),
        totalAmount: calculateTotal(),
        paymentMethod,
        notes: "Order created via web interface"
      };

      // Add customerInfo only if the form is shown and filled out
      if (showCustomerForm && customerInfo.name && customerInfo.email) {
        orderData.customerInfo = customerInfo;
      }

      console.log("Sending order data:", orderData);

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to create order (Status: ${response.status})`
        );
      }

      await response.json();

      toast.success("Order placed successfully!");

      // Clear cart
      setCartItems([]);

      // Redirect to order history
      setTimeout(() => {
        router.push("/orders/history");
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create order";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  const filteredProducts = availableProducts.filter(product => {
    const searchTermLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchTermLower) ||
      product.category.toLowerCase().includes(searchTermLower) ||
      product.description.toLowerCase().includes(searchTermLower)
    );
  });

  const inStock = (product: Product) => {
    const cartItem = cartItems.find(item => item.product._id === product._id);
    const reservedQuantity = cartItem ? cartItem.quantity : 0;
    return product.quantity - reservedQuantity;
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="md:col-span-2">
            <Card className="bg-white dark:bg-gray-900 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Available Products</CardTitle>
                <CardDescription>Select products to add to your order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    <p>{error}</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                      <Card key={product._id} className="overflow-hidden">
                        <div className="flex h-full">
                          <div className="w-1/3 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {product.image?.filePath ? (
                              <img
                                src={`http://localhost:5000/${product.image.filePath.replace(/\\/g, "/")}`}
                                alt={product.name}
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                                }}
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold truncate">{product.name}</h3>
                              <p className="text-sm text-gray-500 capitalize">{product.category}</p>
                              <p className="font-medium mt-1">${Number(product.price).toFixed(2)}</p>
                              <p className="text-sm text-gray-500 mt-1">In stock: {product.quantity}</p>
                            </div>
                            <Button
                              className="mt-2"
                              size="sm"
                              variant={inStock(product) > 0 ? "default" : "outline"}
                              disabled={inStock(product) <= 0}
                              onClick={() => openProductDialog(product)}
                            >
                              <PlusCircle className="h-4 w-4 mr-1" /> Add to Order
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div>
            <Card className="bg-white dark:bg-gray-900 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Your Order</CardTitle>
                <CardDescription>
                  {cartItems.length === 0
                    ? "Your cart is empty"
                    : `${cartItems.length} ${cartItems.length === 1 ? "item" : "items"} in cart`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto opacity-30" />
                    <p className="mt-2">Add products to start your order</p>
                  </div>
                ) : (
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.product._id}>
                            <TableCell className="font-medium">{item.product.name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                max={item.product.quantity}
                                value={item.quantity}
                                onChange={(e) => updateCartItemQuantity(item.product._id, parseInt(e.target.value))}
                                className="w-16 h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeFromCart(item.product._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="border-t mt-4 pt-4">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={cartItems.length === 0 || isSubmitting}
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  {isSubmitting ? "Processing..." : "Place Order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Product Dialog */}
      {selectedProduct && (
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Order</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center gap-4 mb-4">
                {selectedProduct.image?.filePath ? (
                  <img
                    src={`http://localhost:5000/${selectedProduct.image.filePath.replace(/\\/g, "/")}`}
                    alt={selectedProduct.name}
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

                <div>
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500">${Number(selectedProduct.price).toFixed(2)} per unit</p>
                  <p className="text-sm text-gray-500">Available: {selectedProduct.quantity}</p>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.quantity}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                />
              </div>

              {selectedProduct.description && (
                <div className="mb-4">
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedProduct.description}</p>
                </div>
              )}

              <div className="font-semibold text-right">
                Total: ${(selectedProduct.price * selectedQuantity).toFixed(2)}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addToCart}>
                Add to Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4">Please review your order details before confirming.</p>

            <div className="border rounded-md p-3 mb-4 bg-gray-50 dark:bg-gray-800">
              <p className="font-semibold mb-2">Order Summary:</p>
              <ul className="text-sm space-y-1">
                {cartItems.map(item => (
                  <li key={item.product._id}>{item.quantity} × {item.product.name}</li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Information Form */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Customer Information</h3>
                {userRole === 'customer' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomerForm(!showCustomerForm)}
                    className="h-8 text-xs"
                  >
                    {showCustomerForm ? "Hide Form" : "Add Customer Info"}
                  </Button>
                )}
              </div>

              {showCustomerForm ? (
                <div className="space-y-3 border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                  {/* Staff-specific note */}
                  {(userRole === 'admin' || userRole === 'manager') && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-2 text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300">Staff Note:</p>
                      <p className="text-blue-600 dark:text-blue-400">
                        As a staff member, you must provide customer information to create an order.
                        If the customer already exists, they will be found by email.
                      </p>
                    </div>
                  )}

                  {/* Required fields with clear indicators */}
                  <div>
                    <Label htmlFor="customer-name" className="flex items-center">
                      Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="customer-name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Customer name"
                      className={`mt-1 ${!customerInfo.name && 'border-red-300'}`}
                      required
                    />
                    {!customerInfo.name && (userRole === 'admin' || userRole === 'manager') && (
                      <p className="text-xs text-red-500 mt-1">Customer name is required</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customer-email" className="flex items-center">
                      Email <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="customer@example.com"
                      className={`mt-1 ${!customerInfo.email && 'border-red-300'}`}
                      required
                    />
                    {!customerInfo.email && (userRole === 'admin' || userRole === 'manager') && (
                      <p className="text-xs text-red-500 mt-1">Customer email is required</p>
                    )}
                  </div>

                  {/* Optional fields */}
                  <div>
                    <Label htmlFor="customer-phone">Phone (optional)</Label>
                    <Input
                      id="customer-phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="Phone number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-address">Address (optional)</Label>
                    <Input
                      id="customer-address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      placeholder="Shipping address"
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Using your account information for this order.</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <Label htmlFor="payment-method">Payment Method</Label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-white dark:bg-gray-800"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <p className="text-sm text-gray-500">
              Once placed, your order will be submitted for approval.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}