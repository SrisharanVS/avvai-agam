"use client";

import { useEffect, useState } from "react";
import { Package, Eye, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { OrderSummary } from "@/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  { value: "PACKED", label: "Packed", color: "bg-purple-100 text-purple-700" },
  { value: "SHIPPED", label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  { value: "DELIVERED", label: "Delivered", color: "bg-green-100 text-green-700" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Paid", color: "bg-green-100 text-green-700" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Refunded", color: "bg-orange-100 text-orange-700" },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  COD: { label: "Cash on Delivery", icon: Truck },
  RAZORPAY: { label: "Razorpay", icon: CreditCard },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOrderStatus, setFilterOrderStatus] = useState("ALL");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: "50",
      ...(filterOrderStatus !== "ALL" && { status: filterOrderStatus }),
      ...(filterPaymentStatus !== "ALL" && { paymentStatus: filterPaymentStatus }),
    });
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOrderStatus, filterPaymentStatus]);

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
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((o) => (o ? { ...o, orderStatus: status } : null));
        }
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const orderStatusCfg = (status: string) =>
    ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];

  const paymentStatusCfg = (status: string) =>
    PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG["PENDING"];

  const paymentMethodCfg = (method: string) =>
    PAYMENT_METHOD_CONFIG[method?.toUpperCase()] || { label: method, icon: CreditCard };

  return (
    <div className="p-6 md:p-8">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Orders</h1>
          <p className="text-muted-foreground mt-1">{orders.length} orders</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Order status filter */}
          <Select value={filterOrderStatus} onValueChange={(v: string | null) => v && setFilterOrderStatus(v)}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200">
              <SelectValue placeholder="Order Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Orders</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment status filter */}
          <Select value={filterPaymentStatus} onValueChange={(v: string | null) => v && setFilterPaymentStatus(v)}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Payments</SelectItem>
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                <tr>
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Payment Method</th>
                  <th className="px-5 py-3 text-left">Payment Status</th>
                  <th className="px-5 py-3 text-left">Order Status</th>
                  <th className="px-5 py-3 text-left">Update</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const oStatus = orderStatusCfg(order.orderStatus);
                  const pStatus = paymentStatusCfg(order.paymentStatus);
                  const pMethod = paymentMethodCfg(order.paymentMethod);
                  const MethodIcon = pMethod.icon;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-medium text-primary-700">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-sm text-gray-800">
                        ₹{order.totalAmount.toFixed(0)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <MethodIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {pMethod.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${pStatus.color}`}
                        >
                          {pStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${oStatus.color}`}
                        >
                          {oStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Select
                          value={order.orderStatus}
                          onValueChange={(v: string | null) => v && updateStatus(order.id, v)}
                          disabled={updating === order.id}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs rounded-lg border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600"
                        >
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
                <div>
                  <p className="text-muted-foreground text-xs">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Method</p>
                  <p className="font-medium">
                    {paymentMethodCfg(selectedOrder.paymentMethod).label}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Status</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentStatusCfg(selectedOrder.paymentStatus).color}`}
                  >
                    {paymentStatusCfg(selectedOrder.paymentStatus).label}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Order Status</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${orderStatusCfg(selectedOrder.orderStatus).color}`}
                  >
                    {orderStatusCfg(selectedOrder.orderStatus).label}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="font-medium">
                    {selectedOrder.address}, {selectedOrder.city},{" "}
                    {selectedOrder.state} - {selectedOrder.pincode}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{item.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm text-gray-600">
                {selectedOrder.shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>₹{selectedOrder.shippingAmount.toFixed(0)}</span>
                  </div>
                )}
                {selectedOrder.gatewayFee !== undefined && selectedOrder.gatewayFee > 0 && (
                  <div className="flex justify-between">
                    <span>Gateway Fee (Razorpay)</span>
                    <span>₹{selectedOrder.gatewayFee.toFixed(2)}</span>
                  </div>
                )}
              </div>

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
