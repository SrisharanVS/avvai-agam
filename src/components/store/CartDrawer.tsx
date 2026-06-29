"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, Plus, Minus, Leaf, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Separator } from "@/components/ui/separator";
import { calculateShipping, ceilShippingWeight } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalShippingWeight } =
    useCartStore();
  const [settings, setSettings] = useState<{
    shippingFeeTN: number;
    shippingFeeOther: number;
    freeShippingThreshold: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((resData) => {
          if (resData.success) setSettings(resData.data);
        })
        .catch((err) => console.error("Failed to load settings:", err));
    }
  }, [isOpen]);

  const sub = subtotal();
  const shippingFeeTN = settings ? settings.shippingFeeTN : 60;
  const shippingFeeOther = settings ? settings.shippingFeeOther : 100;
  const freeShippingThreshold = settings ? settings.freeShippingThreshold : 500;

  const totalWeightKg = totalShippingWeight();
  const billableWeightKg = ceilShippingWeight(totalWeightKg);

  const shipping = calculateShipping({
    items,
    subtotal: sub,
    shippingFeeTN,
    shippingFeeOther,
    freeShippingThreshold,
  });
  const total = sub + shipping;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300 bg-cream-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5 text-cream-100" />
                </div>
                <h2 className="text-lg font-display font-bold text-primary-800">Your Cart</h2>
                {items.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-300 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-20 h-20 bg-cream-200 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-primary-300" />
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground">Add some organic goodness!</p>
                  </div>
                  <LinkButton
                    href="/shop"
                    onClick={closeCart}
                    className="bg-primary-600 hover:bg-primary-700 text-cream-100"
                  >
                    Browse Products
                  </LinkButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-3 p-3 bg-cream-100 rounded-xl"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-cream-200">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-primary-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-medium text-sm text-gray-800 hover:text-primary-700 line-clamp-1 leading-tight"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-primary-600 font-medium mt-0.5">
                          {item.variantName}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          {/* Qty controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-white border border-cream-400 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="w-6 h-6 rounded-full bg-white border border-cream-400 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-primary-700">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-red-400 hover:text-red-600 transition-colors self-start mt-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-cream-300 px-6 py-4 bg-white space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{sub.toFixed(2)}</span>
                  </div>
                  {/* Weight breakdown */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Items weight
                    </span>
                    <span>{totalWeightKg.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Shipping charged as</span>
                    <span>{billableWeightKg} kg</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping (est.)</span>
                    <span className={shipping === 0 ? "text-primary-600 font-medium" : ""}>
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>
                  {shipping > 0 && sub < freeShippingThreshold && (
                    <p className="text-xs text-muted-foreground bg-amber-50 px-3 py-1.5 rounded-lg">
                      💡 Add ₹{(freeShippingThreshold - sub).toFixed(0)} more for free shipping!
                    </p>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg text-primary-800">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <LinkButton
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold h-12"
                  >
                    Proceed to Checkout
                  </LinkButton>
                  <LinkButton
                    href="/cart"
                    variant="outline"
                    onClick={closeCart}
                    className="w-full border-primary-300 text-primary-700 hover:bg-primary-50"
                  >
                    View Full Cart
                  </LinkButton>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
