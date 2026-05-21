"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderSummary } from "@/types";

interface Customer {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?limit=200")
      .then((r) => r.json())
      .then((d) => d.success && setOrders(d.data))
      .finally(() => setLoading(false));
  }, []);

  // Derive customers from orders
  const customers: Customer[] = Object.values(
    orders.reduce<Record<string, Customer>>((acc, order) => {
      if (!acc[order.customerEmail]) {
        acc[order.customerEmail] = {
          email: order.customerEmail,
          name: order.customerName,
          phone: order.customerPhone,
          orderCount: 0,
          totalSpent: 0,
          lastOrder: order.createdAt,
        };
      }
      acc[order.customerEmail].orderCount++;
      acc[order.customerEmail].totalSpent += order.totalAmount;
      if (order.createdAt > acc[order.customerEmail].lastOrder) {
        acc[order.customerEmail].lastOrder = order.createdAt;
      }
      return acc;
    }, {})
  ).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-800">Customers</h1>
        <p className="text-muted-foreground mt-1">{customers.length} unique customers</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No customers yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Orders</th>
                  <th className="px-6 py-3 text-left">Total Spent</th>
                  <th className="px-6 py-3 text-left">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">{c.orderCount}</td>
                    <td className="px-6 py-4 font-bold text-sm text-primary-700">₹{c.totalSpent.toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(c.lastOrder).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
