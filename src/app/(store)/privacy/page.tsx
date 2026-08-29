import Metadata from "next";
import Link from "next/link";
import { ShieldCheck, Lock, UserCheck, Eye, RefreshCw, Mail, Phone, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Avvai Organics",
  description: "Learn how Avvai Organics collects, uses, and safeguards your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream-100 pt-20">
      {/* Header Banner */}
      <div className="bg-primary-800 text-white py-14 border-b border-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary-200 hover:text-cream-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-primary-300">
              <ShieldCheck className="w-6 h-6 text-cream-200" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Privacy Policy
            </h1>
          </div>
          <p className="text-primary-200 text-base md:text-lg max-w-2xl leading-relaxed">
            At Avvai Organics, we value your privacy and are committed to protecting your personal information.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-cream-300 shadow-card p-6 md:p-10 space-y-10">
          {/* Intro paragraph */}
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 text-primary-800 text-sm md:text-base leading-relaxed">
            This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or make a purchase with Avvai Organics.
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                <UserCheck className="w-4 h-4" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                1. Information We Collect
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              When you visit our site, place an order, or contact us, we may collect information such as:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                "Your name, address, phone number, and email address",
                "Billing and shipping information",
                "Payment details (processed securely)",
                "Information related to your browsing behavior on our website (for improving user experience)",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-cream-100 border border-cream-200 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                <Eye className="w-4 h-4" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                2. How We Use Your Information
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              We use your information for the following core purposes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { title: "Order Fulfillment", desc: "Process and fulfill your orders efficiently" },
                { title: "Communication", desc: "Communicate with you regarding orders, promotions, or updates" },
                { title: "Service Improvement", desc: "Improve our website, products, and services" },
                { title: "Promotions (Opt-in)", desc: "Send you promotional offers (only if you opt in)" },
              ].map((card, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                  <h3 className="font-semibold text-primary-800 text-sm mb-1">{card.title}</h3>
                  <p className="text-xs text-gray-600">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                3. Protection of Your Information
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                4. Sharing of Information
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties.
            </p>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Your information is shared only with trusted partners who assist us in operating our website, processing payments, and delivering your products, all under strict confidentiality agreements.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                5. Changes to This Policy
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
            </p>
          </section>

          {/* Section 6 - Contact */}
          <section className="pt-6 border-t border-cream-200">
            <h2 className="font-display text-xl font-bold text-primary-800 mb-4">
              6. Contact Us
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
              If you have any questions or concerns about our Privacy Policy, please feel free to contact us:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:avvaiorganics@gmail.com"
                className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-300 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email Us</p>
                  <p className="text-sm font-medium text-primary-900 group-hover:underline">
                    support@avvai.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+919842993000"
                className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-300 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Call Us</p>
                  <p className="text-sm font-medium text-primary-900 group-hover:underline">
                    +91 98429 93000
                  </p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
