"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, TrendingUp, AlertTriangle,
  Clock, CheckCircle, Truck, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats, OrderSummary } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  PACKED: { label: "Packed", color: "bg-purple-100 text-purple-700", icon: Package },
  SHIPPED: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        {
          title: "Total Orders",
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          title: "Revenue (Paid)",
          value: `₹${stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          title: "Total Products",
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
        {
          title: "Low Stock Alerts",
          value: stats.lowStockCount.toLocaleString(),
          icon: AlertTriangle,
          color: stats.lowStockCount > 0 ? "text-red-600" : "text-gray-400",
          bg: stats.lowStockCount > 0 ? "bg-red-50" : "bg-gray-50",
        },
      ]
    : [];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Avvai Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : statCards.map(({ title, value, icon: Icon, color, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="rounded-2xl border-0 shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{title}</p>
                        <p className="text-2xl font-bold text-gray-800">{value}</p>
                      </div>
                      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Recent Orders */}
      <Card className="rounded-2xl border-0 shadow-card">
        <CardHeader className="border-b border-gray-50 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (stats?.recentOrders ?? []).length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">Order</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(stats?.recentOrders ?? []).map((order: OrderSummary) => {
                    const statusCfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PENDING;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-primary-700">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-800">
                            ₹{order.totalAmount.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
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
