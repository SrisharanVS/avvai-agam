"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { ProductListItem, CategoryType } from "@/types";

interface ProductForm {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  discountedPrice: string;
  stock: string;
  weight: string;
  featured: boolean;
  nutritionInfo: string;
  ingredients: string;
  benefits: string;
  tags: string;
}

const emptyForm: ProductForm = {
  name: "", description: "", categoryId: "", price: "",
  discountedPrice: "", stock: "0", weight: "", featured: false,
  nutritionInfo: "", ingredients: "", benefits: "", tags: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductListItem | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", ...(search && { search }) });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    if (data.success) setProducts(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImageUrls([]);
    setDialogOpen(true);
  };

  const openEdit = (p: ProductListItem) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: "", categoryId: p.category.id,
      price: String(p.price), discountedPrice: String(p.discountedPrice || ""),
      stock: String(p.stock), weight: p.weight || "", featured: p.featured,
      nutritionInfo: "", ingredients: "", benefits: "", tags: p.tags?.join(", ") || "",
    });
    setImageUrls(p.imageUrls || []);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) uploadedUrls.push(data.url);
      }
      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId || !form.price) {
      toast.error("Name, category, and price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId,
        price: parseFloat(form.price),
        discountedPrice: form.discountedPrice ? parseFloat(form.discountedPrice) : null,
        stock: parseInt(form.stock),
        weight: form.weight,
        featured: form.featured,
        nutritionInfo: form.nutritionInfo,
        ingredients: form.ingredients,
        benefits: form.benefits,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        imageUrls,
      };

      const url = editProduct ? `/api/products/${editProduct.slug}` : "/api/products";
      const method = editProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editProduct ? "Product updated" : "Product created");
        setDialogOpen(false);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ProductListItem) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const res = await fetch(`/api/products/${p.slug}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      toast.success("Product deleted");
      fetchProducts();
    } else {
      toast.error("Delete failed");
    }
  };

  const F = (key: keyof ProductForm) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Products</h1>
          <p className="text-muted-foreground mt-1">{products.length} products total</p>
        </div>
        <Button id="add-product-btn" onClick={openAdd} className="bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-gray-200"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Stock</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                          {p.imageUrls[0] ? (
                            <Image src={p.imageUrls[0]} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-primary-200" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                          {p.weight && <p className="text-xs text-muted-foreground">{p.weight}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category.name}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-primary-700">₹{p.price.toFixed(0)}</p>
                      {p.discountedPrice && (
                        <p className="text-xs text-muted-foreground line-through">₹{p.discountedPrice.toFixed(0)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${p.stock <= 10 ? "text-red-600" : "text-gray-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {p.featured && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs gap-1">
                            <Star className="w-2.5 h-2.5" /> Featured
                          </Badge>
                        )}
                        {p.stock === 0 && (
                          <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="text-primary-600 hover:text-primary-800">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No products found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Product Name *</Label>
                <Input placeholder="e.g., Organic Coconut Oil" {...F("name")} className="rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label>Category *</Label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Weight/Quantity</Label>
                <Input placeholder="e.g., 500ml, 1kg" {...F("weight")} className="rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label>Price (₹) *</Label>
                <Input type="number" placeholder="299" {...F("price")} className="rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label>Discounted Price (₹)</Label>
                <Input type="number" placeholder="249" {...F("discountedPrice")} className="rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label>Stock Quantity</Label>
                <Input type="number" placeholder="100" {...F("stock")} className="rounded-xl" />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                  className="accent-primary-600 w-4 h-4"
                />
                <Label htmlFor="featured" className="cursor-pointer">Mark as Featured / Best Seller</Label>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Product description..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Health Benefits</Label>
                <Textarea
                  placeholder="Benefits..."
                  value={form.benefits}
                  onChange={(e) => setForm((p) => ({ ...p, benefits: e.target.value }))}
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ingredients</Label>
                <Textarea
                  placeholder="Ingredients..."
                  value={form.ingredients}
                  onChange={(e) => setForm((p) => ({ ...p, ingredients: e.target.value }))}
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input placeholder="organic, cold-pressed, vegan" {...F("tags")} className="rounded-xl" />
              </div>

              {/* Image Upload */}
              <div className="col-span-2 space-y-2">
                <Label>Product Images</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button
                        onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-muted-foreground hover:border-primary-400 hover:text-primary-600 transition-colors">
                    {uploading ? "Uploading..." : "+ Upload Images"}
                  </div>
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
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl">
                {saving ? "Saving..." : editProduct ? "Update Product" : "Create Product"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
