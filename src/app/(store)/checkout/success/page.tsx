"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight, Leaf, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

import { Suspense } from "react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen pt-20 bg-cream-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="max-w-lg w-full text-center"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-14 h-14 text-green-500" />
        </motion.div>

        <div className="bg-white rounded-3xl shadow-card-hover p-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-primary-600" />
            <span className="text-primary-600 font-medium text-sm uppercase tracking-wide">Avvai Natural Foods</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-primary-800 mb-3">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for your order. We've received it and will process it shortly. 
            An invoice and confirmation email has been sent to you with details of your purchase.
          </p>

          {orderNumber && (
            <div className="bg-cream-100 rounded-2xl px-6 py-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-display text-2xl font-bold text-primary-700">{orderNumber}</p>
            </div>
          )}

          {orderId && (
            <div className="mb-6">
              <a
                href={`/api/invoices/by-order/${orderId}/download`}
                className="inline-flex items-center justify-center w-full bg-amber-400 hover:bg-amber-500 text-primary-900 font-bold rounded-xl h-12 px-6 shadow-sm transition-all hover:scale-[1.01]"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Invoice PDF
              </a>
            </div>
          )}

          <div className="flex items-center gap-3 justify-center text-sm text-muted-foreground mb-8">
            <Package className="w-4 h-4" />
            <span>Expected delivery: 3-5 business days</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LinkButton
              href="/shop"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold rounded-xl h-12"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </LinkButton>
            <LinkButton
              href="/"
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20 bg-cream-100 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center bg-white rounded-3xl shadow-card p-8">
          <p className="text-gray-600 animate-pulse">Loading order details...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
