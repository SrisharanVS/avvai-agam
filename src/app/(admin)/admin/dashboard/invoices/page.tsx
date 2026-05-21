"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Send, Download, Eye, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { InvoiceSummary, InvoiceDetail } from "@/types";

interface InvoiceLineItem {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

const emptyItem = (): InvoiceLineItem => ({
  productName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0,
});

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("create");

  // Invoice builder state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyItem()]);
  const [creating, setCreating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    const res = await fetch("/api/invoices?type=MANUAL");
    const data = await res.json();
    if (data.success) setInvoices(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i));
  const updateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Live totals calculation
  const calcItemTotal = (item: InvoiceLineItem) => {
    const base = item.quantity * item.unitPrice;
    const tax = base * (item.taxRate / 100);
    return { base, tax, total: base + tax };
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTax = items.reduce((s, i) => s + calcItemTotal(i).tax, 0);
  const grandTotal = subtotal + totalTax + shippingAmount - discountAmount;

  const handleCreate = async () => {
    if (!customerName || !customerEmail) {
      toast.error("Customer name and email are required");
      return;
    }
    if (items.some((i) => !i.productName || i.quantity <= 0 || i.unitPrice <= 0)) {
      toast.error("All line items must have a name, quantity, and price");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName, customerEmail, customerPhone, billingAddress,
          paymentMethod, discountAmount, shippingAmount, notes, items,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Invoice ${data.data.invoiceNumber} created!`);
        // Reset form
        setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
        setBillingAddress(""); setNotes(""); setItems([emptyItem()]);
        setDiscountAmount(0); setShippingAmount(0);
        fetchInvoices();
        setTab("history");
      } else {
        toast.error(data.error || "Failed to create invoice");
      }
    } catch {
      toast.error("Error creating invoice");
    } finally {
      setCreating(false);
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    setSendingEmail(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send-email`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice emailed successfully!");
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch {
      toast.error("Error sending email");
    } finally {
      setSendingEmail(null);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-600",
      SENT: "bg-blue-100 text-blue-700",
      PAID: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-600",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-800">Invoice Management</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage invoices for offline, wholesale, and in-store orders
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="create" className="rounded-lg gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2">
            <FileText className="w-4 h-4" /> Invoice History ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* ──── Invoice Builder ──────────────────────────────────── */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Builder Form */}
            <div className="xl:col-span-2 space-y-5">
              {/* Customer Info */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-600 text-cream-100 rounded-full text-xs flex items-center justify-center font-bold">1</span>
                  Customer Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Customer Name *</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Method</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      {["COD", "Cash", "UPI", "Bank Transfer", "Cheque", "Card"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Billing Address</Label>
                    <Textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Customer billing address..." rows={2} className="rounded-xl resize-none" />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-600 text-cream-100 rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Products / Services
                  </h2>
                  <Button onClick={addItem} size="sm" variant="outline" className="gap-1 rounded-lg text-xs border-primary-300 text-primary-700">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-center">Tax %</div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1" />
                  </div>

                  {items.map((item, i) => {
                    const { total } = calcItemTotal(item);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-xl p-3"
                      >
                        <div className="col-span-4">
                          <Input
                            value={item.productName}
                            onChange={(e) => updateItem(i, "productName", e.target.value)}
                            placeholder="Product/Service name"
                            className="h-9 text-sm rounded-lg border-gray-200"
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            placeholder="Description (optional)"
                            className="h-8 text-xs rounded-lg border-gray-200 mt-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-9 text-sm text-center rounded-lg border-gray-200"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-9 text-sm pl-5 text-right rounded-lg border-gray-200"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="28"
                              value={item.taxRate}
                              onChange={(e) => updateItem(i, "taxRate", parseFloat(e.target.value) || 0)}
                              className="h-9 text-sm text-center rounded-lg border-gray-200 pr-5"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="col-span-1 flex items-center justify-end pt-1">
                          <span className="text-sm font-bold text-primary-700">₹{total.toFixed(0)}</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Charges + Notes */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-600 text-cream-100 rounded-full text-xs flex items-center justify-center font-bold">3</span>
                  Adjustments & Notes
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label>Discount Amount (₹)</Label>
                    <Input type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shipping Charges (₹)</Label>
                    <Input type="number" min="0" value={shippingAmount} onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)} className="rounded-xl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Notes / Terms</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business! Goods once sold are not returnable..." rows={3} className="rounded-xl resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview / Summary */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-card p-6 sticky top-8">
                <h2 className="font-display text-lg font-bold text-primary-800 mb-5">Invoice Preview</h2>

                {/* Header */}
                <div className="bg-gradient-to-br from-primary-600 to-olive-600 rounded-xl p-4 text-center mb-4">
                  <p className="text-cream-100 font-display text-lg font-bold">🌿 Avvai</p>
                  <p className="text-primary-200 text-xs">Natural Foods</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {customerName && <div><span className="text-muted-foreground text-xs">Bill to:</span><p className="font-medium">{customerName}</p></div>}
                  {customerEmail && <p className="text-xs text-muted-foreground">{customerEmail}</p>}
                  {customerPhone && <p className="text-xs text-muted-foreground">{customerPhone}</p>}
                </div>

                {items.filter((i) => i.productName).length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2 text-sm">
                      {items.filter((i) => i.productName).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-700 text-xs">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} × ₹{item.unitPrice}</p>
                          </div>
                          <span className="text-xs font-bold text-primary-700">
                            ₹{calcItemTotal(item).total.toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {totalTax > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax</span><span>₹{totalTax.toFixed(2)}</span>
                        </div>
                      )}
                      {shippingAmount > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span><span>₹{shippingAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span><span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between font-bold text-xl text-primary-800">
                      <span>Total</span>
                      <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {notes && (
                  <div className="mt-4 p-3 bg-cream-100 rounded-xl">
                    <p className="text-xs text-muted-foreground">{notes}</p>
                  </div>
                )}

                <Button
                  id="create-invoice-btn"
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full mt-6 h-12 bg-primary-600 hover:bg-primary-700 text-cream-100 font-bold rounded-xl gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {creating ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ──── Invoice History ──────────────────────────────────── */}
        <TabsContent value="history">
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No manual invoices yet. Create your first one!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">Invoice #</th>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-6 py-3 text-left">Amount</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-primary-700">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800">{inv.customerName}</p>
                          <p className="text-xs text-muted-foreground">{inv.customerEmail}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm">₹{inv.totalAmount.toFixed(0)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/api/invoices/${inv.id}/download`}
                              className="inline-flex items-center justify-center h-8 rounded-lg px-2.5 text-xs font-semibold text-gray-600 hover:text-primary-700 hover:bg-gray-100 transition-colors gap-1"
                              title="Download Invoice PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendEmail(inv.id)}
                              disabled={sendingEmail === inv.id}
                              className="text-primary-600 hover:text-primary-800 gap-1 text-xs"
                              title="Send invoice by email"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {sendingEmail === inv.id ? "Sending..." : "Email"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
