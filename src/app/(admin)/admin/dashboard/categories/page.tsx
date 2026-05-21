"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { CategoryType } from "@/types";

interface CatForm { name: string; description: string; imageUrl: string; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<CategoryType | null>(null);
  const [form, setForm] = useState<CatForm>({ name: "", description: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch("/api/categories?withCount=true");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openAdd = () => { setEditCat(null); setForm({ name: "", description: "", imageUrl: "" }); setDialogOpen(true); };
  const openEdit = (c: CategoryType) => { setEditCat(c); setForm({ name: c.name, description: c.description || "", imageUrl: c.imageUrl || "" }); setDialogOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) { setForm((p) => ({ ...p, imageUrl: data.url })); toast.success("Image uploaded"); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    const url = editCat ? `/api/categories/${editCat.id}` : "/api/categories";
    const method = editCat ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) {
      toast.success(editCat ? "Category updated" : "Category created");
      setDialogOpen(false);
      fetch_();
    } else toast.error(data.error || "Failed");
    setSaving(false);
  };

  const handleDelete = async (c: CategoryType) => {
    if (!confirm(`Delete "${c.name}"? Products in this category will be affected.`)) return;
    const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Category deleted"); fetch_(); }
    else toast.error("Delete failed");
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-800">Categories</h1>
          <p className="text-muted-foreground mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={openAdd} className="bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-card overflow-hidden group">
              <div className="aspect-video bg-cream-200 relative">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt={c.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-8 h-8 text-primary-200" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 text-sm">{c.name}</h3>
                {c._count && <p className="text-xs text-muted-foreground">{c._count.products} products</p>}
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-7 px-2 text-primary-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(c)} className="h-7 px-2 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Cold Pressed Oils" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="rounded-xl resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Category Image</Label>
              {form.imageUrl && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2">
                  <Image src={form.imageUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <label className="block">
                <div className="px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-center text-muted-foreground hover:border-primary-300 cursor-pointer transition-colors">
                  {uploading ? "Uploading..." : "+ Upload Image"}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-cream-100 rounded-xl">
                {saving ? "Saving..." : editCat ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
