import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableDropdownProps<T> {
  items: T[];
  value: string;
  onChange: (value: string) => void;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableDropdown<T>({
  items,
  value,
  onChange,
  getItemValue,
  getItemLabel,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  disabled = false,
  className,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase().trim();
    return items.filter((item) =>
      getItemLabel(item).toLowerCase().includes(lower)
    );
  }, [items, search, getItemLabel]);

  const selectedItem = items.find((item) => getItemValue(item) === value);
  const selectedLabel = selectedItem ? getItemLabel(selectedItem) : "";

  const handleSelect = (itemValue: string) => {
    onChange(itemValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedLabel || placeholder}
        </span>
      </button>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
      {isOpen && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-2 dark:border-slate-700">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="max-h-56 overflow-y-auto px-4 py-3">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-slate-400">{emptyMessage}</p>
            ) : (
              filteredItems.map((item) => {
                const itemValue = getItemValue(item);
                return (
                  <button
                    key={itemValue}
                    type="button"
                    className="flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => handleSelect(itemValue)}
                  >
                    {getItemLabel(item)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
