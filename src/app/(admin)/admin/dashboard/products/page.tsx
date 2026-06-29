"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Package2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductListItem, CategoryType, VariantFormRow } from "@/types";
import VariantEditor from "@/components/admin/VariantEditor";

interface ProductForm {
  name: string;
  description: string;
  categoryId: string;
  featured: boolean;
  nutritionInfo: string;
  ingredients: string;
  benefits: string;
  tags: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  categoryId: "",
  featured: false,
  nutritionInfo: "",
  ingredients: "",
  benefits: "",
  tags: "",
};

function defaultVariantRow(): VariantFormRow {
  return {
    variantName: "",
    quantityValue: "",
    unit: "GRAM",
    customUnit: "",
    sellingPrice: "",
    costPrice: "",
    stock: "0",
    shippingWeight: "",
    sku: "",
    isDefault: true,
    active: true,
  };
}

function productToVariantRows(product: ProductListItem): VariantFormRow[] {
  if (!product.variants || product.variants.length === 0) {
    return [defaultVariantRow()];
  }
  return product.variants.map((v) => ({
    id: v.id,
    variantName: v.variantName,
    quantityValue: String(v.quantityValue),
    unit: v.unit,
    customUnit: v.customUnit || "",
    sellingPrice: String(v.sellingPrice),
    costPrice: v.costPrice ? String(v.costPrice) : "",
    stock: String(v.stock),
    shippingWeight: String(v.shippingWeight),
    sku: v.sku || "",
    isDefault: v.isDefault,
    active: v.active,
  }));
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductListItem | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [variants, setVariants] = useState<VariantFormRow[]>([defaultVariantRow()]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?limit=100");
      const data = await res.json();
      if (data.success) setProducts(data.data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data || []);
    } catch {
      console.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openAddDialog = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setVariants([defaultVariantRow()]);
    setImageUrls([]);
    setDialogOpen(true);
  };

  const openEditDialog = (product: ProductListItem) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: (product as any).description || "",
      categoryId: product.category.id,
      featured: product.featured,
      nutritionInfo: (product as any).nutritionInfo || "",
      ingredients: (product as any).ingredients || "",
      benefits: (product as any).benefits || "",
      tags: product.tags?.join(", ") || "",
    });
    setVariants(productToVariantRows(product));
    setImageUrls(product.imageUrls || []);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const d = await res.json();
          return d.url;
        })
      );
      setImageUrls((prev) => [...prev, ...uploads.filter(Boolean)]);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }
    for (const v of variants) {
      if (!v.variantName.trim()) {
        toast.error("Variant name is required for all variants");
        return;
      }
      if (!v.sellingPrice || parseFloat(v.sellingPrice) <= 0) {
        toast.error(`Selling price required for variant "${v.variantName || "unknown"}"`);
        return;
      }
      if (!v.shippingWeight || parseFloat(v.shippingWeight) <= 0) {
        toast.error(`Shipping weight required for variant "${v.variantName || "unknown"}"`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        categoryId: form.categoryId,
        imageUrls,
        featured: form.featured,
        nutritionInfo: form.nutritionInfo || null,
        ingredients: form.ingredients || null,
        benefits: form.benefits || null,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        variants,
      };

      let res;
      if (editProduct) {
        res = await fetch(`/api/products/${editProduct.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        toast.success(editProduct ? "Product updated!" : "Product created!");
        setDialogOpen(false);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary-800">Products</h1>
          <p className="text-muted-foreground text-sm">
            Manage your product catalogue with variants
          </p>
        </div>
        <Button
          id="add-product-btn"
          onClick={openAddDialog}
          className="bg-primary-600 hover:bg-primary-700 text-cream-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="product-search"
          placeholder="Search products..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-cream-300">
          <Package2 className="w-12 h-12 text-primary-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term" : "Create your first product"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 border-b border-cream-300">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Variants</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Price Range</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Total Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-cream-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                          {product.imageUrls?.[0] ? (
                            <Image
                              src={product.imageUrls[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package2 className="w-5 h-5 text-primary-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">
                            {product.name}
                          </p>
                          {product.featured && (
                            <span className="text-xs text-amber-600 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.category?.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-medium">
                        {product.variantCount || 0} size{(product.variantCount || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {product.variantCount > 1
                        ? `₹${product.minPrice} – ₹${product.maxPrice}`
                        : `₹${product.minPrice}`}
                    </td>
                    <td className="px-4 py-3">
                      {(product.totalStock || 0) === 0 ? (
                        <span className="text-red-500 font-medium text-xs">Out of Stock</span>
                      ) : (product.totalStock || 0) < 20 ? (
                        <span className="text-orange-500 font-medium text-xs">
                          {product.totalStock} low
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium text-xs">
                          {product.totalStock}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          product.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          id={`edit-product-${product.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(product)}
                          className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          id={`delete-product-${product.id}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(product.slug)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-cream-200">
            <DialogTitle className="font-display text-xl">
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* ── Product Details ──────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-gray-700 text-sm border-b border-cream-300 pb-2">
                Product Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    placeholder="e.g. Organic Groundnut Oil"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product-category">Category *</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v || "" }))}
                  >
                    <SelectTrigger id="product-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  placeholder="Product description..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="product-benefits">Benefits</Label>
                  <Textarea
                    id="product-benefits"
                    placeholder="Health benefits..."
                    value={form.benefits}
                    onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product-ingredients">Ingredients</Label>
                  <Textarea
                    id="product-ingredients"
                    placeholder="Ingredient list..."
                    value={form.ingredients}
                    onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="product-nutrition">Nutrition Info</Label>
                  <Textarea
                    id="product-nutrition"
                    placeholder="Nutrition per 100g..."
                    value={form.nutritionInfo}
                    onChange={(e) => setForm((f) => ({ ...f, nutritionInfo: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="product-tags">Tags</Label>
                  <Input
                    id="product-tags"
                    placeholder="cold-pressed, organic, vegan"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="product-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, featured: !!v }))}
                />
                <Label htmlFor="product-featured">Featured product (Best Seller)</Label>
              </div>
            </section>

            {/* ── Images ───────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm border-b border-cream-300 pb-2">
                Images
              </h3>
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-cream-300">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls((imgs) => imgs.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-cream-400 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                  <span className="text-2xl text-primary-300">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            </section>

            {/* ── Variants ─────────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm border-b border-cream-300 pb-2">
                Variants (sizes, quantities)
              </h3>
              <VariantEditor
                variants={variants}
                onChange={setVariants}
                productBaseSku={
                  editProduct?.variants?.[0]?.sku
                    ? editProduct.variants[0].sku.replace(/-[A-Z]$/, "")
                    : undefined
                }
              />
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-cream-200 bg-cream-50/50">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              id="save-product-btn"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-cream-100"
            >
              {saving ? "Saving..." : editProduct ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
