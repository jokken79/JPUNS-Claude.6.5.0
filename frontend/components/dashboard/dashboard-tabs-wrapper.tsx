'use client'

import { useEffect, useState } from 'react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Home,
  DollarSign,
  FileText,
} from 'lucide-react'
import { useDashboardTabsStore } from '@/stores/dashboard-tabs-store'
import { OverviewTab } from './tabs/OverviewTab'
import { EmployeesTab } from './tabs/EmployeesTab'
import { YukyuTab } from './tabs/YukyuTab'
import { ApartmentsTab } from './tabs/ApartmentsTab'
import { FinancialsTab } from './tabs/FinancialsTab'
import { ReportsTab } from './tabs/ReportsTab'

interface TabDefinition {
  id: 'overview' | 'employees' | 'yukyus' | 'apartments' | 'financials' | 'reports'
  label: string
  icon: React.ReactNode
}

const tabs: TabDefinition[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'employees', label: 'Employees', icon: <Users className="h-4 w-4" /> },
  { id: 'yukyus', label: 'Yukyus', icon: <Calendar className="h-4 w-4" /> },
  { id: 'apartments', label: 'Apartments', icon: <Home className="h-4 w-4" /> },
  { id: 'financials', label: 'Financials', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
]

interface DashboardTabsProps {
  // All data passed from page component
  employeesData: any
  candidates: any
  factories: any
  timerCards: any
  stats: any
  dashboardData: any
  isLoading: boolean
  onRefresh: () => void
}

/**
 * DashboardTabs - Main tabbed interface wrapper
 * Features:
 * - 6 tabs organized by domain
 * - Persistent tab selection via Zustand
 * - Smooth fade transitions
 * - Responsive design (horizontal tabs on desktop, stacked on mobile)
 * - Icons for visual identification
 * - Keyboard navigation (arrow keys, tab, home/end)
 */
export function DashboardTabs({
  employeesData = null,
  candidates = null,
  factories = null,
  timerCards = null,
  stats = {
    totalCandidates: 0,
    pendingCandidates: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalFactories: 0,
    totalTimerCards: 0,
    employeesInCorporateHousing: 0,
  },
  dashboardData = null,
  isLoading = false,
  onRefresh = () => {},
}: DashboardTabsProps) {
  const { activeTab, setActiveTab } = useDashboardTabsStore()
  const [hydrated, setHydrated] = useState(false)

  // Handle hydration to prevent mismatch between server and client
  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return null
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as any)}
      className="w-full space-y-6"
    >
      {/* Tab Triggers - Responsive Grid */}
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-background border border-border rounded-lg p-1 gap-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium transition-all duration-300 ease-in-out data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent/50"
          >
            <span className="hidden sm:inline">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
            <span className="inline md:hidden">{tab.label.substring(0, 3)}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Tab Content - Smooth fade transitions */}
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab
            stats={stats}
            dashboardData={dashboardData}
            candidates={candidates}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <EmployeesTab
            employeesData={employeesData}
            stats={stats}
            dashboardData={dashboardData}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="yukyus" className="space-y-6">
          <YukyuTab
            employeesData={employeesData}
            dashboardData={dashboardData}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="apartments" className="space-y-6">
          <ApartmentsTab
            stats={stats}
            dashboardData={dashboardData}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <FinancialsTab
            dashboardData={dashboardData}
            isLoading={isLoading}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTab
            dashboardData={dashboardData}
            candidates={candidates}
            isLoading={isLoading}
            onRefresh={onRefresh}
          />
        </TabsContent>
      </div>
    </Tabs>
  )
}
