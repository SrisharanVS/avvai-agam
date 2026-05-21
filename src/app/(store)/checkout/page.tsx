"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Image from "next/image";
import { Leaf, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import Link from "next/link";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Enter a valid 10-digit phone number").max(13),
  address: z.string().min(10, "Enter your full address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  landmark: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD">("COD");

  const sub = subtotal();
  const total = totalPrice();
  const shipping = sub >= 500 ? 0 : 60;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-cream-100 flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-3xl font-bold text-primary-800 mb-4">Your cart is empty!</h2>
        <LinkButton href="/shop" className="bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl">
          Go to Shop
        </LinkButton>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.discountedPrice ?? item.price,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          paymentMethod,
          items: orderItems,
        }),
      });

      const result = await res.json();

      if (result.success) {
        clearCart();
        toast.success("Order placed successfully! 🌿");
        router.push(`/checkout/success?orderId=${result.data.id}&orderNumber=${result.data.orderNumber}`);
      } else {
        toast.error(result.error || "Failed to place order");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({
    id, label, error, ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
      <Input id={id} {...props} className={`h-11 rounded-xl border-cream-400 ${error ? "border-red-400" : ""}`} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen pt-20 bg-cream-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl font-bold text-primary-800 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-2 space-y-6"
          >
            {/* Contact */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="customerName"
                  label="Full Name *"
                  placeholder="Your full name"
                  error={errors.customerName?.message}
                  {...register("customerName")}
                />
                <FormField
                  id="customerPhone"
                  label="Phone Number *"
                  placeholder="+91 98765 43210"
                  error={errors.customerPhone?.message}
                  {...register("customerPhone")}
                />
                <div className="sm:col-span-2">
                  <FormField
                    id="customerEmail"
                    label="Email Address *"
                    type="email"
                    placeholder="you@example.com"
                    error={errors.customerEmail?.message}
                    {...register("customerEmail")}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">
                Delivery Address
              </h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address *
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="House No, Street, Area..."
                    className={`rounded-xl border-cream-400 resize-none ${errors.address ? "border-red-400" : ""}`}
                    rows={2}
                    {...register("address")}
                  />
                  {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="city"
                    label="City *"
                    placeholder="Chennai"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">State *</Label>
                    <select
                      id="state"
                      {...register("state")}
                      className="w-full h-11 px-3 rounded-xl border border-cream-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                  </div>
                  <FormField
                    id="pincode"
                    label="Pincode *"
                    placeholder="600001"
                    error={errors.pincode?.message}
                    {...register("pincode")}
                  />
                  <FormField
                    id="landmark"
                    label="Landmark (Optional)"
                    placeholder="Near temple, mall..."
                    {...register("landmark")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deliveryNotes" className="text-sm font-medium text-gray-700">
                    Delivery Notes (Optional)
                  </Label>
                  <Textarea
                    id="deliveryNotes"
                    placeholder="Any special delivery instructions..."
                    className="rounded-xl border-cream-400 resize-none"
                    rows={2}
                    {...register("deliveryNotes")}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-primary-400 bg-primary-50 rounded-xl cursor-pointer">
                  <input type="radio" checked readOnly className="accent-primary-600" />
                  <Truck className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-semibold text-primary-700">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-cream-300 bg-gray-50 rounded-xl opacity-50 cursor-not-allowed">
                  <input type="radio" disabled className="accent-primary-600" />
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-500">Online Payment</p>
                    <p className="text-xs text-muted-foreground">Coming soon — Razorpay / UPI</p>
                  </div>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              id="place-order-btn"
              disabled={loading}
              className="w-full h-14 bg-primary-600 hover:bg-primary-700 text-cream-100 font-bold text-base rounded-2xl shadow-organic"
            >
              {loading ? "Placing Order..." : `Place Order — ₹${total.toFixed(2)}`}
            </Button>
          </form>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-primary-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-primary-700 shrink-0">
                      ₹{((item.discountedPrice ?? item.price) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{sub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between font-bold text-xl text-primary-800">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
