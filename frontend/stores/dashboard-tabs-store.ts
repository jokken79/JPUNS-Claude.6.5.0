import { create } from 'zustand'

interface DashboardTabsStore {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export const useDashboardTabsStore = create<DashboardTabsStore>((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
