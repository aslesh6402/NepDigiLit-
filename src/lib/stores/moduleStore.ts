import { create } from 'zustand'

interface Module {
  id: string
  title: string
  description: string
  category: 'DIGITAL_LITERACY' | 'CYBERSECURITY'
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  duration: number
  lessons: any[]
  isActive: boolean
}

interface ModuleState {
  modules: Module[]
  isLoading: boolean
  setModules: (modules: Module[]) => void
  setLoading: (loading: boolean) => void
  getModuleById: (id: string) => Module | undefined
}

export const useModuleStore = create<ModuleState>((set, get) => ({
  modules: [],
  isLoading: false,
  setModules: (modules) => set({ modules }),
  setLoading: (isLoading) => set({ isLoading }),
  getModuleById: (id) => {
    const { modules } = get()
    return modules.find(m => m.id === id)
  },
}))