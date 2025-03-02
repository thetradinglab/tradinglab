// ModulesContext.tsx - Create a context to share module data across components
import React, { createContext, useState, useContext, ReactNode } from 'react';

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

interface ModulesContextType {
  modules: Module[];
  updateLessonStatus: (moduleId: string, lessonId: string, completed: boolean) => void;
  calculateModuleProgress: (moduleId: string) => number;
}

const ModulesContext = createContext<ModulesContextType | undefined>(undefined);

export const ModulesProvider: React.FC<{ children: ReactNode, initialModules: Module[] }> = ({ 
  children, 
  initialModules 
}) => {
  const [modules, setModules] = useState<Module[]>(initialModules);

  const calculateModuleProgress = (moduleId: string): number => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || module.lessons.length === 0) return 0;
    
    const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const updateLessonStatus = (moduleId: string, lessonId: string, completed: boolean) => {
    setModules(prevModules => {
      return prevModules.map(module => {
        if (module.id === moduleId) {
          const updatedLessons = module.lessons.map(lesson => 
            lesson.id === lessonId ? { ...lesson, completed } : lesson
          );
          
          // Calculate new progress
          const completedCount = updatedLessons.filter(l => l.completed).length;
          const progress = Math.round((completedCount / updatedLessons.length) * 100);
          
          return {
            ...module,
            lessons: updatedLessons,
            progress
          };
        }
        return module;
      });
    });
  };

  return (
    <ModulesContext.Provider value={{ modules, updateLessonStatus, calculateModuleProgress }}>
      {children}
    </ModulesContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModulesContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
};