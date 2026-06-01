"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, TrendingUp, AlertTriangle,
  Clock, CheckCircle, Truck, XCircle, ClipboardList,
  Boxes, ChevronRight, Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats, OrderSummary } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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
          href: "/admin/dashboard/orders",
        },
        {
          title: "Revenue (Paid)",
          value: `₹${stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50",
          href: "/admin/dashboard/orders",
        },
        {
          title: "Total Products",
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          color: "text-purple-600",
          bg: "bg-purple-50",
          href: "/admin/dashboard/products",
        },
        {
          title: "Low Stock Alerts",
          value: (stats.lowStockCount ?? 0).toLocaleString(),
          icon: AlertTriangle,
          color: (stats.lowStockCount ?? 0) > 0 ? "text-red-600" : "text-gray-400",
          bg: (stats.lowStockCount ?? 0) > 0 ? "bg-red-50" : "bg-gray-50",
          href: "/admin/dashboard/inventory",
        },
        {
          title: "Pending POs",
          value: (stats.pendingPOCount ?? 0).toLocaleString(),
          icon: ClipboardList,
          color: (stats.pendingPOCount ?? 0) > 0 ? "text-amber-600" : "text-gray-400",
          bg: (stats.pendingPOCount ?? 0) > 0 ? "bg-amber-50" : "bg-gray-50",
          href: "/admin/dashboard/purchase-orders",
        },
        {
          title: "Inventory Value",
          value: `₹${(stats.inventoryValue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
          icon: Boxes,
          color: "text-teal-600",
          bg: "bg-teal-50",
          href: "/admin/dashboard/reports",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : statCards.map(({ title, value, icon: Icon, color, bg, href }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={href}>
                  <Card className="rounded-2xl border-0 shadow-card hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 leading-tight">{title}</p>
                          <p className="text-xl font-bold text-gray-800">{value}</p>
                        </div>
                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4.5 h-4.5 ${color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Low Stock Alerts */}
        <Card className="rounded-2xl border-0 shadow-card">
          <CardHeader className="border-b border-gray-50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Low Stock Alerts
            </CardTitle>
            <Link href="/admin/dashboard/inventory" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : !stats?.lowStockProducts || stats.lowStockProducts.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-500">All products are well stocked!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Min: {p.minimumStockLevel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">{p.stock}</span>
                      <Badge className="bg-red-50 text-red-600 text-xs">Low</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Purchase Orders */}
        <Card className="rounded-2xl border-0 shadow-card">
          <CardHeader className="border-b border-gray-50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              Pending Purchase Orders
            </CardTitle>
            <Link href="/admin/dashboard/purchase-orders" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (stats?.pendingPOCount ?? 0) === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-500">No pending purchase orders</p>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-4">
                  <ClipboardList className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{stats?.pendingPOCount}</p>
                    <p className="text-sm text-amber-600">orders awaiting action</p>
                  </div>
                </div>
                <Link
                  href="/admin/dashboard/purchase-orders"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Manage Purchase Orders
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="rounded-2xl border-0 shadow-card">
        <CardHeader className="border-b border-gray-50 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Orders</CardTitle>
          <Link href="/admin/dashboard/orders" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
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
