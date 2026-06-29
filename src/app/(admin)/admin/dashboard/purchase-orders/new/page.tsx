"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Package, CalendarDays,
  Building2, ChevronDown, Check, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SupplierType } from "@/types";
import { ProductCombobox } from "@/components/admin/ProductCombobox";

interface LineItem {
  productId: string | null;
  variantId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  costPrice: number;
  taxRate: number;
}

function NewPOForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledSupplierId = searchParams.get("supplierId") || "";

  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [supplierId, setSupplierId] = useState(prefilledSupplierId);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productId: null, variantId: null, productName: "", quantity: 1, unit: "units", costPrice: 0, taxRate: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveType, setSaveType] = useState<"draft" | "submit">("draft");

  useEffect(() => {
    fetch("/api/suppliers?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSuppliers(data.data);
      });
  }, []);

  const updateItem = useCallback((index: number, field: keyof LineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Handle product autocomplete selection
  const handleSelectProduct = (index: number, product: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        variantId: product.variantId || null,
        productName: product.name,
        unit: product.unit || "units",
        costPrice: Number(product.costPrice || 0),
        taxRate: Number(product.defaultTaxRate || 0)
      };
      return updated;
    });
  };

  // Handle inline typed product name
  const handleCreateProductInline = (index: number, name: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: null,
        variantId: null,
        productName: name,
        unit: "units",
        costPrice: 0,
        taxRate: 0
      };
      return updated;
    });
  };

  const addItem = () => {
    setLineItems((prev) => [
      ...prev,
      { productId: null, variantId: null, productName: "", quantity: 1, unit: "units", costPrice: 0, taxRate: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Live calculations
  const lineCalcs = lineItems.map((item) => {
    const subtotal = item.quantity * item.costPrice;
    const tax = subtotal * (item.taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  });
  const grandSubtotal = lineCalcs.reduce((s, c) => s + c.subtotal, 0);
  const grandTax = lineCalcs.reduce((s, c) => s + c.tax, 0);
  const grandTotal = grandSubtotal + grandTax;

  const handleSave = async (type: "draft" | "submit") => {
    if (!supplierId) { toast.error("Please select a supplier"); return; }
    if (lineItems.every((i) => !i.productName.trim())) { toast.error("Add at least one item"); return; }

    setSaveType(type);
    setSaving(true);
    try {
      const validItems = lineItems.filter((i) => i.productName.trim());
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          notes: notes || undefined,
          items: validItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            costPrice: item.costPrice,
            taxRate: item.taxRate
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const poId = data.data.id;

      if (type === "submit") {
        const submitRes = await fetch(`/api/purchase-orders/${poId}/submit`, { method: "POST" });
        const submitData = await submitRes.json();
        if (!submitData.success) throw new Error(submitData.error);
        toast.success("Purchase Order submitted successfully");
      } else {
        toast.success("Draft saved successfully");
      }

      router.push(`/admin/dashboard/purchase-orders/${poId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save purchase order");
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
        Back to Purchase Orders
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">New Purchase Order</h1>
          <p className="text-muted-foreground">Create a purchase order with smart product selection and auto-creation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* PO Info */}
          <Card className="rounded-2xl border-0 shadow-card">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-700">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Building2 className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
                  Supplier *
                </label>
                <div className="relative">
                  <select
                    id="po-supplier-select"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
                    required
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <CalendarDays className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
                  Expected Delivery Date
                </label>
                <input
                  id="po-delivery-date"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  id="po-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="rounded-2xl border-0 shadow-card !overflow-visible">
            <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Products</CardTitle>
              <button
                id="po-add-item-btn"
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[3.5fr_1fr_1fr_1.5fr_1fr_0.5fr] gap-3 px-5 py-3 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <span>Product Selection</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Cost Price (₹)</span>
                <span>Tax (%)</span>
                <span></span>
              </div>

              <div className="divide-y divide-gray-50">
                {lineItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 md:p-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[3.5fr_1fr_1fr_1.5fr_1fr_0.5fr] gap-3 items-start">
                      {/* Product selector using Combobox */}
                      <div>
                        <label className="md:hidden block text-xs text-gray-500 mb-1">Product</label>
                        <ProductCombobox
                          value={item.productName}
                          onSelect={(prod) => handleSelectProduct(index, prod)}
                          onCreateNew={(name) => handleCreateProductInline(index, name)}
                        />
                        {!item.productId && item.productName.trim().length > 0 && (
                          <span className="text-[9px] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit mt-1">
                            <Sparkles className="w-2.5 h-2.5" /> Creates new master product with 0 stock
                          </span>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="md:hidden block text-xs text-gray-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-center"
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="md:hidden block text-xs text-gray-500 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="kg, L, pcs..."
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                        />
                      </div>

                      {/* Cost Price */}
                      <div>
                        <label className="md:hidden block text-xs text-gray-500 mb-1">Cost Price</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) => updateItem(index, "costPrice", Number(e.target.value))}
                            className="w-full pl-6 pr-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                          />
                        </div>
                      </div>

                      {/* Tax Rate */}
                      <div>
                        <label className="md:hidden block text-xs text-gray-500 mb-1">Tax %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={item.taxRate}
                            onChange={(e) => updateItem(index, "taxRate", Number(e.target.value))}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 pr-7"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="flex justify-end md:justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={lineItems.length === 1}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Line total preview */}
                    <div className="mt-2 flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        Subtotal: ₹{lineCalcs[index].subtotal.toFixed(2)}
                        {item.taxRate > 0 && ` + ₹${lineCalcs[index].tax.toFixed(2)} tax`}
                        {" = "}
                        <span className="font-semibold text-gray-700">₹{lineCalcs[index].total.toFixed(2)}</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-card sticky top-6">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-700">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{grandSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">₹{grandTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-800">Grand Total</span>
                <span className="font-bold text-primary-700 text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="pt-4 space-y-2">
                <button
                  id="save-draft-btn"
                  type="button"
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 bg-white"
                >
                  {saving && saveType === "draft" ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : null}
                  Save as Draft
                </button>
                <button
                  id="submit-po-btn"
                  type="button"
                  onClick={() => handleSave("submit")}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && saveType === "submit" ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Submit Purchase Order
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <Suspense>
      <NewPOForm />
    </Suspense>
  );
}
