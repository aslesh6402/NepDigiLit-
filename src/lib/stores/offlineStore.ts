import { create } from 'zustand'

interface OfflineContent {
  moduleId: string
  content: any
  version: string
  downloadedAt: Date
}

interface OfflineState {
  isOnline: boolean
  downloadedModules: OfflineContent[]
  pendingSync: any[]
  setOnlineStatus: (online: boolean) => void
  downloadModule: (moduleId: string, content: any) => void
  addPendingSync: (data: any) => void
  syncPendingData: () => Promise<void>
  getOfflineModule: (moduleId: string) => OfflineContent | undefined
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  downloadedModules: [],
  pendingSync: [],

  setOnlineStatus: (isOnline) => {
    set({ isOnline })
    if (isOnline) {
      get().syncPendingData()
    }
  },

  downloadModule: (moduleId, content) => {
    const offlineContent: OfflineContent = {
      moduleId,
      content,
      version: '1.0',
      downloadedAt: new Date()
    }
    
    set(state => ({
      downloadedModules: [
        ...state.downloadedModules.filter(m => m.moduleId !== moduleId),
        offlineContent
      ]
    }))

    // Store in localStorage for persistence
    localStorage.setItem(`offline-module-${moduleId}`, JSON.stringify(offlineContent))
  },

  addPendingSync: (data) => {
    set(state => ({
      pendingSync: [...state.pendingSync, { ...data, timestamp: Date.now() }]
    }))
  },

  syncPendingData: async () => {
    const { pendingSync, isOnline } = get()
    if (!isOnline || pendingSync.length === 0) return

    try {
      for (const data of pendingSync) {
        // Sync progress data
        if (data.type === 'progress') {
          await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.payload)
          })
        }
      }
      
      set({ pendingSync: [] })
    } catch (error) {
      console.error('Sync failed:', error)
    }
  },

  getOfflineModule: (moduleId) => {
    const { downloadedModules } = get()
    return downloadedModules.find(m => m.moduleId === moduleId)
  }
}))