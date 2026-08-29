import Link from "next/link";
import { FileText, CheckCircle2, UserCheck, PackageCheck, CreditCard, Truck, RotateCcw, ShieldAlert, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions | Avvai Organics",
  description: "Read the Terms and Conditions governing your use of Avvai Organics services and website.",
};

export default function TermsAndConditionsPage() {
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
              <FileText className="w-6 h-6 text-cream-200" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Terms & Conditions
            </h1>
          </div>
          <p className="text-primary-200 text-base md:text-lg max-w-2xl leading-relaxed">
            Welcome to Avvai Organics. Please read these terms carefully before using our website and services.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-cream-300 shadow-card p-6 md:p-10 space-y-10">
          {/* Welcome Intro */}
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 text-primary-800 text-sm md:text-base leading-relaxed">
            Welcome to Avvai Organics. By accessing or using our website (<span className="font-medium">www.avvaiorganics.com</span>), you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our services.
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                Acceptance of Terms
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed pl-11">
              By accessing this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, along with our Privacy Policy. If you do not agree with any part of these terms, please refrain from using our website.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                Eligibility
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed pl-11">
              To use our website and services, you must be at least 18 years old or have the consent of a parent or guardian. By using our site, you represent that you meet this requirement.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                Product Information
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed pl-11">
              We strive to provide accurate descriptions and images of our organic products. However, we do not warrant that product descriptions, images, or other content on the site are accurate, complete, reliable, current, or error-free. All products are subject to availability, and we reserve the right to discontinue any product at any time.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                4
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                Orders and Payments
              </h2>
            </div>
            <div className="pl-11 space-y-3">
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                <h3 className="font-semibold text-primary-900 text-sm mb-1">Order Acceptance</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                <h3 className="font-semibold text-primary-900 text-sm mb-1">Pricing</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Prices for our products are subject to change without notice. We are not responsible for typographical errors in pricing or product descriptions.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                <h3 className="font-semibold text-primary-900 text-sm mb-1">Payment</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  We accept payments through credit/debit cards, UPI, net banking, and secure payment gateways. By providing payment information, you represent and warrant that you have the legal right to use the payment method.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                5
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                Shipping and Delivery
              </h2>
            </div>
            <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-cream-100 border border-cream-200">
                <h3 className="font-semibold text-primary-800 text-sm mb-1">Processing Time</h3>
                <p className="text-xs text-gray-600">
                  Orders are typically processed within 1-2 business days (Within Tamil Nadu) and extra 1 or 2 days (Outside Tamil Nadu).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-100 border border-cream-200">
                <h3 className="font-semibold text-primary-800 text-sm mb-1">Delivery Time</h3>
                <p className="text-xs text-gray-600">
                  Estimated delivery times are provided at checkout and may vary based on location.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-100 border border-cream-200">
                <h3 className="font-semibold text-primary-800 text-sm mb-1">Shipping Charges</h3>
                <p className="text-xs text-gray-600">
                  Shipping fees are calculated at checkout based on your delivery address and order weight.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-100 border border-cream-200">
                <h3 className="font-semibold text-primary-800 text-sm mb-1">Delays</h3>
                <p className="text-xs text-gray-600">
                  We are not responsible for delays caused by carriers or unforeseen circumstances.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                6
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                Intellectual Property
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed pl-11">
              All content on this website, including text, graphics, logos, images, and software, is the property of Avvai Organics and is protected by applicable intellectual property laws. Unauthorized use of any content is prohibited.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center font-semibold text-sm">
                7
              </div>
              <h2 className="font-display text-xl font-bold text-primary-800">
                User Conduct
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed pl-11 mb-2">
              You agree not to:
            </p>
            <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                "Use the website for any unlawful purpose.",
                "Attempt to gain unauthorized access to any portion of the website.",
                "Interfere with or disrupt the website or servers.",
                "Upload or transmit viruses or any other harmful code.",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-red-50/50 border border-red-100 text-xs md:text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
