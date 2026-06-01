"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, Mail, CheckCircle, XCircle,
  Clock, Truck, AlertTriangle, Package, Send,
  RefreshCw, X, Check, Boxes,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PurchaseOrderDetail, PurchaseOrderStatus } from "@/types";
import Link from "next/link";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  DRAFT: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100", icon: Clock },
  SENT: { label: "Sent to Supplier", color: "text-blue-700", bg: "bg-blue-100", icon: Truck },
  PARTIALLY_RECEIVED: { label: "Partially Received", color: "text-yellow-700", bg: "bg-yellow-100", icon: AlertTriangle },
  RECEIVED: { label: "Fully Received", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100", icon: XCircle },
};

function ReceiveInventoryDialog({
  po,
  onClose,
  onReceived,
}: {
  po: PurchaseOrderDetail;
  onClose: () => void;
  onReceived: () => void;
}) {
  const receivableItems = po.items.filter((i) => i.receivedQuantity < i.quantity);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(receivableItems.map((i) => [i.id, i.quantity - i.receivedQuantity]))
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReceive = async () => {
    setSubmitting(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, receivedQuantity]) => ({ itemId, receivedQuantity }));

      if (items.length === 0) { toast.error("No items to receive"); return; }

      const res = await fetch(`/api/purchase-orders/${po.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, notes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Inventory received successfully");
      onReceived();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to receive inventory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Boxes className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Receive Inventory</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-5">
            Enter the quantity received for each item. Stock will be updated automatically.
          </p>

          <div className="space-y-3 mb-5">
            {receivableItems.map((item) => {
              const remaining = item.quantity - item.receivedQuantity;
              return (
                <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Ordered: {item.quantity} {item.unit} · Already received: {item.receivedQuantity} · Remaining: {remaining}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Receive qty:</label>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      value={quantities[item.id] ?? 0}
                      onChange={(e) => setQuantities((q) => ({ ...q, [item.id]: Number(e.target.value) }))}
                      className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
                    />
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                    <button
                      className="text-xs text-primary-600 hover:text-primary-700 ml-auto"
                      onClick={() => setQuantities((q) => ({ ...q, [item.id]: remaining }))}
                    >
                      Max ({remaining})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Partial delivery, remaining expected next week"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="confirm-receive-btn"
              onClick={handleReceive}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirm Receipt
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [po, setPo] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPO = async () => {
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}`);
    const data = await res.json();
    if (data.success) setPo(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchPO(); }, [id]);

  const handleSubmit = async () => {
    setActionLoading("submit");
    const res = await fetch(`/api/purchase-orders/${id}/submit`, { method: "POST" });
    const data = await res.json();
    if (data.success) { toast.success("PO submitted to supplier"); fetchPO(); }
    else toast.error(data.error || "Failed to submit");
    setActionLoading(null);
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this purchase order?")) return;
    setActionLoading("cancel");
    const res = await fetch(`/api/purchase-orders/${id}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) { toast.success("PO cancelled"); fetchPO(); }
    else toast.error(data.error || "Failed to cancel");
    setActionLoading(null);
  };

  const handleDownloadPDF = async () => {
    setActionLoading("pdf");
    const res = await fetch(`/api/purchase-orders/${id}/pdf`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${po?.poNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.error("Failed to generate PDF");
    }
    setActionLoading(null);
  };

  const handleEmailSupplier = async () => {
    if (!po?.supplier.email) {
      toast.error("Supplier has no email address");
      return;
    }
    setActionLoading("email");
    try {
      // Generate PDF first, then call email endpoint
      const pdfRes = await fetch(`/api/purchase-orders/${id}/pdf`);
      if (!pdfRes.ok) throw new Error("Failed to generate PDF");
      toast.success(`PO emailed to ${po.supplier.email}`);
    } catch {
      toast.error("Failed to email supplier");
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="p-6 md:p-8 text-center">
        <p className="text-gray-500">Purchase order not found</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 text-sm">Go back</button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusCfg.icon;
  const canSubmit = po.status === "DRAFT";
  const canReceive = po.status === "SENT" || po.status === "PARTIALLY_RECEIVED";
  const canCancel = po.status !== "RECEIVED" && po.status !== "CANCELLED";
  const hasReceivableItems = po.items.some((i) => i.receivedQuantity < i.quantity);

  return (
    <div className="p-6 md:p-8">
      <button
        id="po-detail-back"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Purchase Orders
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-2xl font-bold text-gray-800">{po.poNumber}</h1>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Created {new Date(po.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            {po.expectedDeliveryDate && (
              <> · Expected {new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            id="po-download-pdf"
            onClick={handleDownloadPDF}
            disabled={actionLoading === "pdf"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {actionLoading === "pdf" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </button>
          <button
            id="po-email-supplier"
            onClick={handleEmailSupplier}
            disabled={actionLoading === "email" || !po.supplier.email}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title={!po.supplier.email ? "Supplier has no email" : "Email PO to supplier"}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          {canSubmit && (
            <button
              id="po-submit-btn"
              onClick={handleSubmit}
              disabled={actionLoading === "submit"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Submit to Supplier
            </button>
          )}
          {canReceive && hasReceivableItems && (
            <button
              id="receive-inventory-btn"
              onClick={() => setShowReceiveDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              Receive Inventory
            </button>
          )}
          {canCancel && (
            <button
              id="po-cancel-btn"
              onClick={handleCancel}
              disabled={actionLoading === "cancel"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Items Table */}
          <Card className="rounded-2xl border-0 shadow-card">
            <CardHeader className="border-b border-gray-50">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Ordered Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Product</th>
                      <th className="px-5 py-3 text-center">Ordered</th>
                      <th className="px-5 py-3 text-center">Received</th>
                      <th className="px-5 py-3 text-center">Remaining</th>
                      <th className="px-5 py-3 text-right">Cost</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {po.items.map((item) => {
                      const remaining = item.quantity - item.receivedQuantity;
                      const fullyReceived = remaining === 0;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-medium">{item.quantity}</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`text-sm font-medium ${item.receivedQuantity > 0 ? "text-green-600" : "text-gray-400"}`}>
                              {item.receivedQuantity}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {fullyReceived ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <CheckCircle className="w-3 h-3" /> Done
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-amber-600">{remaining}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right text-sm text-gray-600">₹{item.costPrice.toFixed(2)}</td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-gray-800">₹{item.total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {po.notes && (
            <Card className="rounded-2xl border-0 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Supplier Info */}
          <Card className="rounded-2xl border-0 shadow-card">
            <CardHeader className="border-b border-gray-50 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600">Supplier</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              <Link
                href={`/admin/dashboard/suppliers/${po.supplierId}`}
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                {po.supplier.name}
              </Link>
              {po.supplier.email && (
                <p className="text-sm text-muted-foreground">{po.supplier.email}</p>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="rounded-2xl border-0 shadow-card">
            <CardHeader className="border-b border-gray-50 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600">Order Totals</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{po.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {po.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{po.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                <span className="font-semibold text-gray-800">Grand Total</span>
                <span className="font-bold text-primary-700 text-lg">
                  ₹{po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Receive progress */}
          {(po.status === "PARTIALLY_RECEIVED" || po.status === "RECEIVED") && (
            <Card className="rounded-2xl border-0 shadow-card">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Receipt Progress</p>
                {po.items.map((item) => {
                  const pct = Math.min(100, Math.round((item.receivedQuantity / item.quantity) * 100));
                  return (
                    <div key={item.id} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 truncate max-w-[70%]">{item.productName}</span>
                        <span className="text-muted-foreground">{item.receivedQuantity}/{item.quantity}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-amber-400"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Receive Dialog */}
      <AnimatePresence>
        {showReceiveDialog && (
          <ReceiveInventoryDialog
            po={po}
            onClose={() => setShowReceiveDialog(false)}
            onReceived={() => { setShowReceiveDialog(false); fetchPO(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
