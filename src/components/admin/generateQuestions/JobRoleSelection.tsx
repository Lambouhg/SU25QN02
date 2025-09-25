import React from 'react';
import { Briefcase } from 'lucide-react';

interface JobCategory {
  id: string;
  name: string;
  skills?: string[];
}

interface JobRoleSelectionProps {
  categories: JobCategory[];
  config: {
    selectedCategoryId?: string;
    selectedLevel?: 'Junior' | 'Middle' | 'Senior';
  };
  onConfigChange: (updates: Partial<{
    selectedCategoryId?: string;
    selectedLevel?: 'Junior' | 'Middle' | 'Senior';
  }>) => void;
  loadingJobRoles: boolean;
}

const JobRoleSelection: React.FC<JobRoleSelectionProps> = ({
  categories,
  config,
  onConfigChange,
  loadingJobRoles
}) => {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
        <Briefcase className="w-4 h-4" />
        Setting Question
        {loadingJobRoles && (
          <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        )}
      </h3>
      
      {loadingJobRoles ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            <span>Loading Job Roles...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={config.selectedCategoryId}
              onChange={(e) => onConfigChange({ selectedCategoryId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingJobRoles}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
            <select
              value={config.selectedLevel || ''}
              onChange={(e) => onConfigChange({ selectedLevel: e.target.value as 'Junior' | 'Middle' | 'Senior' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingJobRoles}
            >
              <option value="">Select Level</option>
              <option value="Junior">Junior</option>
              <option value="Middle">Middle</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRoleSelection;
