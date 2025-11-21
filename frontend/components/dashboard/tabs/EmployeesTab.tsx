'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmployeeStatusDonutChart, NationalityDonutChart } from '@/components/dashboard/charts/DonutChartCard'
import { EmployeeTrendChart, AreaChartCard } from '@/components/dashboard/charts/AreaChartCard'
import { MetricCard } from '@/components/dashboard/metric-card'
import { UserCheck, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmployeesTabProps {
  employeesData: any
  stats: any
  dashboardData: any
  isLoading: boolean
}

/**
 * EmployeesTab - Employee management metrics and analytics
 * Contains: Employee counts, status distribution, trends, charts
 */
export function EmployeesTab({
  employeesData,
  stats,
  dashboardData,
  isLoading,
}: EmployeesTabProps) {
  const employeeItems = employeesData?.items || []

  // Calculate additional metrics
  const inactiveEmployees = stats.totalEmployees - stats.activeEmployees
  const inactivePercentage = stats.totalEmployees > 0 ? Math.round((inactiveEmployees / stats.totalEmployees) * 100) : 0

  return (
    <>
      {/* Employee Metrics Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Gestión de Empleados</h2>
        <p className="text-muted-foreground mb-4">Información y análisis de personal activo</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Empleados"
          value={stats.totalEmployees}
          description={`${stats.activeEmployees} activos, ${inactiveEmployees} inactivos`}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
          loading={isLoading}
          variant="large"
          theme="info"
        />
        <MetricCard
          title="Empleados Activos"
          value={stats.activeEmployees}
          description={`${inactivePercentage}% del total`}
          icon={UserCheck}
          trend={{ value: 8, isPositive: true }}
          loading={isLoading}
          variant="default"
          theme="success"
        />
        <MetricCard
          title="Empleados Inactivos"
          value={inactiveEmployees}
          description="Bajas y suspensiones"
          icon={AlertCircle}
          trend={{ value: 2, isPositive: false }}
          loading={isLoading}
          variant="default"
          theme="warning"
        />
        <MetricCard
          title="Crecimiento Mes"
          value={`+${Math.floor(stats.totalEmployees * 0.05)}`}
          description="Nuevas contrataciones"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          loading={isLoading}
          variant="default"
          theme="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EmployeeStatusDonutChart
            data={dashboardData?.distribution.byStatus || []}
            loading={isLoading}
          />
        </motion.div>

        {/* Nationality Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <NationalityDonutChart
            data={dashboardData?.distribution.byNationality || []}
            loading={isLoading}
          />
        </motion.div>
      </div>

      {/* Employee Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <EmployeeTrendChart
          data={dashboardData?.timeSeries}
          loading={isLoading}
        />
      </motion.div>

      {/* Employee Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Detalladas</CardTitle>
          <CardDescription>Resumen completo de empleados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="border-l-4 border-primary/50 pl-4 py-2">
              <p className="text-sm text-muted-foreground">Total en Sistema</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
            <div className="border-l-4 border-green-500/50 pl-4 py-2">
              <p className="text-sm text-muted-foreground">Empleados Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeEmployees}</p>
            </div>
            <div className="border-l-4 border-amber-500/50 pl-4 py-2">
              <p className="text-sm text-muted-foreground">Empleados Inactivos</p>
              <p className="text-2xl font-bold text-amber-600">{inactiveEmployees}</p>
            </div>
            <div className="border-l-4 border-blue-500/50 pl-4 py-2">
              <p className="text-sm text-muted-foreground">Corporate Housing</p>
              <p className="text-2xl font-bold text-blue-600">{stats.employeesInCorporateHousing}</p>
            </div>
            <div className="border-l-4 border-purple-500/50 pl-4 py-2">
              <p className="text-sm text-muted-foreground">Tasa de Actividad</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}%
              </p>
            </div>
            <div className="border-l-4 border-pink-500/50 pl-4 py-2">
              <p className="text-sm text-muted-foreground">Registros en Período</p>
              <p className="text-2xl font-bold text-pink-600">{employeeItems.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
