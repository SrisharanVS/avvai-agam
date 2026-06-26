"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-organic" />

      {/* Organic texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-olive-500/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Grandma Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5 flex justify-center lg:justify-end order-1"
          >
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]">
              <Image
                src="/avvai-grandma-removebg-preview.png"
                alt="Avvai Grandma"
                fill
                priority
                className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.2)] filter saturate-[1.05]"
              />
              
              {/* Subtle background glow under the image */}
              <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-3xl -z-10 scale-90" />
            </div>
          </motion.div>

          {/* Right Column: Text & Content */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start order-2">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 leading-tight"
            >
              Pure Food.
              <br />
              <span className="text-amber-400">Naturally</span> Yours.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-primary-100 text-lg md:text-xl max-w-2xl lg:max-w-none mb-10 leading-relaxed"
            >
              Discover the finest organic groceries, cold-pressed oils, ancient millets,
              and traditional foods sourced directly from certified organic farms.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto"
            >
              <LinkButton
                href="/shop"
                className="bg-amber-400 hover:bg-amber-500 text-primary-900 font-bold text-base h-14 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Shop Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </LinkButton>
              <LinkButton
                href="#categories"
                variant="outline"
                className="border-white/40 text-black hover:bg-white/10 hover:border-white/60 font-semibold text-base h-14 px-8 rounded-2xl backdrop-blur-sm"
              >
                Explore Categories
              </LinkButton>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-14"
            >
              {[
                { icon: ShieldCheck, text: "Certified Organic" },
                { icon: Leaf, text: "No Pesticides" },
                { icon: Sprout, text: "Farm Direct" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
                >
                  <Icon className="w-4 h-4 text-primary-200" />
                  <span className="text-primary-100 text-sm font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 100L60 88.7C120 77.3 240 54.7 360 48C480 41.3 600 50.7 720 55.3C840 60 960 60 1080 56.7C1200 53.3 1320 46.7 1380 43.3L1440 40V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0Z"
            fill="#FAFAF7"
          />
        </svg>
      </div>
    </section >
  );
}
