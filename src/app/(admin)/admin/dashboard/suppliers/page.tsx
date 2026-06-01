"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Building2, Phone, Mail, Archive,
  ArchiveRestore, Trash2, Edit2, ChevronRight, Users,
  Package, X, Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { SupplierType } from "@/types";

function SupplierFormModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier?: SupplierType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: supplier?.name || "",
    contactPerson: supplier?.contactPerson || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    gstNumber: supplier?.gstNumber || "",
    address: supplier?.address || "",
    notes: supplier?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(supplier ? "Supplier updated" : "Supplier created");
        onSaved();
      } else {
        toast.error(data.error || "Failed to save supplier");
      }
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{ key: keyof typeof form; label: string; placeholder: string; required?: boolean; textarea?: boolean }> = [
    { key: "name", label: "Supplier Name *", placeholder: "e.g. Organic Farms Co.", required: true },
    { key: "contactPerson", label: "Contact Person", placeholder: "e.g. Ravi Kumar" },
    { key: "email", label: "Email", placeholder: "supplier@example.com" },
    { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
    { key: "gstNumber", label: "GST Number", placeholder: "22AAAAA0000A1Z5" },
    { key: "address", label: "Address", placeholder: "Full address", textarea: true },
    { key: "notes", label: "Notes", placeholder: "Any additional notes...", textarea: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map(({ key, label, placeholder, required, textarea }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              {textarea ? (
                <textarea
                  id={`supplier-${key}`}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  rows={3}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  required={required}
                />
              ) : (
                <input
                  id={`supplier-${key}`}
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  required={required}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="supplier-form-submit"
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {supplier ? "Update Supplier" : "Add Supplier"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierType | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ includeArchived: String(includeArchived) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/suppliers?${params}`);
      const data = await res.json();
      if (data.success) setSuppliers(data.data);
    } finally {
      setLoading(false);
    }
  }, [search, includeArchived]);

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(timer);
  }, [fetchSuppliers]);

  const handleArchive = async (supplier: SupplierType) => {
    const res = await fetch(`/api/suppliers/${supplier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !supplier.isArchived }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(supplier.isArchived ? "Supplier restored" : "Supplier archived");
      fetchSuppliers();
    } else {
      toast.error(data.error || "Failed to update supplier");
    }
  };

  const handleDelete = async (supplier: SupplierType) => {
    if (!confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/suppliers/${supplier.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("Supplier deleted");
      fetchSuppliers();
    } else {
      toast.error(data.error || "Failed to delete supplier");
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage your product suppliers</p>
        </div>
        <button
          id="add-supplier-btn"
          onClick={() => { setEditSupplier(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="supplier-search"
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
          <input
            id="include-archived-toggle"
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="w-4 h-4 accent-primary-600"
          />
          Show archived
        </label>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">No suppliers found</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first supplier to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {suppliers.map((supplier, i) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`rounded-2xl border-0 shadow-card hover:shadow-md transition-shadow ${supplier.isArchived ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 leading-tight">{supplier.name}</p>
                          {supplier.contactPerson && (
                            <p className="text-xs text-muted-foreground">{supplier.contactPerson}</p>
                          )}
                        </div>
                      </div>
                      {supplier.isArchived && (
                        <Badge className="bg-gray-100 text-gray-500 text-xs">Archived</Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.gstNumber && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          <span>GST: {supplier.gstNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-auto">
                        <Users className="w-3 h-3" />
                        {supplier._count?.purchaseOrders ?? 0} orders
                      </div>
                      <button
                        onClick={() => { setEditSupplier(supplier); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(supplier)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        title={supplier.isArchived ? "Restore" : "Archive"}
                      >
                        {supplier.isArchived
                          ? <ArchiveRestore className="w-3.5 h-3.5" />
                          : <Archive className="w-3.5 h-3.5" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(supplier)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/admin/dashboard/suppliers/${supplier.id}`}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                        title="View details"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <SupplierFormModal
            supplier={editSupplier}
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); fetchSuppliers(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
