"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  FlaskConical,
  Tractor,
  Truck,
  Package,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "100% Organic",
    description: "All our products are certified organic with zero synthetic pesticides or fertilizers.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: FlaskConical,
    title: "No Chemicals",
    description: "Absolutely no artificial additives, preservatives, or chemical treatments.",
    color: "bg-red-50 text-red-500",
  },
  {
    icon: Tractor,
    title: "Sustainable Farming",
    description: "We partner with farmers who practice regenerative and sustainable agriculture.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Truck,
    title: "Farm Direct",
    description: "Products sourced directly from certified organic farms, no middlemen.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Package,
    title: "Fresh Packaging",
    description: "Eco-friendly packaging designed to preserve freshness and reduce waste.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Heart,
    title: "Trusted by Families",
    description: "Over 10,000 families choose Avvai for their daily nutritional needs.",
    color: "bg-pink-50 text-pink-600",
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="section-padding bg-cream-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-olive-600 font-medium text-sm uppercase tracking-widest mb-3">
            Why Avvai?
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-800 mb-4">
            The Avvai Promise
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            We believe healthy living begins with honest food. Here's what sets us apart.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-7 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
