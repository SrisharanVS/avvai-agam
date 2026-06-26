"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Leaf,
  Truck,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  CheckCircle2,
  Smartphone,
  Building2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import { calculateShipping } from "@/lib/utils";

// ─── Schema ──────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z
    .string()
    .min(10, "Enter a valid 10-digit phone number")
    .max(13),
  address: z.string().min(10, "Enter your full address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  landmark: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
type PaymentMethod = "RAZORPAY" | "COD";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Puducherry",
];

// ─── Razorpay Script Loader ───────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FormField = ({
  id, label, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <Input
      id={id}
      {...props}
      className={`h-11 rounded-xl border-cream-400 ${error ? "border-red-400" : ""}`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalPrice, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [failureMsg, setFailureMsg] = useState("");
  const [settings, setSettings] = useState<{ shippingFeeTN: number; shippingFeeOther: number; freeShippingThreshold: number } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((resData) => {
        if (resData.success) {
          setSettings(resData.data);
        }
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const selectedState = watch("state");

  const sub = subtotal();
  const shippingFeeTN = settings ? settings.shippingFeeTN : 60;
  const shippingFeeOther = settings ? settings.shippingFeeOther : 100;
  const freeShippingThreshold = settings ? settings.freeShippingThreshold : 500;

  const shipping = calculateShipping({
    items,
    subtotal: sub,
    state: selectedState,
    shippingFeeTN,
    shippingFeeOther,
    freeShippingThreshold,
  });

  const gatewayFee = paymentMethod === "RAZORPAY" ? Math.round((sub + shipping) * 0.0236 * 100) / 100 : 0;
  const total = sub + shipping + gatewayFee;





  // ── COD submission ──────────────────────────────────────────────────────────
  const handleCODSubmit = async (data: CheckoutFormData) => {
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
        body: JSON.stringify({ ...data, paymentMethod: "COD", items: orderItems }),
      });

      const result = await res.json();

      if (result.success) {
        clearCart();
        toast.success("Order placed successfully! 🌿");
        router.push(
          `/checkout/success?orderId=${result.data.id}&orderNumber=${result.data.orderNumber}&paymentMethod=COD&amount=${result.data.totalAmount}`
        );
      } else {
        toast.error(result.error || "Failed to place order");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Razorpay submission ─────────────────────────────────────────────────────
  const handleRazorpaySubmit = useCallback(
    async (data: CheckoutFormData) => {
      setLoading(true);
      setPaymentFailed(false);

      try {
        // 1. Load the Razorpay checkout.js script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error("Failed to load Razorpay. Check your network connection.");
          setLoading(false);
          return;
        }

        // 2. Create Razorpay Order on the server (server validates prices & stock)
        const cartItemsForServer = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

        const createRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItemsForServer,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            state: data.state,
          }),
        });

        const createResult = await createRes.json();

        if (!createResult.success) {
          toast.error(createResult.error || "Failed to initiate payment");
          setLoading(false);
          return;
        }

        const { razorpayOrderId, amount, currency, key } = createResult;

        // 3. Open Razorpay modal
        const rzp = new window.Razorpay({
          key,
          amount,
          currency,
          name: "Avvai Natural Foods",
          description: "Pure Food. Naturally Yours.",
          order_id: razorpayOrderId,
          prefill: {
            name: data.customerName,
            email: data.customerEmail,
            contact: data.customerPhone,
          },
          theme: { color: "#2D5016" },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast.info("Payment cancelled. You can retry anytime.");
            },
            escape: false,
          },
          handler: async (response: RazorpayPaymentResponse) => {
            // 4. Verify payment on the server — NEVER trust frontend success
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  // Customer & cart data for order creation
                  ...data,
                  items: cartItemsForServer,
                }),
              });

              const verifyResult = await verifyRes.json();

              if (verifyResult.success) {
                clearCart();
                toast.success("Payment successful! 🎉");
                router.push(
                  `/checkout/success?orderId=${verifyResult.orderId}&orderNumber=${verifyResult.orderNumber}&invoiceNumber=${verifyResult.invoiceNumber}&paymentMethod=RAZORPAY&amount=${verifyResult.totalAmount}`
                );
              } else {
                setPaymentFailed(true);
                setFailureMsg(verifyResult.error || "Payment verification failed. Please contact support.");
                setLoading(false);
              }
            } catch {
              setPaymentFailed(true);
              setFailureMsg("Network error during payment verification. Please contact support.");
              setLoading(false);
            }
          },
        });

        rzp.on("payment.failed", (response: RazorpayPaymentFailedResponse) => {
          setPaymentFailed(true);
          setFailureMsg(
            response.error?.description ||
            "Payment failed. Please try again with a different method."
          );
          setLoading(false);
        });

        rzp.open();
      } catch {
        toast.error("Something went wrong. Please try again.");
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, clearCart, router]
  );

  // ── Empty cart guard ────────────────────────────────────────────────────────
  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen pt-24 bg-cream-100 flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-3xl font-bold text-primary-800 mb-4">
          Your cart is empty!
        </h2>
        <LinkButton
          href="/shop"
          className="bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl"
        >
          Go to Shop
        </LinkButton>
      </div>
    );
  }

  // ── Main submit handler ─────────────────────────────────────────────────────
  const onSubmit = (data: CheckoutFormData) => {
    if (paymentMethod === "COD") {
      return handleCODSubmit(data);
    } else {
      return handleRazorpaySubmit(data);
    }
  };

  // ── Payment failure UI ──────────────────────────────────────────────────────
  if (paymentFailed) {
    return (
      <div className="min-h-screen pt-20 bg-cream-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-3xl shadow-card-hover p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-800 mb-3">
              Payment Failed
            </h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {failureMsg}
            </p>
            <div className="space-y-3">
              <Button
                id="retry-payment-btn"
                onClick={() => {
                  setPaymentFailed(false);
                  setFailureMsg("");
                  // Re-trigger razorpay with preserved form data
                  handleSubmit(onSubmit)();
                }}
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-cream-100 font-bold rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Payment
              </Button>
              <Button
                id="back-to-cart-btn"
                variant="outline"
                onClick={() => router.push("/cart")}
                className="w-full h-12 border-primary-300 text-primary-700 hover:bg-primary-50 rounded-xl"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Return to Cart
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main checkout form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 bg-cream-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl font-bold text-primary-800 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">

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
                  {errors.address && (
                    <p className="text-xs text-red-500">{errors.address.message}</p>
                  )}
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
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      State *
                    </Label>
                    <select
                      id="state"
                      {...register("state")}
                      className="w-full h-11 px-3 rounded-xl border border-cream-400 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-xs text-red-500">{errors.state.message}</p>
                    )}
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

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">
                Payment Method
              </h2>
              <div className="space-y-3">
                {/* Razorpay option */}
                <label
                  htmlFor="payment-razorpay"
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${paymentMethod === "RAZORPAY"
                    ? "border-primary-500 bg-primary-50"
                    : "border-cream-300 bg-gray-50 hover:border-primary-300"
                    }`}
                >
                  <input
                    id="payment-razorpay"
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={paymentMethod === "RAZORPAY"}
                    onChange={() => setPaymentMethod("RAZORPAY")}
                    className="mt-1 accent-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CreditCard className="w-5 h-5 text-primary-600 shrink-0" />
                      <p className="font-semibold text-primary-700">
                        Pay Online via Razorpay
                      </p>
                      {paymentMethod === "RAZORPAY" && (
                        <CheckCircle2 className="w-4 h-4 text-primary-600 ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Secure, instant payment — 100% safe
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: Smartphone, label: "UPI" },
                        { icon: CreditCard, label: "Cards" },
                        { icon: Building2, label: "Net Banking" },
                        { icon: Wallet, label: "Wallets" },
                      ].map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 text-[11px] bg-white border border-cream-300 text-gray-600 rounded-md px-2 py-0.5 font-medium"
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit */}
            <AnimatePresence mode="wait">
              <motion.div
                key={paymentMethod}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  type="submit"
                  id="place-order-btn"
                  disabled={loading}
                  className="w-full h-14 bg-primary-600 hover:bg-primary-700 text-cream-100 font-bold text-base rounded-2xl shadow-organic transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-cream-100/40 border-t-cream-100 rounded-full animate-spin" />
                      {paymentMethod === "RAZORPAY" ? "Opening payment..." : "Placing order..."}
                    </span>
                  ) : paymentMethod === "RAZORPAY" ? (
                    `Pay ₹${total.toFixed(2)} via Razorpay`
                  ) : (
                    `Place Order — ₹${total.toFixed(2)}`
                  )}
                </Button>
              </motion.div>
            </AnimatePresence>

            {paymentMethod === "RAZORPAY" && (
              <p className="text-center text-xs text-muted-foreground -mt-2">
                🔒 Secured by Razorpay. Your card details are never stored on our servers.
              </p>
            )}
          </form>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-primary-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.name}
                      </p>
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
                {paymentMethod === "RAZORPAY" && (
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Platform Fee (2.36%)</span>
                    <span>₹{gatewayFee.toFixed(2)}</span>
                  </div>
                )}
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
