"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    name: "Organic Rice",
    slug: "organic-rice",
    description: "Ancient grain varieties, hand-harvested",
    emoji: "🌾",
    color: "from-amber-100 to-amber-50",
  },
  {
    name: "Millets",
    slug: "millets",
    description: "Nutritious ancient grains, gluten-free",
    emoji: "🌿",
    color: "from-green-100 to-green-50",
  },
  {
    name: "Cold Pressed Oils",
    slug: "cold-pressed-oils",
    description: "Extracted at low temp for max nutrition",
    emoji: "🫙",
    color: "from-yellow-100 to-yellow-50",
  },
  {
    name: "Natural Sweeteners",
    slug: "natural-sweeteners",
    description: "Jaggery, honey, and palm sugar",
    emoji: "🍯",
    color: "from-orange-100 to-orange-50",
  },
  {
    name: "Herbal Products",
    slug: "herbal-products",
    description: "Traditional remedies and wellness",
    emoji: "🌱",
    color: "from-teal-100 to-teal-50",
  },
  {
    name: "Spices",
    slug: "spices",
    description: "Pure, unadulterated aromatic spices",
    emoji: "🌶️",
    color: "from-red-100 to-red-50",
  },
  {
    name: "Dry Fruits",
    slug: "dry-fruits",
    description: "Premium nuts and dried fruits",
    emoji: "🥜",
    color: "from-brown-100 to-stone-50",
  },
  {
    name: "Traditional Foods",
    slug: "traditional-foods",
    description: "Authentic recipes, heritage ingredients",
    emoji: "🍲",
    color: "from-emerald-100 to-emerald-50",
  },
  {
    name: "Pulses",
    slug: "pulses",
    description: "Protein-rich legumes, naturally grown",
    emoji: "🫘",
    color: "from-lime-100 to-lime-50",
  },
  {
    name: "Snacks",
    slug: "snacks",
    description: "Healthy, guilt-free traditional snacks",
    emoji: "🥨",
    color: "from-violet-100 to-violet-50",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function CategoriesSection() {
  return (
    <section id="categories" className="section-padding bg-cream-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-olive-600 font-medium text-sm uppercase tracking-widest mb-3">
            Browse by Category
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-800 mb-4">
            Nature's Pantry
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            From ancient grains to cold-pressed oils — everything you need for a 
            naturally healthy lifestyle.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.slug} variants={cardVariants}>
              <Link
                href={`/shop?category=${cat.slug}`}
                className={`group flex flex-col items-center p-5 bg-gradient-to-br ${cat.color} rounded-2xl border border-white/60 hover:border-primary-200 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 text-center`}
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {cat.emoji}
                </span>
                <h3 className="font-semibold text-primary-800 text-sm leading-tight mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 leading-snug hidden sm:block">
                  {cat.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-900 transition-colors group"
          >
            View All Products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
