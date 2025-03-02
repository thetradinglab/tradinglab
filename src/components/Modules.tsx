import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock } from 'lucide-react';
import { useModules } from '../ModuleContext';


interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  level: string;
  duration: string;
  tier: 'basic' | 'advanced' | 'pro';
  lessons: Lesson[];
  locked: boolean;
  progress?: number;
}
interface ModulesPageProps {
  userTier?: string;
}
function ModulesPage({userTier}: ModulesPageProps) {
  const navigate = useNavigate();
  const { modules } = useModules();
 
  const filteredModules = userTier 
    ? modules.filter(m => m.tier === userTier)
    : modules;

  const handleModuleClick = (moduleId: string, locked: boolean) => {
    if (!locked) {
      navigate(`/module/${moduleId}`);
    }
  };
  interface ModulesByTier {
    [key: string]: Module[];
  }

  // Group modules by tier for display with proper typing
  const modulesByTier = filteredModules.reduce<ModulesByTier>((acc: ModulesByTier, module: Module) => {
    if (!acc[module.tier]) {
      acc[module.tier] = [];
    }
    acc[module.tier].push(module);
    return acc;
  }, {});

  const tiers = ['basic', 'advanced', 'pro'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Your Modules</h1>
        <div className="flex items-center space-x-2 text-sm">
          <span className="flex items-center text-green-400">
            <Unlock className="w-4 h-4 mr-1" /> Available
          </span>
          <span className="flex items-center text-gray-400">
            <Lock className="w-4 h-4 mr-1" /> Locked
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {tiers.map(tier => {
          const tierModules = modulesByTier[tier] || [];
          if (tierModules.length === 0) return null;
          
          return (
            <div key={tier}>
              <h2 className="text-xl font-semibold text-cyan-400 mb-4">
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tierModules.map((module: Module) => (
                  <div
                    key={module.id}
                    onClick={() => handleModuleClick(module.id, module.locked)}
                    className={`bg-[#112A45] border border-cyan-900/50 rounded-xl p-6 relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${
                      module.locked ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        {module.icon}
                      </div>
                      {module.locked ? (
                        <Lock className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Unlock className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                    <p className="text-gray-400 mb-4">{module.description}</p>
                    
                    <div className="mb-4">
                      <div className="h-2 bg-gray-700 rounded-full">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${module.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{module.progress || 0}% Complete</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{module.level}</span>
                      <span>{module.duration}</span>
                    </div>
                    
                    {userTier && tier !== userTier && (
                      <div className="absolute inset-0 bg-[#0A1929]/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center p-6">
                          <Lock className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                          <p className="text-white font-medium mb-2">{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Required</p>
                          <button className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-400 transition-colors">
                            Upgrade to Access
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModulesPage;