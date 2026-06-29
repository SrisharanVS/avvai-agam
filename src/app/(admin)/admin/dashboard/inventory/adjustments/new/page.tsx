"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ProductListItem } from "@/types";

const MOVEMENT_TYPES = [
  { value: "ADJUSTMENT", label: "Adjustment (add or remove stock)" },
  { value: "RETURN", label: "Return (stock returned from customer)" },
  { value: "DAMAGED", label: "Damaged (stock written off)" },
];

export default function ManualAdjustmentPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [movementType, setMovementType] = useState("ADJUSTMENT");
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === variantId);

  useEffect(() => {
    fetch("/api/products?limit=200").then((r) => r.json()).then((d) => {
      if (d.success) setProducts(d.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { toast.error("Select a product"); return; }
    if (!variantId) { toast.error("Select a variant"); return; }
    if (quantity === 0) { toast.error("Quantity cannot be zero"); return; }

    setSaving(true);
    try {
      // For DAMAGED, always negative quantity
      const effectiveQty = movementType === "DAMAGED" ? -Math.abs(quantity) : quantity;

      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, movementType, quantity: effectiveQty, notes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Stock adjustment saved");
      router.push("/admin/dashboard/inventory");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save adjustment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inventory
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Manual Stock Adjustment</h1>
          <p className="text-muted-foreground">Admin override for stock corrections</p>
        </div>
      </div>

      <div className="max-w-lg">
        <Card className="rounded-2xl border-0 shadow-card">
          <CardHeader className="border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-700">Adjustment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product *</label>
                <div className="relative">
                  <select
                    id="adjustment-product"
                    value={productId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductId(val);
                      const p = products.find((prod) => prod.id === val);
                      if (p && p.variants && p.variants.length > 0) {
                        const def = p.variants.find((v) => v.isDefault) || p.variants[0];
                        setVariantId(def.id);
                      } else {
                        setVariantId("");
                      }
                    }}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
                  >
                    <option value="">Select a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (Total stock: {p.totalStock})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Variant */}
              {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Variant *</label>
                  <div className="relative">
                    <select
                      id="adjustment-variant"
                      value={variantId}
                      onChange={(e) => setVariantId(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
                    >
                      {selectedProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.variantName} (Current Stock: {v.stock})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {selectedVariant && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground mt-1.5 bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      Current stock: <span className="font-semibold text-gray-700">{selectedVariant.stock}</span> units
                    </motion.p>
                  )}
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adjustment Type *</label>
                <div className="relative">
                  <select
                    id="adjustment-type"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
                  >
                    {MOVEMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity *
                  {movementType !== "DAMAGED" && (
                    <span className="text-xs text-muted-foreground ml-1">(positive to add, negative to remove)</span>
                  )}
                </label>
                <input
                  id="adjustment-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                {selectedVariant && quantity !== 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs mt-1.5 text-muted-foreground"
                  >
                    New stock will be:{" "}
                    <span className="font-semibold text-gray-700">
                      {Math.max(0, selectedVariant.stock + (movementType === "DAMAGED" ? -Math.abs(quantity) : quantity))}
                    </span>
                  </motion.p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason / Notes *</label>
                <textarea
                  id="adjustment-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="Explain the reason for this adjustment..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="save-adjustment-btn"
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Adjustment
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
