import type { Metadata } from "next";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

export const metadata: Metadata = {
  title: "Avvai — Pure Food. Naturally Yours.",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
