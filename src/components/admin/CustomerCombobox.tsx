"use client";

import React, { useCallback } from "react";
import { AutocompleteCombobox } from "@/components/ui/AutocompleteCombobox";

interface CustomerComboboxProps {
  value?: string;
  onSelect: (customer: any) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerCombobox({
  value = "",
  onSelect,
  onCreateNew,
  placeholder = "Search customer by ID, name, or phone...",
  className = "",
}: CustomerComboboxProps) {
  const handleSearch = useCallback(async (query: string) => {
    const res = await fetch(`/api/customers?limit=50&search=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success) {
      return data.data;
    }
    return [];
  }, []);

  const renderItem = (customer: any) => (
    <div className="flex flex-col">
      <span className="font-semibold text-gray-800">{customer.name}</span>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
        <span className="font-mono text-primary-700 bg-primary-50 px-1 rounded">{customer.customerId}</span>
        {customer.phone && <span>• {customer.phone}</span>}
        {customer.email && <span className="truncate">• {customer.email}</span>}
      </div>
    </div>
  );

  const getDisplayValue = (customer: any) => customer.name;

  return (
    <AutocompleteCombobox
      placeholder={placeholder}
      value={value}
      onSelect={onSelect}
      onSearch={handleSearch}
      renderItem={renderItem}
      getDisplayValue={getDisplayValue}
      onCreateNew={onCreateNew}
      createLabel="Create Customer"
      className={className}
    />
  );
}
