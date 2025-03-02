import { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import ModuleProgress from './ModuleProgress';
import { useParams, useNavigate } from 'react-router-dom';
import { useModules } from '../ModuleContext';

//interface UserStats {
//  referrer: string;
//  referralCount: bigint;
//  totalRewards: bigint;
//  isRegistered: boolean;
//  isSubscribed: boolean;
//  tokenID: bigint;
//}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
}

//interface ModuleProps {
//  stats: UserStats | null;
//  address: string | null;
//}

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

function ModulesViewer() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const { modules, updateLessonStatus } = useModules();
  
  // Find the current module based on moduleId
  const currentModuleIndex = modules.findIndex(module => module.id === moduleId);
  const moduleIndex = currentModuleIndex >= 0 ? currentModuleIndex : 0;
  const currentModule = modules[moduleIndex];
  
  // Reset lesson index when module changes
  useEffect(() => {
    setCurrentLessonIndex(0);
  }, [moduleId]);

  // Function to mark lesson as completed when video is finished
  const handleVideoComplete = () => {
    if (currentModule && currentModule.lessons[currentLessonIndex]) {
      const lessonId = currentModule.lessons[currentLessonIndex].id;
      updateLessonStatus(currentModule.id, lessonId, true);
    }
  };

  // Function to adapt modules for ModuleProgress component
  const adaptModulesForProgress = (modules: Module[]) => {
    return modules.map((module, index) => ({
      id: index,
      title: module.title,
      description: module.description,
      videoHash: module.lessons[0]?.videoUrl || '',
      fallbackUrl: module.lessons[0]?.videoUrl || ''
    }));
  };

  const adaptedModules = adaptModulesForProgress(modules);

  // No lessons or empty module check
  if (!currentModule || !currentModule.lessons || currentModule.lessons.length === 0) {
    return <div className="min-h-screen bg-[#0A192F] text-white p-8">Module not found or has no lessons.</div>;
  }

  // Current lesson
  const currentLesson = currentModule.lessons[currentLessonIndex];

  return (
    <div className="min-h-screen bg-[#0A192F]">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-white mb-4">{currentModule.title}</h1>
            <h2 className="text-xl text-cyan-400 mb-6">{currentLesson.title}</h2>
            
            <VideoPlayer 
              videoHash={currentLesson.videoUrl}
              fallbackUrl={currentLesson.videoUrl}
              onComplete={handleVideoComplete}
            />
            
            {/* Lesson navigation */}
            <div className="mt-6 flex justify-between">
              <button 
                onClick={() => setCurrentLessonIndex(prev => Math.max(0, prev - 1))}
                disabled={currentLessonIndex === 0}
                className={`px-4 py-2 rounded ${currentLessonIndex === 0 ? 'bg-gray-600 text-gray-400' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
              >
                Previous Lesson
              </button>
              
              <button 
                onClick={() => {
                  // Mark current lesson as completed when moving to next lesson
                  if (!currentLesson.completed) {
                    updateLessonStatus(currentModule.id, currentLesson.id, true);
                  }
                  setCurrentLessonIndex(prev => Math.min(currentModule.lessons.length - 1, prev + 1));
                }}
                disabled={currentLessonIndex === currentModule.lessons.length - 1}
                className={`px-4 py-2 rounded ${currentLessonIndex === currentModule.lessons.length - 1 ? 'bg-gray-600 text-gray-400' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
              >
                Next Lesson
              </button>
            </div>
          </div>
          
          <div className="bg-[#112A45] rounded-lg p-6">
            {/* Lessons list for current module */}
            <h2 className="text-xl font-bold text-white mb-4">Module Lessons</h2>
            <div className="space-y-4 mb-8">
              {currentModule.lessons.map((lesson, index) => (
                <div 
                  key={lesson.id}
                  onClick={() => setCurrentLessonIndex(index)}
                  className={`p-4 rounded-lg cursor-pointer flex items-center ${
                    index === currentLessonIndex ? 'bg-cyan-900' : 'bg-[#1A3A5A] hover:bg-[#1E425F]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    lesson.completed ? 'bg-green-500' : 'bg-gray-600'
                  }`}>
                    {lesson.completed ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{lesson.title}</h3>
                    <p className="text-gray-400 text-sm">{lesson.duration}</p>
                  </div>
                  {index === currentLessonIndex && (
                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Module navigation */}
            <h3 className="text-lg font-medium text-white mb-3">Course Modules</h3>
            <ModuleProgress 
              modules={adaptedModules}
              currentModule={moduleIndex}
              setCurrentModule={(index) => navigate(`/module/${modules[index].id}`)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ModulesViewer;