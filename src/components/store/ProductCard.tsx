"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Star, Leaf, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { ProductListItem } from "@/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: ProductListItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const discountPercent =
    product.discountedPrice && product.price > 0
      ? Math.round(
          ((product.price - product.discountedPrice) / product.price) * 100
        )
      : null;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountedPrice: product.discountedPrice,
      imageUrl: product.imageUrls[0] || "",
      weight: product.weight,
      quantity: 1,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart!`, {
      description: "Check your cart to checkout.",
    });
  };

  const isOutOfStock = product.stock === 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-cream-200 overflow-hidden">
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-12 h-12 text-primary-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercent && discountPercent > 0 && (
            <Badge className="bg-amber-400 text-primary-900 font-bold text-xs px-2 py-0.5">
              -{discountPercent}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="bg-primary-600 text-cream-100 text-xs px-2 py-0.5">
              ⭐ Best Seller
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <p className="text-xs text-olive-500 font-medium uppercase tracking-wide">
            {product.category.name}
          </p>
        </div>

        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-gray-800 hover:text-primary-700 transition-colors line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {product.weight && (
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {product.weight}
          </p>
        )}

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-gray-700">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            {product.discountedPrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-primary-700">
                  ₹{product.discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary-700">
                ₹{product.price.toFixed(2)}
              </span>
            )}
          </div>

          <Button
            id={`add-to-cart-${product.id}`}
            size="sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl shrink-0 transition-all active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
