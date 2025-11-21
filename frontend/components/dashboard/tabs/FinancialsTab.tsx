'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { MonthlySalaryBarChart, BarChartCard } from '@/components/dashboard/charts/BarChartCard'
import { SalaryTrendChart, AreaChartCard } from '@/components/dashboard/charts/AreaChartCard'
import { DollarSign, TrendingUp, PieChart, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

interface FinancialsTabProps {
  dashboardData: any
  isLoading: boolean
  stats: any
}

/**
 * FinancialsTab - Salary and financial analytics
 * Contains: Salary trends, payroll analysis, cost breakdowns
 */
export function FinancialsTab({
  dashboardData,
  isLoading,
  stats,
}: FinancialsTabProps) {
  // Calculate financial metrics
  const totalSalary = dashboardData?.stats.current.totalSalary || 0
  const previousSalary = dashboardData?.stats.previous.totalSalary || 0
  const salaryTrend = totalSalary - previousSalary
  const salaryTrendPositive = salaryTrend > 0

  // Average salary per employee
  const avgSalaryPerEmployee = stats.totalEmployees > 0
    ? Math.round(totalSalary / stats.totalEmployees / 1000) * 1000
    : 0

  // Estimated monthly costs
  const estimatedMonthlyPayroll = totalSalary
  const estimatedTaxes = Math.round(totalSalary * 0.15)
  const estimatedBenefits = Math.round(totalSalary * 0.08)
  const totalMonthlySpend = estimatedMonthlyPayroll + estimatedTaxes + estimatedBenefits

  return (
    <>
      {/* Financials Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Gestión Financiera</h2>
        <p className="text-muted-foreground mb-4">Análisis de nóminas y costos de personal</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Nómina Total Mes"
          value={`¥${(totalSalary / 1000000).toFixed(1)}M`}
          description={`${stats.totalEmployees} empleados`}
          icon={DollarSign}
          trend={{ value: Math.abs(salaryTrend / previousSalary * 100), isPositive: salaryTrendPositive }}
          loading={isLoading}
          variant="large"
          theme="success"
        />
        <MetricCard
          title="Salario Promedio"
          value={`¥${(avgSalaryPerEmployee / 1000).toFixed(0)}K`}
          description="Por empleado"
          icon={TrendingUp}
          trend={{ value: 2, isPositive: true }}
          loading={isLoading}
          variant="default"
          theme="info"
        />
        <MetricCard
          title="Impuestos y Contribuciones"
          value={`¥${(estimatedTaxes / 1000000).toFixed(1)}M`}
          description="15% de nómina"
          icon={BarChart3}
          trend={{ value: 1, isPositive: false }}
          loading={isLoading}
          variant="default"
          theme="warning"
        />
        <MetricCard
          title="Gasto Total Estimado"
          value={`¥${(totalMonthlySpend / 1000000).toFixed(1)}M`}
          description="Incluyendo beneficios"
          icon={PieChart}
          trend={{ value: 3, isPositive: false }}
          loading={isLoading}
          variant="default"
          theme="default"
        />
      </div>

      {/* Salary Trend Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Salary Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SalaryTrendChart
            data={dashboardData?.timeSeries}
            loading={isLoading}
          />
        </motion.div>

        {/* Monthly Salary Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <MonthlySalaryBarChart
            data={(dashboardData?.timeSeries || []) as any}
            loading={isLoading}
          />
        </motion.div>
      </div>

      {/* Cost Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Costos</CardTitle>
            <CardDescription>Análisis mensual estimado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Cost Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Nómina Base</p>
                    <p className="text-xs text-muted-foreground">Salarios directos</p>
                  </div>
                  <p className="text-lg font-bold">¥{(totalSalary / 1000000).toFixed(1)}M</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Beneficios Sociales</p>
                    <p className="text-xs text-muted-foreground">Seguros, bonificaciones</p>
                  </div>
                  <p className="text-lg font-bold">¥{(estimatedBenefits / 1000000).toFixed(1)}M</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Impuestos y Cotizaciones</p>
                    <p className="text-xs text-muted-foreground">IRPF, seguridad social</p>
                  </div>
                  <p className="text-lg font-bold">¥{(estimatedTaxes / 1000000).toFixed(1)}M</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border-t-2">
                  <div>
                    <p className="text-sm font-bold">Costo Total</p>
                    <p className="text-xs text-muted-foreground">Gasto mensual total</p>
                  </div>
                  <p className="text-xl font-bold">¥{(totalMonthlySpend / 1000000).toFixed(1)}M</p>
                </div>
              </div>

              {/* Cost Distribution */}
              <div className="pt-2">
                <p className="text-sm font-medium mb-3">Distribución de Costos</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs flex-1">Nómina: {((totalSalary / totalMonthlySpend) * 100).toFixed(1)}%</span>
                    <span className="text-xs font-semibold">{((totalSalary / totalMonthlySpend) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs flex-1">Beneficios: {((estimatedBenefits / totalMonthlySpend) * 100).toFixed(1)}%</span>
                    <span className="text-xs font-semibold">{((estimatedBenefits / totalMonthlySpend) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs flex-1">Impuestos: {((estimatedTaxes / totalMonthlySpend) * 100).toFixed(1)}%</span>
                    <span className="text-xs font-semibold">{((estimatedTaxes / totalMonthlySpend) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
            <CardDescription>Comparativa con período anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="border-l-4 border-primary/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Total Empleados</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-xs text-green-600">+{Math.floor(stats.totalEmployees * 0.05)}</p>
              </div>
              <div className="border-l-4 border-blue-500/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Mes Actual</p>
                <p className="text-2xl font-bold">¥{(totalSalary / 1000000).toFixed(1)}M</p>
                <p className={`text-xs ${salaryTrendPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {salaryTrendPositive ? '+' : ''}{((salaryTrend / previousSalary) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="border-l-4 border-green-500/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Mes Anterior</p>
                <p className="text-2xl font-bold">¥{(previousSalary / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
