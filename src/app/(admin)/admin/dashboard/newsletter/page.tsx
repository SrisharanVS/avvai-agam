"use client";

import { useEffect, useState } from "react";
import { Mail, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Subscriber { id: string; email: string; subscribedAt: string; active: boolean; }

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/newsletter")
      .then((r) => r.json())
      .then((d) => d.success && setSubscribers(d.data))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const csv = ["Email,Subscribed At", ...subscribers.map((s) => `${s.email},${s.subscribedAt}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avvai-newsletter-subscribers.csv";
    a.click();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Newsletter</h1>
          <p className="text-muted-foreground mt-1">{subscribers.length} active subscribers</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No subscribers yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Subscribed On</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscribers.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{s.email}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {new Date(s.subscribedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Active</span>
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
