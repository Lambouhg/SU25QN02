'use client';

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { ViewControls } from './ViewControls';

interface FilterState {
  type: string;
  level: string;
  topics: string;
  fields: string;
  skills: string;
  category: string;
  tags: string;
  difficulty: string;
}

interface SearchControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  onFilterChange: (key: string, value: string) => void;
  filterOpen: boolean;
  onFilterToggle: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const SearchControls = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  filterOpen,
  onFilterToggle,
  viewMode,
  onViewModeChange
}: SearchControlsProps) => {
  const clearAllFilters = () => {
    const clearedFilters = {
      type: "",
      level: "",
      topics: "",
      fields: "",
      skills: "",
      category: "",
      tags: "",
      difficulty: ""
    };
    Object.entries(clearedFilters).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Search & Filter</h2>
        <ViewControls viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Enhanced Search */}
        <div className="flex-1 min-w-80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search questions by content, category, skills..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onFilterToggle}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
            filterOpen 
              ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-md' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {Object.values(filters).filter(v => v).length}
            </span>
          )}
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => 
              value ? (
                <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {key}: {value}
                  <button 
                    onClick={() => onFilterChange(key, "")}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null
            )}
            <button 
              onClick={clearAllFilters}
              className="text-xs text-gray-600 hover:text-gray-800 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
