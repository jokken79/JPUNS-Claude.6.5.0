'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Import KEIRI components
import {
  TotalYukyuDaysCard,
  EmployeesWithYukyuCard,
  TotalDeductionCard,
  ComplianceRateCard,
} from '@/components/keiri/yukyu-metric-card';
import { PendingRequestsTable, type PendingYukyuRequest } from '@/components/keiri/pending-requests-table';
import {
  YukyuTrendChart,
  type YukyuTrendDataPoint,
} from '@/components/keiri/yukyu-trend-chart';
import { ComplianceCard, type ComplianceStatusData } from '@/components/keiri/compliance-card';

// ============================================================================
// Types
// ============================================================================

interface DashboardState {
  trends: YukyuTrendDataPoint[];
  pendingRequests: PendingYukyuRequest[];
  compliance: ComplianceStatusData | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

// ============================================================================
// Component
// ============================================================================

export default function YukyuDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [state, setState] = useState<DashboardState>({
    trends: [],
    pendingRequests: [],
    compliance: null,
    loading: true,
    error: null,
    lastRefresh: null,
  });

  // =========================================================================
  // Role-based Access Control
  // =========================================================================

  useEffect(() => {
    // Allow access: SUPER_ADMIN, ADMIN, COORDINATOR, KANRININSHA, KEITOSAN, TANTOSHA
    // Deny access: EMPLOYEE, CONTRACT_WORKER
    if (!user) {
      router.push('/login');
      return;
    }

    const userRole = (user as any)?.role?.toUpperCase() || '';
    const deniedRoles = ['EMPLOYEE', 'CONTRACT_WORKER'];

    if (deniedRoles.includes(userRole)) {
      // Employees and contractors cannot access yukyu management
      router.push('/');
      return;
    }

    // Also check that user has a valid role
    if (!userRole) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // =========================================================================
  // Data Fetching
  // =========================================================================

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch trends data
      const trendsRes = await fetch('/api/dashboard/yukyu-trends-monthly?months=6');
      if (!trendsRes.ok) throw new Error('Failed to fetch trends');
      const trends = await trendsRes.json();

      // Fetch compliance data
      const complianceRes = await fetch('/api/dashboard/yukyu-compliance-status');
      if (!complianceRes.ok) throw new Error('Failed to fetch compliance data');
      const compliance = await complianceRes.json();

      // Fetch pending requests (from yukyu API)
      const requestsRes = await fetch('/api/yukyu/requests?status=PENDING&limit=10');
      let pendingRequests: PendingYukyuRequest[] = [];
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        // Transform API response to component format
        pendingRequests = (requestsData.items || []).map((r: any) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee_name,
          daysRequested: r.days_requested,
          startDate: r.start_date,
          endDate: r.end_date,
          reason: r.reason,
          requestedAt: r.created_at,
          factoryId: r.factory_id,
          factoryName: r.factory_name,
        }));
      }

      setState(prev => ({
        ...prev,
        trends,
        compliance,
        pendingRequests,
        loading: false,
        lastRefresh: new Date(),
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load dashboard data';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================================
  // Handlers
  // =========================================================================

  const handleApproveRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/yukyu/requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved by KEITOSAN' }),
      });

      if (!res.ok) throw new Error('Failed to approve request');

      // Refresh data
      setState(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId),
      }));

      // Trigger full refresh
      await fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to approve request';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/yukyu/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Rejected by KEITOSAN' }),
      });

      if (!res.ok) throw new Error('Failed to reject request');

      // Refresh data
      setState(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId),
      }));

      // Trigger full refresh
      await fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject request';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  // =========================================================================
  // Calculations for Summary Cards
  // =========================================================================

  const currentMonthTrend = state.trends[state.trends.length - 1];
  const totalDays = currentMonthTrend?.totalApprovedDays || 0;
  const employeesCount = currentMonthTrend?.employeesWithYukyu || 0;
  const totalDeduction = currentMonthTrend?.totalDeductionJpy || 0;
  const complianceRate = state.compliance
    ? Math.round((state.compliance.compliantEmployees / state.compliance.totalEmployees) * 100)
    : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Yukyu Management Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Yukyu approvals and compliance monitoring (Admin staff only)
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={state.loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Error Alert */}
      {state.error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Summary Metrics */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TotalYukyuDaysCard value={totalDays} loading={state.loading} />
        <EmployeesWithYukyuCard value={employeesCount} loading={state.loading} />
        <TotalDeductionCard value={totalDeduction} loading={state.loading} />
        <ComplianceRateCard
          value={complianceRate}
          nonCompliantCount={state.compliance?.nonCompliantEmployees || 0}
          loading={state.loading}
        />
      </motion.div>

      {/* Tabs for Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <YukyuTrendChart
              data={state.trends}
              loading={state.loading}
              chartType="combined"
              height={400}
            />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            {state.compliance && (
              <ComplianceCard
                data={state.compliance}
                loading={state.loading}
                showDetails={true}
                maxDetailsDisplay={10}
              />
            )}
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <PendingRequestsTable
              requests={state.pendingRequests}
              loading={state.loading}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Last Refresh Info */}
      {state.lastRefresh && (
        <motion.div
          variants={itemVariants}
          className="text-xs text-muted-foreground text-center"
        >
          Last updated: {state.lastRefresh.toLocaleTimeString('ja-JP')}
        </motion.div>
      )}
    </motion.div>
  );
}
