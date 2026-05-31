"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart, Star, Leaf, Tag, ChevronLeft,
  Shield, Truck, RefreshCw, Minus, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import ProductCard from "@/components/store/ProductCard";
import { ProductListItem } from "@/types";

interface ProductDetailData extends ProductListItem {
  description: string | null;
  nutritionInfo: string | null;
  ingredients: string | null;
  benefits: string | null;
  tags: string[];
  related?: ProductListItem[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProduct(d.data);
          setSelectedImage(0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountedPrice: product.discountedPrice,
      imageUrl: product.imageUrls[0] || "",
      weight: product.weight,
      quantity: qty,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 bg-cream-100 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🌿</div>
        <h2 className="text-2xl font-display font-bold text-primary-700 mb-2">Product Not Found</h2>
        <Link href="/shop" className="text-primary-600 hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const price = product.discountedPrice ?? product.price;
  const discount =
    product.discountedPrice
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : null;

  return (
    <div className="min-h-screen pt-20 bg-cream-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary-700">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary-700">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary-700">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-primary-700 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-cream-200 mb-3">
              {product.imageUrls[selectedImage] ? (
                <Image
                  src={product.imageUrls[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-20 h-20 text-primary-200" />
                </div>
              )}
              {discount && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-amber-400 text-primary-900 font-bold text-sm px-3 py-1">
                    -{discount}% OFF
                  </Badge>
                </div>
              )}
            </div>
            {product.imageUrls.length > 1 && (
              <div className="flex gap-2">
                {product.imageUrls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? "border-primary-600" : "border-transparent"
                      }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <p className="text-olive-600 text-sm font-medium mb-2">{product.category.name}</p>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-800 leading-tight">
                {product.name}
              </h1>
            </div>

            {product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary-700">₹{price.toFixed(2)}</span>
              {product.discountedPrice && (
                <span className="text-xl text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
              )}
            </div>

            {product.weight && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                {product.weight}
              </div>
            )}

            {/* Stock */}
            <div>
              {product.stock > 10 ? (
                <Badge className="bg-green-100 text-green-700 font-medium">✓ In Stock</Badge>
              ) : product.stock > 0 ? (
                <Badge className="bg-orange-100 text-orange-700 font-medium">
                  Only {product.stock} left
                </Badge>
              ) : (
                <Badge variant="secondary">Out of Stock</Badge>
              )}
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-cream-400 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-cream-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  className="w-10 h-11 flex items-center justify-center text-gray-600 hover:bg-cream-200 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                id={`add-to-cart-detail-${product.id}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 h-11 bg-primary-600 hover:bg-primary-700 text-cream-100 font-semibold rounded-xl"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-olive-50 text-olive-700 px-3 py-1 rounded-full border border-olive-200">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="bg-cream-200 p-1 rounded-xl">
              <TabsTrigger value="description" className="rounded-lg">Description</TabsTrigger>
              <TabsTrigger value="benefits" className="rounded-lg">Benefits</TabsTrigger>
              <TabsTrigger value="nutrition" className="rounded-lg">Nutrition</TabsTrigger>
              <TabsTrigger value="ingredients" className="rounded-lg">Ingredients</TabsTrigger>
            </TabsList>
            {[
              { value: "description", content: product.description },
              { value: "benefits", content: product.benefits },
              { value: "nutrition", content: product.nutritionInfo },
              { value: "ingredients", content: product.ingredients },
            ].map(({ value, content }) => (
              <TabsContent key={value} value={value} className="mt-6 bg-white rounded-2xl p-6">
                {content ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
                ) : (
                  <p className="text-muted-foreground italic">Information not available.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Related Products */}
        {product.related && product.related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-3xl font-bold text-primary-800 mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {product.related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
