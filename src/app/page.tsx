import type { Metadata } from "next";
import HeroSection from "@/components/store/HeroSection";
import CategoriesSection from "@/components/store/CategoriesSection";
import BestSellersSection from "@/components/store/BestSellersSection";
import WhyChooseUs from "@/components/store/WhyChooseUs";
import TestimonialsSection from "@/components/store/TestimonialsSection";
import FarmStorySection from "@/components/store/FarmStorySection";
import NewsletterSection from "@/components/store/NewsletterSection";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

export const metadata: Metadata = {
  title: "Avvai — Pure Food. Naturally Yours.",
  description:
    "Shop 100% organic, chemical-free groceries, cold-pressed oils, millets, spices, and traditional foods directly from certified organic farms.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <BestSellersSection />
        <WhyChooseUs />
        <TestimonialsSection />
        <FarmStorySection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
