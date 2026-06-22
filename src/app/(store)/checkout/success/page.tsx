"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Leaf,
  Download,
  CreditCard,
  Truck,
  FileText,
  IndianRupee,
} from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Suspense } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPaymentMethod(method: string | null): string {
  if (!method) return "Online Payment";
  if (method.toUpperCase() === "COD") return "Cash on Delivery";
  if (method.toUpperCase() === "RAZORPAY") return "Razorpay (Online)";
  return method;
}

function estimatedDelivery(): string {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);
  from.setDate(from.getDate() + 3);
  to.setDate(to.getDate() + 5);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${from.toLocaleDateString("en-IN", opts)} – ${to.toLocaleDateString("en-IN", opts)}`;
}

// ─── Content ──────────────────────────────────────────────────────────────────

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");
  const invoiceNumber = searchParams.get("invoiceNumber");
  const paymentMethod = searchParams.get("paymentMethod");
  const amount = searchParams.get("amount");

  const isRazorpay = paymentMethod?.toUpperCase() === "RAZORPAY";

  const details: Array<{ icon: React.ElementType; label: string; value: string | null }> = [
    { icon: Package, label: "Order Number", value: orderNumber },
    { icon: FileText, label: "Invoice Number", value: invoiceNumber },
    {
      icon: IndianRupee,
      label: "Amount Paid",
      value: amount ? `₹${parseFloat(amount).toFixed(2)}` : null,
    },
    { icon: isRazorpay ? CreditCard : Truck, label: "Payment Method", value: formatPaymentMethod(paymentMethod) },
  ].filter((d) => d.value !== null);

  return (
    <div className="min-h-screen pt-20 bg-cream-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="max-w-lg w-full text-center"
      >
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-14 h-14 text-green-500" />
        </motion.div>

        <div className="bg-white rounded-3xl shadow-card-hover p-8">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-primary-600" />
            <span className="text-primary-600 font-medium text-sm uppercase tracking-wide">
              Avvai Natural Foods
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold text-primary-800 mb-3">
            Order Confirmed!
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {isRazorpay
              ? "Payment received! Your invoice has been emailed to you."
              : "Your order has been received and will be processed shortly. An invoice email is on its way!"}
          </p>

          {/* Order details grid */}
          {details.length > 0 && (
            <div className="bg-cream-100 rounded-2xl p-4 mb-6 space-y-3">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                  <span className="font-semibold text-primary-800 text-sm">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Estimated delivery */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Truck className="w-4 h-4" />
            <span>Estimated delivery: {estimatedDelivery()}</span>
          </div>

          {/* Download invoice */}
          {orderId && (
            <div className="mb-5">
              <a
                href={`/api/invoices/by-order/${orderId}/download`}
                id="download-invoice-btn"
                className="inline-flex items-center justify-center w-full bg-amber-400 hover:bg-amber-500 text-primary-900 font-bold rounded-xl h-12 px-6 shadow-sm transition-all hover:scale-[1.01]"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Invoice PDF
              </a>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <LinkButton
              href="/shop"
              id="continue-shopping-btn"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold rounded-xl h-12"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </LinkButton>
            <LinkButton
              href="/"
              id="go-home-btn"
              variant="outline"
              className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 rounded-xl h-12"
            >
              Go Home
            </LinkButton>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Have questions?{" "}
          <a href="mailto:support@avvai.in" className="text-primary-600 hover:underline">
            support@avvai.in
          </a>
        </p>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-20 bg-cream-100 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center bg-white rounded-3xl shadow-card p-8">
            <p className="text-gray-600 animate-pulse">Loading order details...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
