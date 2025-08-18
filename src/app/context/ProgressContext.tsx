import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  lastAccessed: Date;
}

interface ProgressContextType {
  progress: ModuleProgress[];
  updateProgress: (moduleId: string, data: Partial<ModuleProgress>) => void;
  getModuleProgress: (moduleId: string) => ModuleProgress | undefined;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<ModuleProgress[]>([]);

  const updateProgress = (moduleId: string, data: Partial<ModuleProgress>) => {
    setProgress(prev => {
      const existingIndex = prev.findIndex(p => p.moduleId === moduleId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...data };
        return updated;
      } else {
        return [...prev, { 
          moduleId, 
          completed: false, 
          timeSpent: 0, 
          lastAccessed: new Date(),
          ...data 
        }];
      }
    });
  };

  const getModuleProgress = (moduleId: string) => {
    return progress.find(p => p.moduleId === moduleId);
  };

  return (
    <ProgressContext.Provider value={{ progress, updateProgress, getModuleProgress }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};