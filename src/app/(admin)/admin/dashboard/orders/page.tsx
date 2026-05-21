"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, Truck, XCircle, Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { OrderSummary } from "@/types";

const STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  { value: "PACKED", label: "Packed", color: "bg-purple-100 text-purple-700" },
  { value: "SHIPPED", label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  { value: "DELIVERED", label: "Delivered", color: "bg-green-100 text-green-700" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", ...(filterStatus !== "ALL" && { status: filterStatus }) });
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${status}`);
        fetchOrders();
        if (selectedOrder?.id === orderId) setSelectedOrder((o) => o ? { ...o, orderStatus: status } : null);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const statusCfg = (status: string) => STATUSES.find((s) => s.value === status) || STATUSES[0];

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Orders</h1>
          <p className="text-muted-foreground mt-1">{orders.length} orders</p>
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as string)}>
          <SelectTrigger className="w-44 rounded-xl border-gray-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Orders</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Order</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Update Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const cfg = statusCfg(order.orderStatus);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-primary-700">{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-gray-800">₹{order.totalAmount.toFixed(0)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={order.orderStatus}
                          onValueChange={(v) => v && updateStatus(order.id, v)}
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs rounded-lg border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)} className="text-primary-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No orders found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Order {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Customer</p><p className="font-medium">{selectedOrder.customerName}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{selectedOrder.customerPhone}</p></div>
                <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{selectedOrder.customerEmail}</p></div>
                <div><p className="text-muted-foreground text-xs">Payment</p><p className="font-medium">{selectedOrder.paymentMethod}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground text-xs">Address</p><p className="font-medium">{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p></div>
              </div>
              <Separator />
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-medium">₹{item.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{selectedOrder.totalAmount.toFixed(0)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
