"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, Leaf, Search } from "lucide-react";
import { useCartStore } from "@/store/cart";
import CartDrawer from "./CartDrawer";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  // { href: "/shop?category=cold-pressed-oils", label: "Oils" },
  // { href: "/shop?category=millets", label: "Millets" },
  // { href: "/shop?category=spices", label: "Spices" },
  { href: "/#about", label: "Our Story" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { totalItems, openCart, isOpen } = useCartStore();
  const itemCount = totalItems();

  const showSolid = !isHome || scrolled;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showSolid
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-cream-300"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Leaf className="w-4 h-4 text-cream-100" />
              </div>
              <span
                className={`text-xl md:text-2xl font-display font-bold transition-colors ${showSolid ? "text-primary-600" : "text-white"
                  }`}
              >
                Avvai
              </span>
              <span
                className={`hidden sm:block text-xs font-medium tracking-widest uppercase mt-1 transition-colors ${showSolid ? "text-olive-500" : "text-primary-200"
                  }`}
              >
                Natural Foods
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-primary-50 hover:text-primary-700 ${showSolid ? "text-gray-700" : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/shop"
                className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 ${showSolid
                  ? "text-gray-600 hover:bg-primary-50 hover:text-primary-600"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
              >
                <Search className="w-5 h-5" />
              </Link>

              <button
                id="cart-button"
                onClick={openCart}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110 ${showSolid
                  ? "text-gray-600 hover:bg-primary-50 hover:text-primary-600"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-primary-900 text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                id="mobile-menu-button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all ${showSolid ? "text-gray-700" : "text-white"
                  }`}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-cream-300 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-cream-300 mt-2">
                  <Link
                    href="/shop"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-primary-700 font-semibold hover:bg-primary-50 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Search Products
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <CartDrawer />
    </>
  );
}
