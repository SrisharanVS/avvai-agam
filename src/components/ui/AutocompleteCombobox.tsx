"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AutocompleteComboboxProps {
  placeholder?: string;
  value?: string; // current display text value
  onSelect: (item: any) => void;
  onSearch: (query: string) => Promise<any[]>;
  renderItem: (item: any) => React.ReactNode;
  getDisplayValue: (item: any) => string;
  onCreateNew?: (query: string) => void;
  createLabel?: string;
  className?: string;
}

export function AutocompleteCombobox({
  placeholder = "Search...",
  value = "",
  onSelect,
  onSearch,
  renderItem,
  getDisplayValue,
  onCreateNew,
  createLabel = "Create new",
  className = "",
}: AutocompleteComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync value from parent
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const search = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const results = await onSearch(query);
        setSuggestions(results);
      } catch (err) {
        console.error("Search error in Combobox:", err);
      } finally {
        setLoading(false);
      }
    },
    [onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setFocusedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(val);
    }, 300);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0 && inputValue === "") {
      search("");
    }
  };

  const selectItem = (item: any) => {
    onSelect(item);
    setInputValue(getDisplayValue(item));
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const hasCreateOption = onCreateNew && inputValue.trim().length > 0;
    const maxItems = suggestions.length + (hasCreateOption ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1 >= maxItems ? 0 : prev + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 < 0 ? maxItems - 1 : prev - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          selectItem(suggestions[focusedIndex]);
        } else if (focusedIndex === suggestions.length && hasCreateOption) {
          onCreateNew!(inputValue);
          setIsOpen(false);
        } else if (suggestions.length > 0) {
          // Default selection if enter is hit and suggestion matches
          selectItem(suggestions[0]);
        } else if (hasCreateOption) {
          onCreateNew!(inputValue);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-8 h-10 w-full rounded-xl border border-gray-200 focus-visible:ring-primary-500 bg-white"
        />
        {loading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-50 focus:outline-none">
          {suggestions.length === 0 && !loading && !onCreateNew && (
            <div className="px-4 py-2.5 text-sm text-muted-foreground text-center">
              No results found
            </div>
          )}

          {suggestions.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => selectItem(item)}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                focusedIndex === idx
                  ? "bg-primary-50 text-primary-900 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {renderItem(item)}
            </div>
          ))}

          {onCreateNew && inputValue.trim().length > 0 && (
            <div
              onClick={() => {
                onCreateNew(inputValue);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer border-t border-gray-100 transition-colors flex items-center gap-1.5 ${
                focusedIndex === suggestions.length
                  ? "bg-primary-50 text-primary-700 font-semibold"
                  : "text-primary-600 hover:bg-primary-50 font-medium"
              }`}
            >
              <span className="text-xs font-bold px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-md">
                +
              </span>
              {createLabel}: "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
