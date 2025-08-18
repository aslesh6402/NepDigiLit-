import { create } from "zustand";
import { Todo, TodoProgress } from "@/types/dashboard";

interface TodoState {
  todoProgress: TodoProgress[];
  isLoading: boolean;
  setTodoProgress: (progress: TodoProgress[]) => void;
  updateTodoProgress: (
    moduleId: string,
    todoId: number,
    completed: boolean
  ) => void;
  getTodoProgress: (
    moduleId: string,
    todoId: number
  ) => TodoProgress | undefined;
  getModuleTodoProgress: (moduleId: string) => TodoProgress[];
  setLoading: (loading: boolean) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todoProgress: [],
  isLoading: false,
  setTodoProgress: (todoProgress) => set({ todoProgress }),
  setLoading: (isLoading) => set({ isLoading }),

  updateTodoProgress: (moduleId, todoId, completed) => {
    const { todoProgress } = get();
    const existingIndex = todoProgress.findIndex(
      (p) => p.moduleId === moduleId && p.todoId === todoId
    );

    if (existingIndex >= 0) {
      const updated = [...todoProgress];
      updated[existingIndex] = { ...updated[existingIndex], completed };
      set({ todoProgress: updated });
    } else {
      const newProgress: TodoProgress = {
        id: `temp-${Date.now()}`,
        userId: "current-user", // This should come from auth context
        moduleId,
        todoId,
        completed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ todoProgress: [...todoProgress, newProgress] });
    }
  },

  getTodoProgress: (moduleId, todoId) => {
    const { todoProgress } = get();
    return todoProgress.find(
      (p) => p.moduleId === moduleId && p.todoId === todoId
    );
  },

  getModuleTodoProgress: (moduleId) => {
    const { todoProgress } = get();
    return todoProgress.filter((p) => p.moduleId === moduleId);
  },
}));
