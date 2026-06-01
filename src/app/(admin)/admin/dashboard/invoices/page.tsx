"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Send, Download, FileText, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { InvoiceSummary } from "@/types";
import { CustomerCombobox } from "@/components/admin/CustomerCombobox";
import { ProductCombobox } from "@/components/admin/ProductCombobox";
import { Checkbox } from "@/components/ui/checkbox";

interface InvoiceLineItem {
  productId: string | null;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  originalPrice?: number;
  originalTaxRate?: number;
}

const emptyItem = (): InvoiceLineItem => ({
  productId: null, productName: "", description: "", quantity: 1, unitPrice: 0, taxRate: 0,
});

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("create");

  // Customer resolution & details state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  
  // For comparing changes
  const [originalCustomer, setOriginalCustomer] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    gstNumber: string;
  } | null>(null);
  const [updateCustomerProfile, setUpdateCustomerProfile] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyItem()]);
  const [creating, setCreating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices?type=MANUAL");
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } catch {
      toast.error("Failed to load invoice history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchInvoices(); 
  }, []);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i));
  const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // When a Customer is selected
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerEmail(customer.email || "");
    setCustomerPhone(customer.phone || "");
    setBillingAddress(customer.address || "");
    setGstNumber(customer.gstNumber || "");
    setOriginalCustomer({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      gstNumber: customer.gstNumber || "",
    });
    setUpdateCustomerProfile(true);
  };

  // Inline customer typed
  const handleCreateCustomerInline = (name: string) => {
    setSelectedCustomerId(null);
    setCustomerName(name);
    setCustomerEmail("");
    setCustomerPhone("");
    setBillingAddress("");
    setGstNumber("");
    setOriginalCustomer(null);
  };

  // When a product is selected in a row
  const handleSelectProduct = (index: number, product: any) => {
    updateItem(index, "productId", product.id);
    updateItem(index, "productName", product.name);
    updateItem(index, "unitPrice", Number(product.price));
    updateItem(index, "taxRate", Number(product.defaultTaxRate || 0));
    updateItem(index, "originalPrice", Number(product.price));
    updateItem(index, "originalTaxRate", Number(product.defaultTaxRate || 0));
    if (product.description) {
      updateItem(index, "description", product.description);
    }
  };

  const handleCreateProductInline = (index: number, name: string) => {
    updateItem(index, "productId", null);
    updateItem(index, "productName", name);
    updateItem(index, "unitPrice", 0);
    updateItem(index, "taxRate", 0);
    updateItem(index, "originalPrice", undefined);
    updateItem(index, "originalTaxRate", undefined);
  };

  // Check if customer profile info differs
  const isProfileDifferent = () => {
    if (!originalCustomer) return false;
    return (
      customerName.trim() !== originalCustomer.name ||
      customerEmail.trim().toLowerCase() !== originalCustomer.email.toLowerCase() ||
      customerPhone.trim() !== originalCustomer.phone ||
      billingAddress.trim() !== originalCustomer.address ||
      gstNumber.trim() !== originalCustomer.gstNumber
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
          customerId: selectedCustomerId,
          customerName,
          customerEmail,
          customerPhone,
          billingAddress,
          gstNumber,
          updateCustomerProfile: isProfileDifferent() ? updateCustomerProfile : false,
          paymentMethod,
          discountAmount,
          shippingAmount,
          notes,
          items: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            description: i.description || null,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            taxRate: i.taxRate
          })),
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Invoice ${data.data.invoiceNumber} created!`);
        // Reset form
        setSelectedCustomerId(null);
        setCustomerName(""); setCustomerEmail(""); setCustomerPhone("");
        setBillingAddress(""); setGstNumber(""); setNotes(""); setItems([emptyItem()]);
        setDiscountAmount(0); setShippingAmount(0);
        setOriginalCustomer(null);
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
          Create and manage invoices with ERP-grade customer synchronization and pricing overrides
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
              <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-600 text-cream-100 rounded-full text-xs flex items-center justify-center font-bold">1</span>
                  Customer Information
                </h2>
                
                <div className="mb-5 space-y-1.5">
                  <Label>Search Master Profiles</Label>
                  <CustomerCombobox
                    value={customerName}
                    onSelect={handleSelectCustomer}
                    onCreateNew={handleCreateCustomerInline}
                  />
                  {!selectedCustomerId && customerName.trim().length > 0 && (
                    <span className="text-[10px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-medium flex items-center gap-1 w-fit mt-1">
                      <Sparkles className="w-3 h-3" /> Creates inline customer profile automatically
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Customer Name *</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="rounded-xl border-gray-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl border-gray-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" className="rounded-xl border-gray-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>GST Number</Label>
                    <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="22AAAAA1111A1Z1" className="rounded-xl border-gray-200 bg-white uppercase" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Billing Address</Label>
                    <Textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Customer billing address..." rows={2} className="rounded-xl border-gray-200 resize-none bg-white" />
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
                </div>

                {/* Profile Diff Checker Notification */}
                {isProfileDifferent() && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-semibold text-yellow-800">
                        Customer information differs from stored profile.
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="update-profile" 
                          checked={updateCustomerProfile} 
                          onCheckedChange={(checked) => setUpdateCustomerProfile(!!checked)}
                          className="border-yellow-400 text-yellow-700 focus-visible:ring-yellow-400"
                        />
                        <Label htmlFor="update-profile" className="text-xs font-medium text-yellow-700 cursor-pointer">
                          Update master customer profile with these changes
                        </Label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Line Items */}
              <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-600 text-cream-100 rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Products / Services
                  </h2>
                  <Button onClick={addItem} size="sm" variant="outline" className="gap-1 rounded-lg text-xs border-primary-300 text-primary-700">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </Button>
                </div>

                <div className="space-y-4">
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
                    const isPriceOverridden = item.originalPrice !== undefined && item.unitPrice !== item.originalPrice;
                    const isTaxOverridden = item.originalTaxRate !== undefined && item.taxRate !== item.originalTaxRate;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-12 gap-2 items-start bg-gray-50/50 rounded-xl p-3 border border-gray-100"
                      >
                        <div className="col-span-4 space-y-1.5">
                          <ProductCombobox
                            value={item.productName}
                            onSelect={(prod) => handleSelectProduct(i, prod)}
                            onCreateNew={(name) => handleCreateProductInline(i, name)}
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            placeholder="Description (optional)"
                            className="h-8 text-xs rounded-lg border-gray-200"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-9 text-sm text-center rounded-lg border-gray-200 bg-white"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                              className={`h-9 text-sm pl-5 text-right rounded-lg border-gray-200 bg-white ${
                                isPriceOverridden ? "border-amber-400 bg-amber-50/20" : ""
                              }`}
                            />
                          </div>
                          {isPriceOverridden && (
                            <p className="text-[9px] text-amber-600 font-medium leading-none text-right">
                              Master: ₹{item.originalPrice}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 space-y-1">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="28"
                              value={item.taxRate}
                              onChange={(e) => updateItem(i, "taxRate", parseFloat(e.target.value) || 0)}
                              className={`h-9 text-sm text-center rounded-lg border-gray-200 bg-white ${
                                isTaxOverridden ? "border-amber-400 bg-amber-50/20" : ""
                              }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                          {isTaxOverridden && (
                            <p className="text-[9px] text-amber-600 font-medium leading-none text-center">
                              Master: {item.originalTaxRate}%
                            </p>
                          )}
                        </div>
                        <div className="col-span-1 flex items-center justify-end pt-2">
                          <span className="text-sm font-bold text-primary-700">₹{total.toFixed(0)}</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center pt-1.5">
                          <button
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors p-1"
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
              <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-600 text-cream-100 rounded-full text-xs flex items-center justify-center font-bold">3</span>
                  Adjustments & Notes
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label>Discount Amount (₹)</Label>
                    <Input type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="rounded-xl border-gray-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shipping Charges (₹)</Label>
                    <Input type="number" min="0" value={shippingAmount} onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)} className="rounded-xl border-gray-200 bg-white" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Notes / Terms</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thank you for your business! Goods once sold are not returnable..." rows={3} className="rounded-xl border-gray-200 resize-none bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview / Summary */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-card p-6 sticky top-8 border border-gray-100">
                <h2 className="font-display text-lg font-bold text-primary-800 mb-5">Invoice Preview</h2>

                {/* Header */}
                <div className="bg-gradient-to-br from-primary-600 to-olive-600 rounded-xl p-4 text-center mb-4">
                  <p className="text-cream-100 font-display text-lg font-bold">🌿 Avvai</p>
                  <p className="text-primary-200 text-xs">Natural Foods</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {customerName && (
                    <div>
                      <span className="text-muted-foreground text-xs">Bill to:</span>
                      <p className="font-medium flex items-center gap-1.5">
                        {customerName}
                        {selectedCustomerId && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded">
                            Master
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {customerEmail && <p className="text-xs text-muted-foreground">{customerEmail}</p>}
                  {customerPhone && <p className="text-xs text-muted-foreground">{customerPhone}</p>}
                  {gstNumber && <p className="text-xs text-muted-foreground font-mono">GST: {gstNumber.toUpperCase()}</p>}
                </div>

                {items.filter((i) => i.productName).length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2 text-sm">
                      {items.filter((i) => i.productName).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-700 text-xs">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ₹{item.unitPrice}
                              {item.taxRate > 0 && ` (+${item.taxRate}% Tax)`}
                            </p>
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
                  className="w-full mt-6 h-12 bg-primary-600 hover:bg-primary-700 text-cream-100 font-bold rounded-xl gap-2 shadow-sm transition-all"
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
          <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
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
