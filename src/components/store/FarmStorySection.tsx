"use client";

import { motion } from "framer-motion";
import { Leaf, Sun, Droplets } from "lucide-react";
import Link from "next/link";

export default function FarmStorySection() {
  return (
    <section id="about" className="section-padding overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-primary-600 to-olive-600">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-9xl mb-4">🌾</div>
                  <p className="font-display text-2xl font-bold opacity-80">
                    From Our Farms
                  </p>
                </div>
              </div>
            </div>
            {/* Floating cards */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-card-hover p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-primary-800 text-sm">Sun-Grown</p>
                <p className="text-xs text-muted-foreground">Natural ripening</p>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-card-hover p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-primary-800 text-sm">Rain-Fed</p>
                <p className="text-xs text-muted-foreground">No bore wells</p>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-olive-600 font-medium text-sm uppercase tracking-widest mb-4">
              Our Story
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-800 mb-6 leading-tight">
              Where Food Meets
              <span className="text-gradient block">Ancient Wisdom</span>
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed mb-8">
              <p>
                Avvai was born from a simple belief — that the food our grandparents 
                ate was the healthiest food in the world. Named after the revered Tamil 
                poet-sage Avvaiyar, who celebrated the virtues of natural living, we 
                honour that legacy through every product we offer.
              </p>
              <p>
                We work directly with small-scale organic farmers across Tamil Nadu 
                and South India, supporting traditional and regenerative farming practices 
                that have sustained communities for generations.
              </p>
              <p>
                Every product on our platform is tested, verified, and sourced with 
                full transparency — because you deserve to know exactly what goes 
                into your body.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 mb-8">
              {[
                { value: "10,000+", label: "Happy Families" },
                { value: "200+", label: "Organic Products" },
                { value: "50+", label: "Partner Farmers" },
              ].map((stat) => (
                <div key={stat.label} className="bg-cream-200 rounded-2xl px-6 py-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary-700">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold px-8 py-3 rounded-2xl transition-all hover:scale-105 shadow-organic"
            >
              <Leaf className="w-4 h-4" />
              Explore Our Products
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
