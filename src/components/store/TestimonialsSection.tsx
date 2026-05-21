"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Suresh",
    location: "Chennai",
    rating: 5,
    text: "I switched to Avvai's cold-pressed oils 6 months ago and I can genuinely feel the difference. The coconut oil is pure and fragrant — just like what my grandmother used to make.",
    initials: "PS",
  },
  {
    name: "Karthik Raman",
    location: "Coimbatore",
    rating: 5,
    text: "The millet variety pack is absolutely amazing. My kids actually enjoy eating ragi porridge now! The quality is unmatched and delivery is always prompt.",
    initials: "KR",
  },
  {
    name: "Deepa Nair",
    location: "Bangalore",
    rating: 5,
    text: "Finally found a trustworthy source for organic jaggery and spices. The turmeric powder has that deep golden color and smell that shows it's pure. Highly recommend!",
    initials: "DN",
  },
  {
    name: "Arun Kumar",
    location: "Madurai",
    rating: 5,
    text: "Been using Avvai for a year now. The organic rice varieties are exceptional — the traditional Mappillai Samba rice especially. My entire family has gone back to traditional grains.",
    initials: "AK",
  },
  {
    name: "Sangeetha Murugan",
    location: "Tiruppur",
    rating: 5,
    text: "The dry fruits and nuts are always fresh and of great quality. I love that everything is naturally sourced without any additives. Will keep ordering!",
    initials: "SM",
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  const t = testimonials[current];

  return (
    <section className="section-padding bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-olive-600 font-medium text-sm uppercase tracking-widest mb-3">
            What Our Customers Say
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-800">
            Loved by Families
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="bg-cream-100 rounded-3xl p-8 md:p-12 text-center relative"
            >
              <Quote className="w-10 h-10 text-primary-200 mx-auto mb-6" />

              <div className="flex justify-center mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-8 italic max-w-2xl mx-auto">
                "{t.text}"
              </p>

              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-cream-100 font-bold text-sm">
                  {t.initials}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-primary-800">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-primary-300 text-primary-600 flex items-center justify-center hover:bg-primary-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-primary-600" : "bg-primary-200"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-primary-300 text-primary-600 flex items-center justify-center hover:bg-primary-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
