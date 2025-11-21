'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Calendar, Clock, User, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface YukyuTabProps {
  employeesData: any
  dashboardData: any
  isLoading: boolean
}

/**
 * YukyuTab - Vacation and leave management
 * Contains: Yukyu (有給) balance, pending requests, employee leave data
 */
export function YukyuTab({
  employeesData,
  dashboardData,
  isLoading,
}: YukyuTabProps) {
  const employeeItems = employeesData?.items || []

  // Calculate yukyu statistics
  const totalYukyuDays = employeeItems.reduce((sum: number, emp: any) => {
    return sum + (emp.yukyu_balance || 0)
  }, 0)

  const averageYukyuPerEmployee = employeeItems.length > 0 ? Math.round(totalYukyuDays / employeeItems.length * 10) / 10 : 0
  const employeesWithoutYukyu = employeeItems.filter((emp: any) => (emp.yukyu_balance || 0) === 0).length
  const employeesWithLowYukyu = employeeItems.filter((emp: any) => (emp.yukyu_balance || 0) > 0 && (emp.yukyu_balance || 0) < 3).length

  return (
    <>
      {/* Yukyu Metrics Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Gestión de Yukyus (有給)</h2>
        <p className="text-muted-foreground mb-4">Seguimiento de días de vacaciones pagadas</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Yukyu Disponible"
          value={totalYukyuDays}
          description="Días acumulados en el sistema"
          icon={Calendar}
          trend={{ value: 2, isPositive: true }}
          loading={isLoading}
          variant="large"
          theme="info"
        />
        <MetricCard
          title="Promedio por Empleado"
          value={averageYukyuPerEmployee}
          description="Días de vacaciones promedio"
          icon={Clock}
          trend={{ value: 1, isPositive: true }}
          loading={isLoading}
          variant="default"
          theme="success"
        />
        <MetricCard
          title="Sin Yukyu"
          value={employeesWithoutYukyu}
          description="Empleados sin días disponibles"
          icon={AlertCircle}
          trend={{ value: 0, isPositive: false }}
          loading={isLoading}
          variant="default"
          theme="warning"
        />
        <MetricCard
          title="Yukyu Bajo"
          value={employeesWithLowYukyu}
          description="Menos de 3 días disponibles"
          icon={User}
          trend={{ value: 1, isPositive: false }}
          loading={isLoading}
          variant="default"
          theme="warning"
        />
      </div>

      {/* Yukyu Distribution Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Yukyu</CardTitle>
            <CardDescription>Análisis de días disponibles por rango</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Yukyu Ranges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">0 días (Sin yukyu)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-red-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-500"
                        style={{
                          width: `${employeeItems.length > 0 ? (employeesWithoutYukyu / employeeItems.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{employeesWithoutYukyu}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">1-3 días (Bajo)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600 transition-all duration-500"
                        style={{
                          width: `${employeeItems.length > 0 ? (employeesWithLowYukyu / employeeItems.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{employeesWithLowYukyu}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">4+ días (Adecuado)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-green-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 transition-all duration-500"
                        style={{
                          width: `${employeeItems.length > 0 ? ((employeeItems.length - employeesWithoutYukyu - employeesWithLowYukyu) / employeeItems.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {employeeItems.length - employeesWithoutYukyu - employeesWithLowYukyu}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Yukyu Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Empleados con Mayor Yukyu</CardTitle>
            <CardDescription>Ranking de días acumulados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : employeeItems.length > 0 ? (
                employeeItems
                  .sort((a: any, b: any) => (b.yukyu_balance || 0) - (a.yukyu_balance || 0))
                  .slice(0, 10)
                  .map((emp: any, index: number) => (
                    <div key={emp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                        <span className="text-sm">
                          {emp.full_name_roman || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">{emp.yukyu_balance || 0}</span>
                        <span className="text-xs text-muted-foreground">días</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay datos de empleados disponibles
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Yukyu Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="border-l-4 border-primary/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Total de Empleados</p>
                <p className="text-2xl font-bold">{employeeItems.length}</p>
              </div>
              <div className="border-l-4 border-blue-500/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Máximo Yukyu Individual</p>
                <p className="text-2xl font-bold text-blue-600">
                  {employeeItems.length > 0
                    ? Math.max(...employeeItems.map((emp: any) => emp.yukyu_balance || 0))
                    : 0}
                </p>
              </div>
              <div className="border-l-4 border-green-500/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Mínimo Yukyu Individual</p>
                <p className="text-2xl font-bold text-green-600">
                  {employeeItems.length > 0
                    ? Math.min(...employeeItems.map((emp: any) => emp.yukyu_balance || 0))
                    : 0}
                </p>
              </div>
              <div className="border-l-4 border-amber-500/50 pl-4 py-2">
                <p className="text-xs text-muted-foreground">Tasa de Cobertura</p>
                <p className="text-2xl font-bold text-amber-600">
                  {employeeItems.length > 0
                    ? Math.round(
                      ((employeeItems.length - employeesWithoutYukyu) / employeeItems.length) * 100
                    )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
