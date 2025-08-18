import { create } from "zustand";

interface ModuleProgress {
  id: string;
  moduleId: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  currentLesson: number;
  lastAccessed: Date;
}

interface ProgressState {
  progress: ModuleProgress[];
  isLoading: boolean;
  setProgress: (progress: ModuleProgress[]) => void;
  updateProgress: (moduleId: string, data: Partial<ModuleProgress>) => void;
  setLoading: (loading: boolean) => void;
  getModuleProgress: (moduleId: string) => ModuleProgress | undefined;
  completeLesson: (moduleId: string, lessonIndex: number) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: [],
  isLoading: false,
  setProgress: (progress) => set({ progress }),
  setLoading: (isLoading) => set({ isLoading }),
  updateProgress: (moduleId, data) => {
    const { progress } = get();
    const existingIndex = progress.findIndex((p) => p.moduleId === moduleId);

    if (existingIndex >= 0) {
      const updated = [...progress];
      updated[existingIndex] = { ...updated[existingIndex], ...data };
      set({ progress: updated });
    } else {
      const newProgress = {
        id: `temp-${Date.now()}`,
        moduleId,
        completed: false,
        timeSpent: 0,
        currentLesson: 0,
        lastAccessed: new Date(),
        ...data,
      };
      set({ progress: [...progress, newProgress] });
    }
  },
  getModuleProgress: (moduleId) => {
    const { progress } = get();
    return progress.find((p) => p.moduleId === moduleId);
  },
  completeLesson: (moduleId, lessonIndex) => {
    const { updateProgress } = get();
    updateProgress(moduleId, {
      currentLesson: lessonIndex + 1,
      lastAccessed: new Date(),
    });
  },
}));
