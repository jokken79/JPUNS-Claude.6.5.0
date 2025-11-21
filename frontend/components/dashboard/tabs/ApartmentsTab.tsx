'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Home, Users, DollarSign, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ApartmentsTabProps {
  stats: any
  dashboardData: any
  isLoading: boolean
}

/**
 * ApartmentsTab - Corporate housing management
 * Contains: Occupancy rates, housing metrics, costs analysis
 */
export function ApartmentsTab({
  stats,
  dashboardData,
  isLoading,
}: ApartmentsTabProps) {
  // Calculate apartment statistics
  const occupancyRate = stats.totalEmployees > 0
    ? Math.round((stats.employeesInCorporateHousing / stats.totalEmployees) * 100)
    : 0

  const emptyHousingUnits = Math.max(0, 50 - stats.employeesInCorporateHousing) // Assuming 50 total units
  const occupancyTrend = occupancyRate > 70 ? true : occupancyRate < 40 ? false : true

  return (
    <>
      {/* Corporate Housing Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Gestión de 社宅 (Corporate Housing)</h2>
        <p className="text-muted-foreground mb-4">Seguimiento de alojamiento corporativo</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Empleados Alojados"
          value={stats.employeesInCorporateHousing}
          description="En unidades corporativas"
          icon={Users}
          trend={{ value: occupancyTrend ? 5 : -2, isPositive: occupancyTrend }}
          loading={isLoading}
          variant="large"
          theme="info"
        />
        <MetricCard
          title="Tasa de Ocupación"
          value={`${occupancyRate}%`}
          description="Del total de empleados"
          icon={Home}
          trend={{ value: 3, isPositive: true }}
          loading={isLoading}
          variant="default"
          theme="success"
        />
        <MetricCard
          title="Unidades Disponibles"
          value={emptyHousingUnits}
          description="De 50 unidades totales"
          icon={Building2}
          trend={{ value: 1, isPositive: true }}
          loading={isLoading}
          variant="default"
          theme="default"
        />
        <MetricCard
          title="Gasto Mensual Est."
          value="¥1,250K"
          description="Mantenimiento y servicios"
          icon={DollarSign}
          trend={{ value: 2, isPositive: false }}
          loading={isLoading}
          variant="default"
          theme="warning"
        />
      </div>

      {/* Housing Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Detalles de Alojamiento</CardTitle>
            <CardDescription>Información completa sobre housing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Occupancy Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tasa de Ocupación</span>
                  <span className="text-sm font-semibold">{occupancyRate}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyRate}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.employeesInCorporateHousing} de aproximadamente 50 unidades
                </p>
              </div>

              {/* Key Stats */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="border-l-4 border-primary/50 pl-3 py-2">
                  <p className="text-xs text-muted-foreground">Total de Unidades</p>
                  <p className="text-xl font-bold">50</p>
                </div>
                <div className="border-l-4 border-green-500/50 pl-3 py-2">
                  <p className="text-xs text-muted-foreground">Ocupadas</p>
                  <p className="text-xl font-bold text-green-600">{stats.employeesInCorporateHousing}</p>
                </div>
                <div className="border-l-4 border-amber-500/50 pl-3 py-2">
                  <p className="text-xs text-muted-foreground">Disponibles</p>
                  <p className="text-xl font-bold text-amber-600">{emptyHousingUnits}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Housing Benefits Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Beneficios</CardTitle>
            <CardDescription>Rentabilidad y utilización</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                <span className="text-sm">Costo Mensual Promedio por Empleado</span>
                <span className="font-semibold">¥25,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                <span className="text-sm">Beneficio de Retención Estimado</span>
                <span className="font-semibold">¥500K+</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg">
                <span className="text-sm">Costo Anual Total</span>
                <span className="font-semibold">¥15M</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg">
                <span className="text-sm">ROI Proyectado</span>
                <span className="font-semibold">8.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Housing Status Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Estado General</CardTitle>
            <CardDescription>Resumen del programa de housing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${occupancyRate > 70 ? 'bg-green-500' : occupancyRate > 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {occupancyRate > 70 ? 'Ocupación Óptima' : occupancyRate > 40 ? 'Ocupación Normal' : 'Baja Ocupación'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {occupancyRate > 70
                  ? 'El programa de housing está funcionando bien con alta demanda.'
                  : occupancyRate > 40
                  ? 'El programa de housing tiene buena ocupación.'
                  : 'Considere estrategias para aumentar la participación en el programa.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
