import React from 'react';
import { Users } from 'lucide-react';

interface GeneratedPropertiesDisplayProps {
  generatedFields: string[];
  generatedTopics: string[];
  generatedSkills: string[];
}

const GeneratedPropertiesDisplay: React.FC<GeneratedPropertiesDisplayProps> = ({
  generatedFields,
  generatedTopics,
  generatedSkills
}) => {
  const hasAnyProperties = generatedFields.length > 0 || generatedTopics.length > 0 || generatedSkills.length > 0;
  
  if (!hasAnyProperties) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-green-50 rounded-lg">
      <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Auto-Generated Properties
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {generatedFields.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fields</label>
            <div className="flex flex-wrap gap-1">
              {generatedFields.map((field, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {generatedTopics.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>
            <div className="flex flex-wrap gap-1">
              {generatedTopics.map((topic, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {generatedSkills.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills ({generatedSkills.length})</label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {generatedSkills.slice(0, 10).map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {skill}
                </span>
              ))}
              {generatedSkills.length > 10 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{generatedSkills.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedPropertiesDisplay;
