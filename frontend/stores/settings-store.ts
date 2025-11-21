import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  // UI Settings
  compactMode: boolean
  showAnimations: boolean

  // Feature Visibility
  underConstructionPages: string[]

  // Actions
  setCompactMode: (enabled: boolean) => void
  setShowAnimations: (enabled: boolean) => void
  addUnderConstructionPage: (page: string) => void
  removeUnderConstructionPage: (page: string) => void
  isPageUnderConstruction: (page: string) => boolean
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Default values
      compactMode: false,
      showAnimations: true,
      underConstructionPages: [],

      // Actions
      setCompactMode: (enabled) => set({ compactMode: enabled }),
      setShowAnimations: (enabled) => set({ showAnimations: enabled }),

      addUnderConstructionPage: (page) =>
        set((state) => ({
          underConstructionPages: [...new Set([...state.underConstructionPages, page])],
        })),

      removeUnderConstructionPage: (page) =>
        set((state) => ({
          underConstructionPages: state.underConstructionPages.filter((p) => p !== page),
        })),

      isPageUnderConstruction: (page) => {
        const state = get()
        return state.underConstructionPages.includes(page)
      },
    }),
    {
      name: 'settings-storage',
    }
  )
)
