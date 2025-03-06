import React, { useEffect, useState } from 'react';
import ModulesPage from './ModulesPage.tsx';
import { modules } from '../modulesData';

// Define interfaces for Lesson and Module
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

// Define the structure for user progress
interface UserProgress {
  [moduleId: string]: {
    [lessonId: string]: boolean; // Tracks whether a lesson is completed
  };
}

interface UserStats {
  referrer: string;
  referralCount: bigint;
  totalRewards: bigint;
  isRegistered: boolean;
  isSubscribed: boolean;
  tokenID: bigint;
}

interface MyModulesProps {
  stats: UserStats | null
}


function MyModules({ stats }: MyModulesProps) {

  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const userTier = stats?.isSubscribed ? 'basic' : undefined;

  useEffect(() => {
    // Load progress from local storage
    const savedProgress = localStorage.getItem('userProgress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress) as UserProgress);
    }
  }, []);

  const calculateModuleProgress = (moduleId: string): number => {
    const module = modules.find((m: Module) => m.id === moduleId);
    if (!module || module.lessons.length === 0) return 0;

    const completedLessons = module.lessons.filter(
      (lesson: Lesson) => userProgress[moduleId]?.[lesson.id]
    ).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const updatedModules = modules.map((module: Module) => ({
    ...module,
    progress: calculateModuleProgress(module.id),
    lessons: module.lessons.map((lesson: Lesson) => ({
      ...lesson,
      completed: !!userProgress[module.id]?.[lesson.id],
    })),
  }));

  return (
    <div>
      <ModulesPage
        userTier={userTier}
        modules={updatedModules}
      />
    </div>
  );
}

export default MyModules;