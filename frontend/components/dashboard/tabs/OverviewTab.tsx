'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { TrendCard, EmployeeTrendCard, HoursTrendCard, SalaryTrendCard, CandidatesTrendCard } from '@/components/dashboard/charts/TrendCard'
import { StatsChart } from '@/components/dashboard/stats-chart'
import { EmployeeStatusDonutChart, NationalityDonutChart } from '@/components/dashboard/charts/DonutChartCard'
import { MonthlySalaryBarChart } from '@/components/dashboard/charts/BarChartCard'
import { Users, UserCheck, Building2, Clock, UserPlus, FileCheck, AlertTriangle, DollarSign, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface OverviewTabProps {
  stats: any
  dashboardData: any
  candidates: any
  isLoading: boolean
}

/**
 * OverviewTab - Welcome section with quick stats and main dashboard metrics
 * Contains: Welcome card, Quick Actions, Metrics grid, Trends, Charts
 */
export function OverviewTab({
  stats,
  dashboardData,
  candidates,
  isLoading,
}: OverviewTabProps) {
  return (
    <>
      {/* Hero Section - Welcome with Quick Stats Summary */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 hover:bg-accent hover:text-accent-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                ¡Bienvenido de nuevo! 👋
              </h2>
              <p className="text-muted-foreground">
                Aquí está un resumen de tu sistema de gestión de RRHH para hoy.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalEmployees}</div>
                <div className="text-xs text-muted-foreground">Empleados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{stats.activeEmployees}</div>
                <div className="text-xs text-muted-foreground">Activos</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Acciones Rápidas</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:text-accent-foreground hover:border-primary"
            asChild
          >
            <a href="/employees/new">
              <UserPlus className="h-6 w-6 text-primary" />
              <span className="font-medium">Añadir Empleado</span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:text-accent-foreground hover:border-blue-500"
            asChild
          >
            <a href="/timercards">
              <Clock className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Ver タイムカード</span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:text-accent-foreground hover:border-emerald-500"
            asChild
          >
            <a href="/candidates">
              <FileCheck className="h-6 w-6 text-emerald-600" />
              <span className="font-medium">Aprobar Candidatos</span>
            </a>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:bg-accent hover:text-accent-foreground hover:border-amber-500"
            asChild
          >
            <a href="/salary">
              <DollarSign className="h-6 w-6 text-amber-600" />
              <span className="font-medium">Procesar Nómina</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Métricas Principales</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Candidatos"
            value={stats.totalCandidates}
            description={`${stats.pendingCandidates} pendientes de aprobación`}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            loading={isLoading}
            variant="default"
            theme="info"
          />
          <MetricCard
            title="Empleados Activos"
            value={stats.activeEmployees}
            description={`${stats.totalEmployees} total en sistema`}
            icon={UserCheck}
            trend={{ value: 8, isPositive: true }}
            loading={isLoading}
            variant="large"
            theme="success"
            className="md:col-span-1 lg:col-span-2 md:row-span-2"
          />
          <MetricCard
            title="Fábricas Activas"
            value={stats.totalFactories}
            description="Clientes en operación"
            icon={Building2}
            trend={{ value: 3, isPositive: true }}
            loading={isLoading}
            variant="default"
            theme="default"
          />
          <MetricCard
            title="社宅利用者"
            value={stats.employeesInCorporateHousing}
            description="Corporate Housing"
            icon={Home}
            trend={{ value: 0, isPositive: true }}
            loading={isLoading}
            variant="compact"
            theme="default"
          />
          <MetricCard
            title="Asistencias (Mes)"
            value={stats.totalTimerCards}
            description="Registros de タイムカード"
            icon={Clock}
            trend={{ value: 5, isPositive: false }}
            loading={isLoading}
            variant="compact"
            theme="warning"
          />
        </div>
      </div>

      {/* Trend Cards Row */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Tendencias</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <EmployeeTrendCard
            value={dashboardData?.stats.current.totalEmployees || 0}
            previousValue={dashboardData?.stats.previous.totalEmployees}
            loading={isLoading}
          />
          <HoursTrendCard
            value={dashboardData?.stats.current.totalHours || 0}
            previousValue={dashboardData?.stats.previous.totalHours}
            loading={isLoading}
          />
          <SalaryTrendCard
            value={dashboardData?.stats.current.totalSalary || 0}
            previousValue={dashboardData?.stats.previous.totalSalary}
            loading={isLoading}
          />
          <CandidatesTrendCard
            value={dashboardData?.stats.current.totalCandidates || 0}
            previousValue={dashboardData?.stats.previous.totalCandidates}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Charts Section - Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <StatsChart
            data={dashboardData?.timeSeries}
            showPeriodSelector={true}
            showExportButton={true}
          />
        </div>
        <div className="lg:col-span-3">
          <EmployeeStatusDonutChart
            data={dashboardData?.distribution.byStatus || []}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <NationalityDonutChart
          data={dashboardData?.distribution.byNationality || []}
          loading={isLoading}
        />
        <div className="lg:col-span-2">
          <MonthlySalaryBarChart
            data={(dashboardData?.timeSeries || []) as any}
            loading={isLoading}
          />
        </div>
      </div>
    </>
  )
}
