'use client';

import React, { useState } from 'react';

// Generic types for reusability
export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface Filter {
  id: string;
  label: string;
  type?: 'select' | 'pills';
  options: FilterOption[];
}

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;

  filters: Filter[];
  selectedFilters: Record<string, string | string[]>;
  onFilterChange: (filterId: string, value: string | string[]) => void;

  sortByOptions: FilterOption[];
  currentSortBy: string;
  onSortByChange: (value: string) => void;

  onClearAll?: () => void;
  isFiltered?: boolean;

  children?: React.ReactNode; // For additional controls like view mode toggle
}

export function FilterControls({
  searchTerm,
  onSearchChange,
  filters,
  selectedFilters,
  onFilterChange,
  sortByOptions,
  currentSortBy,
  onSortByChange,
  onClearAll,
  isFiltered,
  children,
}: FilterControlsProps) {
  const [pillSearchTerms, setPillSearchTerms] = useState<Record<string, string>>({});

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-0 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Filters */}
            {filters
              .filter((f) => f.type !== 'pills')
              .map((filter) => (
                <div key={filter.id} className="flex-shrink-0">
                  <label htmlFor={`filter-${filter.id}`} className="sr-only">
                    {filter.label}
                  </label>
                  <select
                    id={`filter-${filter.id}`}
                    value={(selectedFilters[filter.id] as string) || ''}
                    onChange={(e) => onFilterChange(filter.id, e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

            {/* Sort By */}
            <div className="flex-shrink-0">
              <label htmlFor="sort-by" className="sr-only">
                Sortieren nach
              </label>
              <select
                id="sort-by"
                value={currentSortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {sortByOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <button
                onClick={onClearAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                Filter zurücksetzen
              </button>
            )}

            {/* Children for additional controls */}
            {children}
          </div>
        </div>
        {/* Pills Filters */}
        {filters
          .filter((f) => f.type === 'pills')
          .map((filter) => {
            const selectedPills = (selectedFilters[filter.id] as string[]) || [];
            const pillSearchTerm = pillSearchTerms[filter.id] || '';

            return (
              <div key={filter.id} className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {filter.label}:
                  </label>
                  {filter.options.length > 7 && (
                    <div className="relative flex-1 max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="search"
                        placeholder={`Suche ${filter.label}...`}
                        value={pillSearchTerm}
                        onChange={(e) =>
                          setPillSearchTerms((prev) => ({ ...prev, [filter.id]: e.target.value }))
                        }
                        className="block w-full pl-9 pr-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {filter.options
                    .filter((option) =>
                      option.label.toLowerCase().includes(pillSearchTerm.toLowerCase()),
                    )
                    .map((option) => {
                      const isSelected = selectedPills.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            const newSelection = isSelected
                              ? selectedPills.filter((p) => p !== option.value)
                              : [...selectedPills, option.value];
                            onFilterChange(filter.id, newSelection);
                          }}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
