import React from 'react';

interface ManualOverrideSectionProps {
  config: {
    customFields?: string;
    customTopics?: string;
    customSkills?: string;
  };
  onConfigChange: (updates: Partial<{
    customFields?: string;
    customTopics?: string;
    customSkills?: string;
  }>) => void;
}

const ManualOverrideSection: React.FC<ManualOverrideSectionProps> = ({
  config,
  onConfigChange
}) => {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-3">Manual Override (Optional)</h3>
      <p className="text-sm text-gray-600 mb-3">Override auto-generated properties with custom values</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Fields</label>
          <input
            type="text"
            value={config.customFields}
            onChange={(e) => onConfigChange({ customFields: e.target.value })}
            placeholder="Frontend, Backend, DevOps..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Topics</label>
          <input
            type="text"
            value={config.customTopics}
            onChange={(e) => onConfigChange({ customTopics: e.target.value })}
            placeholder="React, JavaScript, APIs..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Skills</label>
          <input
            type="text"
            value={config.customSkills}
            onChange={(e) => onConfigChange({ customSkills: e.target.value })}
            placeholder="React, Vue, Angular..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ManualOverrideSection;
