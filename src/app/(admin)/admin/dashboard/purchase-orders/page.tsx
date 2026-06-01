"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, FileText, Clock, CheckCircle,
  XCircle, Truck, AlertTriangle, Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseOrderSummary, PurchaseOrderStatus } from "@/types";
import Link from "next/link";

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Truck },
  PARTIALLY_RECEIVED: { label: "Partially Received", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  RECEIVED: { label: "Received", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as PurchaseOrderStatus[];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/purchase-orders?${params}&limit=50`);
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage inventory procurement</p>
        </div>
        <Link
          id="create-po-btn"
          href="/admin/dashboard/purchase-orders/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="po-search"
            type="text"
            placeholder="Search PO number or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            id="po-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | "")}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-14 h-14 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 font-medium">No purchase orders</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Create your first PO to start tracking procurement</p>
              <Link
                href="/admin/dashboard/purchase-orders/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Create Purchase Order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">PO Number</th>
                    <th className="px-6 py-3 text-left">Supplier</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Items</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-left">Expected Delivery</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((po, i) => {
                    const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
                    const Icon = cfg.icon;
                    return (
                      <motion.tr
                        key={po.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-primary-700">{po.poNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800">{po.supplier.name}</p>
                          {po.supplier.email && (
                            <p className="text-xs text-muted-foreground">{po.supplier.email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{po._count?.items ?? 0} items</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-gray-800">
                            ₹{po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {po.expectedDeliveryDate
                            ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(po.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/dashboard/purchase-orders/${po.id}`}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
