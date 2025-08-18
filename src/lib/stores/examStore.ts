import { create } from 'zustand'

interface ExamSession {
  id: string
  moduleId: string
  startTime: Date
  isProctored: boolean
  tabSwitches: number
  suspiciousFlags: string[]
  deviceInfo: any
}

interface ExamState {
  currentSession: ExamSession | null
  isExamMode: boolean
  isFullscreen: boolean
  tabSwitchCount: number
  suspiciousActivities: string[]
  startExam: (moduleId: string) => void
  endExam: () => void
  recordTabSwitch: () => void
  recordSuspiciousActivity: (activity: string) => void
  setFullscreen: (fullscreen: boolean) => void
}

export const useExamStore = create<ExamState>((set, get) => ({
  currentSession: null,
  isExamMode: false,
  isFullscreen: false,
  tabSwitchCount: 0,
  suspiciousActivities: [],

  startExam: (moduleId) => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    }

    const session: ExamSession = {
      id: `exam-${Date.now()}`,
      moduleId,
      startTime: new Date(),
      isProctored: true,
      tabSwitches: 0,
      suspiciousFlags: [],
      deviceInfo
    }

    set({
      currentSession: session,
      isExamMode: true,
      tabSwitchCount: 0,
      suspiciousActivities: []
    })

    // Request fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
    }

    // Add event listeners for exam monitoring
    document.addEventListener('visibilitychange', get().recordTabSwitch)
    document.addEventListener('blur', get().recordTabSwitch)
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault()
      e.returnValue = 'Are you sure you want to leave the exam?'
    })
  },

  endExam: () => {
    // Remove event listeners
    document.removeEventListener('visibilitychange', get().recordTabSwitch)
    document.removeEventListener('blur', get().recordTabSwitch)
    
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }

    set({
      currentSession: null,
      isExamMode: false,
      isFullscreen: false,
      tabSwitchCount: 0,
      suspiciousActivities: []
    })
  },

  recordTabSwitch: () => {
    const { currentSession, tabSwitchCount } = get()
    if (currentSession) {
      const newCount = tabSwitchCount + 1
      set({ 
        tabSwitchCount: newCount,
        suspiciousActivities: [...get().suspiciousActivities, `Tab switch detected at ${new Date().toISOString()}`]
      })
      
      // Flag if too many tab switches
      if (newCount > 3) {
        get().recordSuspiciousActivity('Excessive tab switching detected')
      }
    }
  },

  recordSuspiciousActivity: (activity) => {
    set({
      suspiciousActivities: [...get().suspiciousActivities, activity]
    })
  },

  setFullscreen: (fullscreen) => {
    set({ isFullscreen: fullscreen })
  }
}))