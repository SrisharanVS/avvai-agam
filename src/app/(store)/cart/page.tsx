"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, Leaf, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Separator } from "@/components/ui/separator";
import { calculateShipping } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
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

  const sub = subtotal();
  const shippingFeeTN = settings ? settings.shippingFeeTN : 60;
  const shippingFeeOther = settings ? settings.shippingFeeOther : 100;
  const freeShippingThreshold = settings ? settings.freeShippingThreshold : 500;

  const shipping = calculateShipping({
    items,
    subtotal: sub,
    shippingFeeTN,
    shippingFeeOther,
    freeShippingThreshold,
  });
  const total = sub + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-cream-100 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-cream-200 rounded-full flex items-center justify-center mb-6"
        >
          <ShoppingBag className="w-12 h-12 text-primary-300" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold text-primary-800 mb-3">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Add some organic goodness to your cart!
        </p>
        <LinkButton
          href="/shop"
          className="bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold px-8 rounded-2xl h-12"
        >
          Start Shopping
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-cream-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <h1 className="font-display text-4xl font-bold text-primary-800 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-4 flex gap-4 shadow-card"
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-8 h-8 text-primary-200" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.slug}`}>
                    <h3 className="font-semibold text-gray-800 hover:text-primary-700 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  {item.weight && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.weight}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-cream-400 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 rounded-full border border-cream-400 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-bold text-primary-700">
                      ₹{((item.discountedPrice ?? item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-400 hover:text-red-600 transition-colors self-start"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-primary-800 mb-5">Order Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{sub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  Calculated for Tamil Nadu. Outside TN flat rate ₹{shippingFeeOther}/kg applies.
                </p>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground bg-amber-50 px-3 py-2 rounded-lg">
                    💡 Add ₹{(freeShippingThreshold - sub).toFixed(0)} more for free shipping!
                  </p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-xl text-primary-800 mb-6">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <LinkButton
                href="/checkout"
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold rounded-xl"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </LinkButton>
              <LinkButton
                href="/shop"
                variant="ghost"
                className="w-full mt-3 text-primary-600 hover:text-primary-800"
              >
                Continue Shopping
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
