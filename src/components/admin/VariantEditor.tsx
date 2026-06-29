"use client";

import { Plus, Trash2, Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductUnit, PRODUCT_UNIT_LABELS, VariantFormRow } from "@/types";
import { generateVariantSKU } from "@/lib/utils";

interface VariantEditorProps {
  variants: VariantFormRow[];
  onChange: (variants: VariantFormRow[]) => void;
  productBaseSku?: string; // e.g. "PROD-000001" for auto-SKU generation
}

const UNITS: ProductUnit[] = ["GRAM", "KILOGRAM", "MILLILITRE", "LITRE", "CUSTOM"];

function blankVariant(index: number, productBaseSku?: string): VariantFormRow {
  return {
    variantName: "",
    quantityValue: "",
    unit: "GRAM",
    customUnit: "",
    sellingPrice: "",
    costPrice: "",
    stock: "0",
    shippingWeight: "",
    sku: productBaseSku ? generateVariantSKU(productBaseSku, index) : "",
    isDefault: index === 0,
    active: true,
  };
}

export default function VariantEditor({
  variants,
  onChange,
  productBaseSku,
}: VariantEditorProps) {
  const updateVariant = (index: number, field: keyof VariantFormRow, value: unknown) => {
    const updated = variants.map((v, i) => (i === index ? { ...v, [field]: value } : v));
    onChange(updated);
  };

  const addVariant = () => {
    onChange([...variants, blankVariant(variants.length, productBaseSku)]);
  };

  const duplicateVariant = (index: number) => {
    const src = variants[index];
    const dupe: VariantFormRow = {
      ...src,
      id: undefined, // new row — no id
      variantName: `${src.variantName} (copy)`,
      sku: productBaseSku
        ? generateVariantSKU(productBaseSku, variants.length)
        : "",
      isDefault: false,
    };
    onChange([...variants, dupe]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return; // must have at least 1
    const updated = variants.filter((_, i) => i !== index);
    // Ensure one is still default
    if (!updated.some((v) => v.isDefault)) {
      updated[0].isDefault = true;
    }
    onChange(updated);
  };

  const setDefault = (index: number) => {
    onChange(variants.map((v, i) => ({ ...v, isDefault: i === index })));
  };

  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="hidden lg:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-3 pb-1 border-b border-cream-300">
        <div className="col-span-2">Variant Name</div>
        <div className="col-span-1">Qty</div>
        <div className="col-span-2">Unit</div>
        <div className="col-span-1">Price (₹)</div>
        <div className="col-span-1">Cost (₹)</div>
        <div className="col-span-1">Stock</div>
        <div className="col-span-1">Ship Wt (kg)</div>
        <div className="col-span-2">SKU</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Variant rows */}
      {variants.map((variant, index) => (
        <div
          key={index}
          className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
            variant.isDefault
              ? "border-primary-400 bg-primary-50"
              : "border-cream-300 bg-white"
          }`}
        >
          {/* Mobile label */}
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <span className="text-sm font-semibold text-gray-700">
              Variant {index + 1}
              {variant.isDefault && (
                <span className="ml-2 text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {!variant.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(index)}
                  title="Set as default"
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => duplicateVariant(index)}
                title="Duplicate"
                className="p-1.5 rounded-lg hover:bg-cream-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  title="Remove"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:grid grid-cols-12 gap-2 items-start">
            {/* Variant Name */}
            <div className="col-span-2">
              <Input
                id={`variant-name-${index}`}
                placeholder="e.g. 500 ml"
                value={variant.variantName}
                onChange={(e) => updateVariant(index, "variantName", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {/* Quantity Value */}
            <div className="col-span-1">
              <Input
                id={`variant-qty-${index}`}
                type="number"
                placeholder="500"
                value={variant.quantityValue}
                onChange={(e) => updateVariant(index, "quantityValue", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {/* Unit */}
            <div className="col-span-2">
              <div className="space-y-1">
                <Select
                  value={variant.unit}
                  onValueChange={(v) => updateVariant(index, "unit", v as ProductUnit)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {PRODUCT_UNIT_LABELS[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {variant.unit === "CUSTOM" && (
                  <Input
                    placeholder="e.g. Bottles"
                    value={variant.customUnit}
                    onChange={(e) => updateVariant(index, "customUnit", e.target.value)}
                    className="h-8 text-xs"
                  />
                )}
              </div>
            </div>
            {/* Selling Price */}
            <div className="col-span-1">
              <Input
                id={`variant-price-${index}`}
                type="number"
                placeholder="299"
                value={variant.sellingPrice}
                onChange={(e) => updateVariant(index, "sellingPrice", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {/* Cost Price */}
            <div className="col-span-1">
              <Input
                type="number"
                placeholder="180"
                value={variant.costPrice}
                onChange={(e) => updateVariant(index, "costPrice", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {/* Stock */}
            <div className="col-span-1">
              <Input
                id={`variant-stock-${index}`}
                type="number"
                placeholder="100"
                value={variant.stock}
                onChange={(e) => updateVariant(index, "stock", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {/* Shipping Weight */}
            <div className="col-span-1">
              <Input
                id={`variant-weight-${index}`}
                type="number"
                step="0.001"
                placeholder="0.5"
                value={variant.shippingWeight}
                onChange={(e) => updateVariant(index, "shippingWeight", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            {/* SKU */}
            <div className="col-span-2">
              <Input
                placeholder="PROD-000001-A"
                value={variant.sku}
                onChange={(e) => updateVariant(index, "sku", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </div>
            {/* Desktop actions */}
            <div className="col-span-1 flex items-center gap-1 pt-0.5">
              {!variant.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(index)}
                  title="Set as default"
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              {variant.isDefault && (
                <span title="Default variant" className="p-1.5 text-primary-500">
                  <Star className="w-4 h-4 fill-primary-400" />
                </span>
              )}
              <button
                type="button"
                onClick={() => duplicateVariant(index)}
                title="Duplicate"
                className="p-1.5 rounded-lg hover:bg-cream-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  title="Remove"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile layout — stacked form */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-gray-500">Variant Name *</Label>
              <Input
                placeholder="e.g. 500 ml"
                value={variant.variantName}
                onChange={(e) => updateVariant(index, "variantName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Quantity Value</Label>
              <Input
                type="number"
                placeholder="500"
                value={variant.quantityValue}
                onChange={(e) => updateVariant(index, "quantityValue", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Unit</Label>
              <Select
                value={variant.unit}
                onValueChange={(v) => updateVariant(index, "unit", v as ProductUnit)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {PRODUCT_UNIT_LABELS[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {variant.unit === "CUSTOM" && (
                <Input
                  placeholder="e.g. Bottles"
                  value={variant.customUnit}
                  onChange={(e) => updateVariant(index, "customUnit", e.target.value)}
                  className="mt-1"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Price (₹) *</Label>
              <Input
                type="number"
                placeholder="299"
                value={variant.sellingPrice}
                onChange={(e) => updateVariant(index, "sellingPrice", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Cost (₹)</Label>
              <Input
                type="number"
                placeholder="180"
                value={variant.costPrice}
                onChange={(e) => updateVariant(index, "costPrice", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Stock</Label>
              <Input
                type="number"
                placeholder="100"
                value={variant.stock}
                onChange={(e) => updateVariant(index, "stock", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Ship Wt (kg) *</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.5"
                value={variant.shippingWeight}
                onChange={(e) => updateVariant(index, "shippingWeight", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-gray-500">SKU</Label>
              <Input
                placeholder="PROD-000001-A"
                value={variant.sku}
                onChange={(e) => updateVariant(index, "sku", e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="w-full border-dashed border-2 border-primary-300 text-primary-700 hover:bg-primary-50 h-11"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </Button>

      <p className="text-xs text-muted-foreground">
        ⭐ = Default variant shown on product card. Shipping weight is per unit in kg (e.g. 0.5 for 500g). 
        Use ceil(total weight) for billing — e.g. 0.75 kg → charges for 1 kg.
      </p>
    </div>
  );
}
