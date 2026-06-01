"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Users, Search, Mail, Phone, MapPin, CreditCard, 
  Clock, Edit2, X, ChevronRight, FileText, ShoppingBag, Eye 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CustomerSummary {
  id: string;
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstNumber: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
  createdAt: string;
}

interface PurchaseItem {
  productName: string;
  sku: string;
  totalQty: number;
  totalSpent: number;
  lastPurchased: string;
}

interface CustomerDetail {
  customer: CustomerSummary;
  stats: {
    orderCount: number;
    totalSpent: number;
    invoiceCount: number;
    storefrontOrderCount: number;
  };
  invoices: any[];
  storefrontOrders: any[];
  purchaseHistory: PurchaseItem[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"invoices" | "storefront" | "history">("invoices");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGstNumber, setEditGstNumber] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch list of customers
  const fetchCustomers = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?limit=100&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      } else {
        toast.error("Failed to load customers");
      }
    } catch {
      toast.error("Error fetching customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(search);
  }, [search, fetchCustomers]);

  // Fetch detailed profile for selected customer
  const handleSelectCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    setIsEditing(false);
    setActiveTab("invoices");
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(data.data);
        // Prep edit form
        setEditName(data.data.customer.name);
        setEditEmail(data.data.customer.email || "");
        setEditPhone(data.data.customer.phone || "");
        setEditAddress(data.data.customer.address || "");
        setEditGstNumber(data.data.customer.gstNumber || "");
      } else {
        toast.error(data.error || "Failed to load customer profile");
        setSelectedCustomerId(null);
      }
    } catch {
      toast.error("Error loading customer profile");
      setSelectedCustomerId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Save edits
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCustomer) return;
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          address: editAddress || null,
          gstNumber: editGstNumber || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer profile updated successfully!");
        setIsEditing(false);
        // Refresh details & list
        handleSelectCustomer(selectedCustomerId);
        fetchCustomers(search);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch {
      toast.error("Error updating customer");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-80px)]">
      {/* LEFT PANEL: LIST OF CUSTOMERS */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-800">Customers</h1>
            <p className="text-muted-foreground mt-1">{customers.length} master profiles</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by ID, name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-white border-gray-200"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No customers found matching search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                  <tr>
                    <th className="px-6 py-4 text-left">Customer ID</th>
                    <th className="px-6 py-4 text-left">Customer Name</th>
                    <th className="px-6 py-4 text-left">Contact Info</th>
                    <th className="px-6 py-4 text-left">Orders</th>
                    <th className="px-6 py-4 text-left">Total Spent</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                        selectedCustomerId === c.id ? "bg-primary-50/50 hover:bg-primary-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-primary-100/60 text-primary-800 rounded-md">
                          {c.customerId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                        {c.gstNumber && (
                          <span className="text-[10px] text-muted-foreground uppercase">GST: {c.gstNumber}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600">{c.email || "No email"}</p>
                        <p className="text-xs text-muted-foreground">{c.phone || "No phone"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {c.orderCount}
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-primary-700">
                        ₹{c.totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost" className="text-primary-700 p-1 hover:bg-primary-100/50 rounded-lg">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: PROFILE SLIDEOUT / VIEWER */}
      <AnimatePresence>
        {selectedCustomerId && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="w-full xl:w-[450px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col sticky top-8 max-h-[calc(100vh-120px)]"
          >
            {/* PANEL HEADER */}
            <div className="p-5 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-700" />
                <span className="font-semibold text-gray-800">Customer Profile</span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-600 hover:text-primary-700"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedCustomerId(null)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="p-6 space-y-4 flex-1">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            ) : selectedCustomer ? (
              <div className="flex-1 overflow-y-auto flex flex-col">
                {isEditing ? (
                  /* EDIT PROFILE FORM */
                  <form onSubmit={handleSaveEdits} className="p-6 space-y-4 flex-1">
                    <div className="space-y-1.5">
                      <Label>Customer Name *</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} required className="rounded-xl border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email Address</Label>
                      <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="rounded-xl border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number</Label>
                      <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="rounded-xl border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>GST Number</Label>
                      <Input value={editGstNumber} onChange={(e) => setEditGstNumber(e.target.value)} className="rounded-xl border-gray-200 placeholder:opacity-50" placeholder="22AAAAA1111A1Z1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Billing Address</Label>
                      <Textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={3} className="rounded-xl border-gray-200 resize-none" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={updating} className="flex-1 bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl font-bold">
                        {updating ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl border-gray-200">
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* PROFILE VIEWER */
                  <div className="flex-1 flex flex-col">
                    {/* Basic details */}
                    <div className="p-6 bg-gradient-to-br from-primary-50/50 to-cream-50/50 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="font-display text-xl font-bold text-gray-800">{selectedCustomer.customer.name}</h2>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-primary-600 text-cream-100 rounded-md">
                          {selectedCustomer.customer.customerId}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-4 text-sm text-gray-600">
                        {selectedCustomer.customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>{selectedCustomer.customer.email}</span>
                          </div>
                        )}
                        {selectedCustomer.customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>{selectedCustomer.customer.phone}</span>
                          </div>
                        )}
                        {selectedCustomer.customer.gstNumber && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>GST: <span className="font-mono font-semibold">{selectedCustomer.customer.gstNumber}</span></span>
                          </div>
                        )}
                        {selectedCustomer.customer.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="leading-relaxed text-xs">{selectedCustomer.customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 divide-x divide-y border-b border-gray-100 text-center bg-gray-50/20">
                      <div className="p-4">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Revenue</p>
                        <p className="text-xl font-bold text-primary-700 mt-1">
                          ₹{selectedCustomer.stats.totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Orders</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{selectedCustomer.stats.orderCount}</p>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-100 text-xs">
                      {(["invoices", "storefront", "history"] as const).map((tab) => {
                        const count = 
                          tab === "invoices" ? selectedCustomer.invoices.length :
                          tab === "storefront" ? selectedCustomer.storefrontOrders.length :
                          selectedCustomer.purchaseHistory.length;
                        return (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 font-semibold border-b-2 text-center capitalize transition-colors ${
                              activeTab === tab 
                                ? "border-primary-600 text-primary-700 bg-primary-50/10" 
                                : "border-transparent text-muted-foreground hover:text-gray-700"
                            }`}
                          >
                            {tab === "history" ? "Purchases" : tab} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab Contents */}
                    <div className="p-4 flex-1">
                      {activeTab === "invoices" && (
                        <div className="space-y-3">
                          {selectedCustomer.invoices.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">No invoice records.</p>
                          ) : (
                            selectedCustomer.invoices.map((inv) => (
                              <div key={inv.id} className="flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 border p-3 rounded-xl transition-colors">
                                <div className="space-y-0.5">
                                  <span className="font-mono text-xs font-bold text-primary-700">{inv.invoiceNumber}</span>
                                  <p className="text-[10px] text-muted-foreground">
                                    {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-xs">₹{inv.totalAmount.toLocaleString()}</span>
                                  <Badge className={`text-[10px] rounded-full scale-90 ${
                                    inv.status === "PAID" ? "bg-green-100 text-green-700" :
                                    inv.status === "SENT" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                  }`}>
                                    {inv.status}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === "storefront" && (
                        <div className="space-y-3">
                          {selectedCustomer.storefrontOrders.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">No storefront orders.</p>
                          ) : (
                            selectedCustomer.storefrontOrders.map((ord) => (
                              <div key={ord.id} className="flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 border p-3 rounded-xl transition-colors">
                                <div className="space-y-0.5">
                                  <span className="font-mono text-xs font-bold text-gray-800">{ord.orderNumber}</span>
                                  <p className="text-[10px] text-muted-foreground">
                                    {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-xs">₹{ord.totalAmount.toLocaleString()}</span>
                                  <Badge className={`text-[10px] rounded-full scale-90 ${
                                    ord.orderStatus === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {ord.orderStatus}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === "history" && (
                        <div className="space-y-3">
                          {selectedCustomer.purchaseHistory.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-8">No purchased items list.</p>
                          ) : (
                            selectedCustomer.purchaseHistory.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50/50 border p-3 rounded-xl">
                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-gray-800">{item.productName}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    SKU: {item.sku} • Qty: {item.totalQty}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-xs text-primary-700">₹{item.totalSpent.toLocaleString()}</p>
                                  <span className="text-[9px] text-muted-foreground">
                                    Last: {new Date(item.lastPurchased).toLocaleDateString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
