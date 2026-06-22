"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [shippingFee, setShippingFee] = useState<number>(60);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((resData) => {
        if (resData.success) {
          setShippingFee(resData.data.shippingFee);
          setFreeShippingThreshold(resData.data.freeShippingThreshold);
        } else {
          toast.error(resData.error || "Failed to load settings");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load settings");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee,
          freeShippingThreshold,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success("Settings saved successfully! 🌿");
      } else {
        toast.error(resData.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-900 font-display">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure storefront preferences, shipping fees, and online payment options
        </p>
      </div>

      <Separator />

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-primary-800">Shipping Configurations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="shipping-fee"
                  className="block text-sm font-medium text-gray-700"
                >
                  Standard Shipping Fee (₹)
                </label>
                <input
                  id="shipping-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50 text-sm font-medium text-gray-800"
                />
                <p className="text-xs text-muted-foreground">
                  Applied to orders below the free shipping threshold.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="free-shipping-threshold"
                  className="block text-sm font-medium text-gray-700"
                >
                  Free Shipping Threshold (₹)
                </label>
                <input
                  id="free-shipping-threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50 text-sm font-medium text-gray-800"
                />
                <p className="text-xs text-muted-foreground">
                  Orders equal or above this subtotal amount get free shipping.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-primary-800">Online Payments</h2>
              <div className="flex gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100 text-sm text-primary-800">
                <Info className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="font-semibold">Razorpay Platform Fee Integration</p>
                  <p className="text-xs text-primary-700/90 leading-relaxed">
                    A fixed **2.36%** platform fee is automatically applied to all online orders paid via the Razorpay gateway during checkout. This fee is calculated server-side and recorded under the `Gateway Fee` field on all successful orders and generated invoice sheets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-cream-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 h-11 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/60 text-cream-100 font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
