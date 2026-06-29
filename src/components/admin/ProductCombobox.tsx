"use client";

import React, { useCallback } from "react";
import { AutocompleteCombobox } from "@/components/ui/AutocompleteCombobox";

interface ProductComboboxProps {
  value?: string;
  onSelect: (product: any) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProductCombobox({
  value = "",
  onSelect,
  onCreateNew,
  placeholder = "Search product by SKU or name...",
  className = "",
}: ProductComboboxProps) {
  const handleSearch = useCallback(async (query: string) => {
    const res = await fetch(`/api/products?limit=50&search=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success) {
      const items: any[] = [];
      data.data.forEach((p: any) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any) => {
            const hasMultipleVariants = p.variants.length > 1 || v.variantName !== "Default";
            items.push({
              id: p.id,
              variantId: v.id,
              name: hasMultipleVariants ? `${p.name} — ${v.variantName}` : p.name,
              sku: v.sku,
              price: v.sellingPrice,
              costPrice: v.costPrice ?? 0,
              unit: v.customUnit || v.unit || "units",
              defaultTaxRate: p.defaultTaxRate,
              description: p.description,
            });
          });
        } else {
          items.push({
            id: p.id,
            variantId: null,
            name: p.name,
            sku: null,
            price: 0,
            costPrice: 0,
            unit: "units",
            defaultTaxRate: p.defaultTaxRate,
            description: p.description,
          });
        }
      });
      return items;
    }
    return [];
  }, []);

  const renderItem = (item: any) => (
    <div className="flex flex-col">
      <span className="font-semibold text-gray-800">{item.name}</span>
      <span className="text-xs font-mono text-muted-foreground">{item.sku || "NO-SKU"}</span>
    </div>
  );

  const getDisplayValue = (item: any) => item.name;

  return (
    <AutocompleteCombobox
      placeholder={placeholder}
      value={value}
      onSelect={onSelect}
      onSearch={handleSearch}
      renderItem={renderItem}
      getDisplayValue={getDisplayValue}
      onCreateNew={onCreateNew}
      createLabel="Create Product"
      className={className}
    />
  );
}
