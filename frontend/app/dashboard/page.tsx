'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { employeeService, candidateService, factoryService, timerCardService } from '@/lib/api';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs-wrapper';
import { useEffect, useState } from 'react';
import { getAllDashboardData } from '@/lib/dashboard-data';
import { PageSkeleton } from '@/components/page-skeleton';
import { ErrorState } from '@/components/error-state';
import { useCombinedLoading, getErrorType } from '@/lib/loading-utils';

export default function DashboardPage() {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<ReturnType<typeof getAllDashboardData> | null>(null);

  // Ensure component is mounted before making API calls
  useEffect(() => {
    setMounted(true);
    // Load mock dashboard data
    setDashboardData(getAllDashboardData());
  }, []);

  // Fetch statistics with React Query - only if authenticated, hydrated, and mounted
  const { data: employeesData, isLoading: loadingEmployees, error: errorEmployees, refetch: refetchEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
    enabled: isAuthenticated && isHydrated && mounted,
    retry: 1,
  });

  const { data: candidates, isLoading: loadingCandidates, error: errorCandidates, refetch: refetchCandidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidateService.getCandidates(),
    enabled: isAuthenticated && isHydrated && mounted,
    retry: 1,
  });

  const { data: factories, isLoading: loadingFactories, error: errorFactories, refetch: refetchFactories } = useQuery({
    queryKey: ['factories'],
    queryFn: () => factoryService.getFactories(),
    enabled: isAuthenticated && isHydrated && mounted,
    retry: 1,
  });

  const { data: timerCards, isLoading: loadingTimerCards, error: errorTimerCards, refetch: refetchTimerCards } = useQuery({
    queryKey: ['timerCards'],
    queryFn: () => timerCardService.getTimerCards(),
    enabled: isAuthenticated && isHydrated && mounted,
    retry: 1,
  });

  // Safely access items from API responses
  const employeeItems = employeesData?.items || [];
  const candidateItems = Array.isArray(candidates) ? candidates : (candidates?.items || []);
  const factoryItems = factories || [];
  const timerCardItems = timerCards || [];

  // Calculate statistics
  const stats = {
    totalCandidates: Array.isArray(candidateItems) ? candidateItems.length : 0,
    pendingCandidates: Array.isArray(candidateItems) ? candidateItems.filter((c: any) => c.status === 'pending' || c.status === 'pending_approval').length : 0,
    totalEmployees: Array.isArray(employeeItems) ? employeeItems.length : 0,
    activeEmployees: Array.isArray(employeeItems) ? employeeItems.filter((e: any) => e.status === 'active').length : 0,
    totalFactories: Array.isArray(factoryItems) ? factoryItems.length : 0,
    totalTimerCards: Array.isArray(timerCardItems) ? timerCardItems.length : 0,
    employeesInCorporateHousing: Array.isArray(employeeItems) ? employeeItems.filter((e: any) => e.is_corporate_housing === true).length : 0,
  };

  // Combined loading state
  const isLoading = loadingEmployees || loadingCandidates || loadingFactories || loadingTimerCards;

  // Smart combined loading state with delay to prevent flashing
  const showLoading = useCombinedLoading(
    [loadingEmployees, loadingCandidates, loadingFactories, loadingTimerCards],
    { delay: 200, minDuration: 500 }
  );

  // Check for critical errors
  const hasCriticalError = errorEmployees && errorCandidates && errorFactories && errorTimerCards;
  const firstError = errorEmployees || errorCandidates || errorFactories || errorTimerCards;

  // Refresh all data
  const handleRefresh = () => {
    refetchEmployees();
    refetchCandidates();
    refetchFactories();
    refetchTimerCards();
    setDashboardData(getAllDashboardData());
  };

  // Show loading state while mounting or hydrating
  if (!mounted || !isHydrated) {
    return <PageSkeleton type="dashboard" />;
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <ErrorState
        type="forbidden"
        title="Authentication Required"
        message="Please log in to access the dashboard."
        showRetry={false}
        showGoBack={false}
      />
    );
  }

  // Show loading skeleton with delay
  if (showLoading) {
    return <PageSkeleton type="dashboard" />;
  }

  // Show error state if all queries failed
  if (hasCriticalError && firstError) {
    return (
      <ErrorState
        type={getErrorType(firstError)}
        title="Failed to Load Dashboard"
        message="Unable to fetch dashboard data. Please try again."
        details={firstError}
        onRetry={handleRefresh}
        showRetry={true}
        showGoBack={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader
        title="Dashboard"
        subtitle={user ? `Bienvenido, ${user.username || 'Usuario'}` : 'Bienvenido'}
        dateRange={{
          start: new Date(new Date().setDate(1)),
          end: new Date(),
        }}
        onRefresh={handleRefresh}
        onExport={() => console.log('Export')}
        onPrint={() => console.log('Print')}
        isRefreshing={isLoading}
      />

      {/* Tabbed Dashboard Interface */}
      <DashboardTabs
        employeesData={employeesData}
        candidates={candidates}
        factories={factories}
        timerCards={timerCards}
        stats={stats}
        dashboardData={dashboardData}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
