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
      return data.data;
    }
    return [];
  }, []);

  const renderItem = (product: any) => (
    <div className="flex flex-col">
      <span className="font-semibold text-gray-800">{product.name}</span>
      <span className="text-xs font-mono text-muted-foreground">{product.sku || "NO-SKU"}</span>
    </div>
  );

  const getDisplayValue = (product: any) => product.name;

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
