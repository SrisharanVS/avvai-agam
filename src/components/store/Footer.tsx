import Link from "next/link";
import { Leaf, Phone, Mail, MapPin, Camera, Rss, Video, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary-800 text-cream-200">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-cream-100" />
              </div>
              <span className="text-2xl font-display font-bold text-cream-100">Avvai</span>
            </Link>
            <p className="text-sm text-primary-200 leading-relaxed mb-5">
              Pure, organic, chemical-free foods sourced directly from trusted farmers.
              Bringing nature's best to your table.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Camera, href: "#", label: "Instagram" },
                { Icon: Rss, href: "#", label: "Facebook" },
                { Icon: Video, href: "#", label: "YouTube" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-primary-700 hover:bg-primary-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-cream-200" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-cream-100 font-semibold text-sm uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2.5">
              {[
                { label: "All Products", href: "/shop" },
                { label: "Organic Rice", href: "/shop?category=organic-rice" },
                { label: "Cold Pressed Oils", href: "/shop?category=cold-pressed-oils" },
                { label: "Millets", href: "/shop?category=millets" },
                { label: "Herbal Products", href: "/shop?category=herbal-products" },
                { label: "Spices", href: "/shop?category=spices" },
                { label: "Dry Fruits", href: "/shop?category=dry-fruits" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-200 hover:text-cream-100 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-cream-100 font-semibold text-sm uppercase tracking-wider mb-4">Information</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Our Story", href: "/#about" },
                { label: "Why Organic?", href: "/#why-us" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Shipping Policy", href: "/shipping" },
                { label: "Return Policy", href: "/returns" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary-200 hover:text-cream-100 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-cream-100 font-semibold text-sm uppercase tracking-wider mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <p className="text-primary-200 text-sm">
                  33, NSR Road, Saibaba Colony,<br />
                  Coimbatore, Tamil Nadu - 641 011
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href="tel:+919790656561" className="text-primary-200 hover:text-cream-100 text-sm transition-colors">
                  +91 97906 56561
                </a>
                <a href="tel:+919842993000" className="text-primary-200 hover:text-cream-100 text-sm transition-colors">
                  +91 98429 93000
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a href="mailto:support@avvai.in" className="text-primary-200 hover:text-cream-100 text-sm transition-colors">
                  support@avvai.in
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <div className="text-primary-200 text-sm">
                  <p>Mon – Sat: 9 AM – 7 PM</p>
                  <p>Sunday: 10 AM – 5 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-primary-300 text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Avvai Iyarkai Agam. All rights reserved.
          </p>
          <p className="text-primary-400 text-xs">
            Pure Food. Naturally Yours. 🌿
          </p>
        </div>
      </div>
    </footer>
  );
}
