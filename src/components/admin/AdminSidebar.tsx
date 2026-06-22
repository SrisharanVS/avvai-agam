"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, FolderOpen, FileText,
  Users, Mail, LogOut, Leaf, Menu, X, ChevronRight,
  Building2, ClipboardList, Boxes, BarChart2, Settings,
} from "lucide-react";
import { toast } from "sonner";

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/dashboard/products", label: "Products", icon: Package },
      { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/dashboard/categories", label: "Categories", icon: FolderOpen },
      { href: "/admin/dashboard/invoices", label: "Invoices", icon: FileText },
      { href: "/admin/dashboard/customers", label: "Customers", icon: Users },
      { href: "/admin/dashboard/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    title: "Procurement",
    items: [
      { href: "/admin/dashboard/suppliers", label: "Suppliers", icon: Building2 },
      { href: "/admin/dashboard/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/admin/dashboard/inventory", label: "Stock Ledger", icon: Boxes },
      { href: "/admin/dashboard/reports", label: "Reports", icon: BarChart2 },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/admin/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-cream-100" />
          </div>
          <div>
            <p className="font-display font-bold text-primary-800 leading-none">Avvai</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? "bg-primary-600 text-cream-100 shadow-sm"
                        : "text-gray-600 hover:bg-cream-100 hover:text-primary-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="w-4 h-4 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-cream-100" />
          </div>
          <span className="font-display font-bold text-primary-800">Avvai Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-14 left-0 bottom-0 w-64 bg-white shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
