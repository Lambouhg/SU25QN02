import React from 'react';
import { X } from 'lucide-react';

interface TagComponentProps {
  text: string; 
  variant?: "default" | "success" | "warning" | "error";
  onRemove?: () => void;
}

const TagComponent: React.FC<TagComponentProps> = ({ text, variant = "default", onRemove }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    success: "bg-green-100 text-green-800 border-green-200", 
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200"
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {text}
      {onRemove && (
        <button onClick={onRemove} className="hover:bg-black/10 rounded-full p-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default TagComponent;
