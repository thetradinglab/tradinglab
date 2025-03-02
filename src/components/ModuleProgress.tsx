import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface Module {
  id: number;
  title: string;
  description: string;
  videoHash: string;
  fallbackUrl: string;
}

interface ModuleProgressProps {
  modules: Module[];
  currentModule: number;
  setCurrentModule: (index: number) => void;
}

const ModuleProgress: React.FC<ModuleProgressProps> = ({
  modules,
  currentModule,
  setCurrentModule,
}) => {
  return (
    <div className="space-y-4">
      {modules.map((module, index) => (
        <button
          key={module.id}
          onClick={() => setCurrentModule(index)}
          className={`w-full text-left p-4 rounded-lg transition-colors ${
            currentModule === index
              ? 'bg-cyan-500/20 border border-cyan-500/50'
              : 'bg-[#1A365D] hover:bg-[#1E4976]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {index < currentModule ? (
                <CheckCircle className="w-5 h-5 text-cyan-400" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-white font-medium">{module.title}</span>
            </div>
          </div>
          <p className="mt-2 text-gray-400 text-sm">{module.description}</p>
        </button>
      ))}
    </div>
  );
};

export default ModuleProgress;