"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setSubscribed(true);
        setEmail("");
        toast.success("You're subscribed! 🌿", {
          description: "Expect organic goodness in your inbox.",
        });
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-padding bg-primary-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary-600/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-olive-600/20 rounded-full blur-3xl" />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-cream-200" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-cream-100 mb-4">
            Stay Naturally Informed
          </h2>
          <p className="text-primary-200 text-lg mb-8 leading-relaxed">
            Get seasonal product launches, healthy recipes, farming stories, 
            and exclusive member discounts delivered to your inbox.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-3 bg-primary-700 rounded-2xl px-8 py-5">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <p className="text-cream-100 font-medium">
                You're all set! Welcome to the Avvai community 🌿
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                id="newsletter-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-14 text-base bg-primary-700 border-primary-600 text-cream-100 placeholder:text-primary-300 rounded-2xl focus-visible:ring-amber-400"
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-14 px-8 bg-amber-400 hover:bg-amber-500 text-primary-900 font-bold rounded-2xl whitespace-nowrap"
              >
                {loading ? "Subscribing..." : (
                  <>Subscribe <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>
          )}

          <p className="text-primary-400 text-xs mt-4">
            No spam, ever. Unsubscribe anytime. By subscribing, you agree to our Privacy Policy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
