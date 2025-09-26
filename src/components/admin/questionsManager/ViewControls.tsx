'use client';

import { Grid, List } from 'lucide-react';

interface ViewControlsProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const ViewControls = ({ viewMode, onViewModeChange }: ViewControlsProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span>View mode:</span>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 transition-colors ${
            viewMode === 'grid' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          title="Grid View"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 transition-colors ${
            viewMode === 'list' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          title="Table View"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
