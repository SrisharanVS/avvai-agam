"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Mail, Phone, Package, TrendingUp,
  ArrowLeft, Clock, CheckCircle, XCircle, Truck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SupplierDetail, PurchaseOrderSummary } from "@/types";
import Link from "next/link";

const PO_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: Clock },
  SENT: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Truck },
  PARTIALLY_RECEIVED: { label: "Partial", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  RECEIVED: { label: "Received", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((d) => d.success && setSupplier(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6 md:p-8 text-center">
        <p className="text-gray-500">Supplier not found</p>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 text-sm">Go back</button>
      </div>
    );
  }

  const statCards = [
    { label: "Total Orders", value: supplier.totalOrders, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Spend", value: `₹${supplier.totalSpend.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Back */}
      <button
        id="supplier-detail-back"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Suppliers
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">{supplier.name}</h1>
          {supplier.contactPerson && (
            <p className="text-muted-foreground">{supplier.contactPerson}</p>
          )}
        </div>
        {supplier.isArchived && (
          <Badge className="bg-gray-100 text-gray-500 ml-auto">Archived</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supplier.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${supplier.email}`} className="text-primary-600 hover:underline truncate">
                    {supplier.email}
                  </a>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-gray-700">{supplier.phone}</span>
                </div>
              )}
              {supplier.gstNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-gray-700">GST: {supplier.gstNumber}</span>
                </div>
              )}
              {supplier.address && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-2">
                  {supplier.address}
                </div>
              )}
              {supplier.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="rounded-2xl border-0 shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-xl font-bold text-gray-800">{value}</p>
                  </div>
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Link
            href={`/admin/dashboard/purchase-orders/new?supplierId=${supplier.id}`}
            className="block w-full text-center px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            + Create Purchase Order
          </Link>
        </div>

        {/* Purchase History */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-0 shadow-card">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-base font-semibold text-gray-700">Purchase History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {supplier.purchaseOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-muted-foreground">No purchase orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-3 text-left">PO Number</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Amount</th>
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(supplier.purchaseOrders as PurchaseOrderSummary[]).map((po) => {
                        const cfg = PO_STATUS_CONFIG[po.status] || PO_STATUS_CONFIG.DRAFT;
                        return (
                          <motion.tr
                            key={po.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-5 py-3">
                              <span className="font-mono text-sm font-medium text-primary-700">{po.poNumber}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm font-semibold text-gray-800">
                              ₹{po.totalAmount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">
                              {new Date(po.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="px-5 py-3">
                              <Link
                                href={`/admin/dashboard/purchase-orders/${po.id}`}
                                className="text-xs text-primary-600 hover:underline"
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
      </div>
    </div>
  );
}
