"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package, Settings2,
  Search, Filter, ArrowUpRight, ArrowDownRight,
  RefreshCw, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryMovementType, MovementType } from "@/types";
import Link from "next/link";

const MOVEMENT_CONFIG: Record<MovementType, { label: string; color: string; bg: string; icon: typeof TrendingUp; sign: "+" | "-" }> = {
  PURCHASE: { label: "Purchase", color: "text-green-700", bg: "bg-green-50", icon: TrendingUp, sign: "+" },
  SALE: { label: "Sale", color: "text-red-700", bg: "bg-red-50", icon: TrendingDown, sign: "-" },
  ADJUSTMENT: { label: "Adjustment", color: "text-blue-700", bg: "bg-blue-50", icon: Settings2, sign: "+" },
  RETURN: { label: "Return", color: "text-purple-700", bg: "bg-purple-50", icon: ArrowUpRight, sign: "+" },
  DAMAGED: { label: "Damaged", color: "text-orange-700", bg: "bg-orange-50", icon: ArrowDownRight, sign: "-" },
};

export default function InventoryLedgerPage() {
  const [movements, setMovements] = useState<InventoryMovementType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementType | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "40" });
      if (typeFilter) params.set("movementType", typeFilter);
      const res = await fetch(`/api/inventory/movements?${params}`);
      const data = await res.json();
      if (data.success) {
        setMovements(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchMovements, 300);
    return () => clearTimeout(timer);
  }, [fetchMovements]);

  const filtered = search
    ? movements.filter((m) =>
      m.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.referenceId && m.referenceId.toLowerCase().includes(search.toLowerCase()))
    )
    : movements;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Inventory Ledger</h1>
          <p className="text-muted-foreground mt-1">Complete stock movement history</p>
        </div>
        <Link
          id="manual-adjustment-btn"
          href="/admin/dashboard/inventory/adjustments/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Manual Adjustment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="inventory-search"
            type="text"
            placeholder="Search product or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            id="movement-type-filter"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as MovementType | ""); setPage(1); }}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white appearance-none"
          >
            <option value="">All Types</option>
            {(Object.keys(MOVEMENT_CONFIG) as MovementType[]).map((t) => (
              <option key={t} value={t}>{MOVEMENT_CONFIG[t].label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => fetchMovements()}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-muted-foreground hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="w-14 h-14 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 font-medium">No inventory movements yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create purchase orders and receive inventory to see movements here
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">Product</th>
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-right">Change</th>
                      <th className="px-5 py-3 text-right">Before</th>
                      <th className="px-5 py-3 text-right">After</th>
                      <th className="px-5 py-3 text-left">Reference</th>
                      <th className="px-5 py-3 text-left">Notes</th>
                      <th className="px-5 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((m, i) => {
                      const cfg = MOVEMENT_CONFIG[m.movementType] || MOVEMENT_CONFIG.ADJUSTMENT;
                      const Icon = cfg.icon;
                      const qty = Math.abs(m.quantity);
                      const isPositive = m.newStock >= m.previousStock;
                      return (
                        <motion.tr
                          key={m.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-sm text-gray-800">{m.product.name}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                              {isPositive ? "+" : "-"}{qty}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm text-muted-foreground">{m.previousStock}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-800">{m.newStock}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-mono text-muted-foreground">
                              {m.referenceType ? m.referenceType.replace(/_/g, " ") : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-32 truncate">
                            {m.notes || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-50">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
