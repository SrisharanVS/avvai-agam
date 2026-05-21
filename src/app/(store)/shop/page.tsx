"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/store/ProductCard";
import { ProductListItem, CategoryType } from "@/types";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const categoryParam = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "newest";

  const [search, setSearch] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sort, setSort] = useState(sortParam);

  const LIMIT = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        page: page.toString(),
        sort,
        ...(selectedCategory && { category: selectedCategory }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, selectedCategory, search]);

  useEffect(() => {
    fetch("/api/categories?withCount=true")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSort("newest");
    setPage(1);
  };

  const hasFilters = search || selectedCategory || sort !== "newest";

  return (
    <div className="min-h-screen bg-cream-100 pt-20">
      {/* Header */}
      <div className="bg-primary-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Organic Shop
          </h1>
          <p className="text-primary-200">
            {total > 0 ? `${total} organic products` : "Discover natural goodness"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="shop-search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-11 bg-white border-cream-400 rounded-xl"
            />
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v as string); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-52 h-11 bg-white border-cream-400 rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 border-cream-400 rounded-xl gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Category filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-6 p-4 bg-white rounded-2xl border border-cream-300"
          >
            <p className="text-sm font-semibold text-gray-700 mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory(""); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory
                    ? "bg-primary-600 text-cream-100"
                    : "bg-cream-200 text-gray-600 hover:bg-cream-300"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.slug
                      ? "bg-primary-600 text-cream-100"
                      : "bg-cream-200 text-gray-600 hover:bg-cream-300"
                  }`}
                >
                  {cat.name}
                  {cat._count && (
                    <span className="ml-1.5 opacity-60">({cat._count.products})</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active filters */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategory && (
              <Badge className="gap-1 bg-primary-100 text-primary-700 cursor-pointer" onClick={() => setSelectedCategory("")}>
                {selectedCategory} <X className="w-3 h-3" />
              </Badge>
            )}
            {search && (
              <Badge className="gap-1 bg-primary-100 text-primary-700 cursor-pointer" onClick={() => setSearch("")}>
                "{search}" <X className="w-3 h-3" />
              </Badge>
            )}
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline">
              Clear all
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / LIMIT)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / LIMIT)}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-24 text-center gap-4">
            <div className="text-6xl">🌿</div>
            <p className="text-xl font-display font-bold text-primary-700">No products found</p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters.
            </p>
            <Button onClick={clearFilters} className="bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
