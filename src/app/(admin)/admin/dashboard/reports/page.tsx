"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, BarChart2, Package, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PurchaseReport {
  poNumber: string;
  supplier: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface StockReport {
  name: string;
  stock: number;
  costPrice: number | null;
  price: number;
  inventoryValue: number;
}

interface MovementReport {
  productName: string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: string | null;
  notes: string | null;
  createdAt: string;
}

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}

export default function ReportsPage() {
  const [purchaseReport, setPurchaseReport] = useState<PurchaseReport[]>([]);
  const [stockReport, setStockReport] = useState<StockReport[]>([]);
  const [movementReport, setMovementReport] = useState<MovementReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [posRes, productsRes, movementsRes] = await Promise.all([
        fetch("/api/purchase-orders?limit=200"),
        fetch("/api/products?limit=200"),
        fetch("/api/inventory/movements?limit=200"),
      ]);
      const [posData, productsData, movementsData] = await Promise.all([
        posRes.json(), productsRes.json(), movementsRes.json(),
      ]);

      if (posData.success) {
        setPurchaseReport(posData.data.map((po: { poNumber: string; supplier: { name: string }; status: string; totalAmount: number; createdAt: string }) => ({
          poNumber: po.poNumber,
          supplier: po.supplier.name,
          status: po.status,
          totalAmount: po.totalAmount,
          createdAt: new Date(po.createdAt).toLocaleDateString("en-IN"),
        })));
      }

      if (productsData.success) {
        setStockReport(productsData.data.map((p: { name: string; stock: number; costPrice?: number; price: number }) => ({
          name: p.name,
          stock: p.stock,
          costPrice: p.costPrice ?? null,
          price: p.price,
          inventoryValue: p.stock * (p.costPrice ?? p.price),
        })));
      }

      if (movementsData.success) {
        setMovementReport(movementsData.data.map((m: { product: { name: string }; movementType: string; quantity: number; previousStock: number; newStock: number; referenceType: string | null; notes: string | null; createdAt: string }) => ({
          productName: m.product.name,
          movementType: m.movementType,
          quantity: m.quantity,
          previousStock: m.previousStock,
          newStock: m.newStock,
          referenceType: m.referenceType,
          notes: m.notes,
          createdAt: new Date(m.createdAt).toLocaleString("en-IN"),
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const totalInventoryValue = stockReport.reduce((s, p) => s + p.inventoryValue, 0);
  const totalPOSpend = purchaseReport
    .filter((p) => p.status === "RECEIVED" || p.status === "PARTIALLY_RECEIVED")
    .reduce((s, p) => s + p.totalAmount, 0);

  const reportSections = [
    {
      id: "purchase-history",
      title: "Purchase History",
      description: "All purchase orders with supplier and status",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      count: purchaseReport.length,
      stat: `₹${totalPOSpend.toLocaleString("en-IN", { minimumFractionDigits: 0 })} total spend`,
      onExport: () => exportToCSV(purchaseReport as unknown as Record<string, unknown>[], "purchase-history"),
    },
    {
      id: "inventory-valuation",
      title: "Inventory Valuation",
      description: "Current stock value across all products",
      icon: Package,
      color: "text-green-600",
      bg: "bg-green-50",
      count: stockReport.length,
      stat: `₹${totalInventoryValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })} total value`,
      onExport: () => exportToCSV(stockReport as unknown as Record<string, unknown>[], "inventory-valuation"),
    },
    {
      id: "stock-movements",
      title: "Stock Movement Report",
      description: "Complete inventory movement ledger",
      icon: BarChart2,
      color: "text-purple-600",
      bg: "bg-purple-50",
      count: movementReport.length,
      stat: `${movementReport.length} movements recorded`,
      onExport: () => exportToCSV(movementReport as unknown as Record<string, unknown>[], "stock-movements"),
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Reports</h1>
          <p className="text-muted-foreground mt-1">Export procurement and inventory data</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-muted-foreground hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {reportSections.map(({ id, title, description, icon: Icon, color, bg, count, stat, onExport }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="rounded-2xl border-0 shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{description}</p>
                  <p className="text-sm font-medium text-gray-700 mb-1">{count} records</p>
                  <p className="text-xs text-muted-foreground mb-4">{stat}</p>
                  <button
                    id={`export-${id}`}
                    onClick={onExport}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors border border-gray-200"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Inventory Valuation Table */}
      {!loading && stockReport.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-card">
          <CardHeader className="border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-700">Inventory Valuation Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Cost Price</th>
                    <th className="px-5 py-3 text-right">Selling Price</th>
                    <th className="px-5 py-3 text-right">Inventory Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockReport
                    .sort((a, b) => b.inventoryValue - a.inventoryValue)
                    .slice(0, 20)
                    .map((p, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-600">{p.stock}</td>
                        <td className="px-5 py-3 text-sm text-right text-muted-foreground">
                          {p.costPrice ? `₹${p.costPrice.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-sm text-right text-gray-600">₹{p.price.toFixed(2)}</td>
                        <td className="px-5 py-3 text-sm text-right font-semibold text-gray-800">
                          ₹{p.inventoryValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-sm font-bold text-gray-800">Total Inventory Value</td>
                    <td className="px-5 py-3 text-sm font-bold text-primary-700 text-right">
                      ₹{totalInventoryValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
