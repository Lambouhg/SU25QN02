import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    type: string;
    level: string;
    topics: string;
    fields: string;
    skills: string;
    category: string;
    tags: string;
    difficulty: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 lg:relative lg:inset-auto lg:z-0">
      <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl lg:relative lg:w-64 lg:shadow-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </h3>
          <button onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto h-full">
          <div>
            <label className="block text-sm font-medium mb-2">Question Type</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filters.type} 
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <option value="">All</option>
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="free_text">Free Text</option>
              <option value="scale">Scale</option>
              <option value="coding">Coding</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Level</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filters.level} 
              onChange={(e) => onFilterChange('level', e.target.value)}
            >
              <option value="">All</option>
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value={filters.difficulty} 
              onChange={(e) => onFilterChange('difficulty', e.target.value)}
            >
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topics</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="React Hooks, API Integration..."
              value={filters.topics} 
              onChange={(e) => onFilterChange('topics', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fields</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Frontend, Backend, Mobile..."
              value={filters.fields} 
              onChange={(e) => onFilterChange('fields', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="React, JavaScript..."
              value={filters.skills} 
              onChange={(e) => onFilterChange('skills', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Frontend, Backend..."
              value={filters.category} 
              onChange={(e) => onFilterChange('category', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="react, hooks..."
              value={filters.tags} 
              onChange={(e) => onFilterChange('tags', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
