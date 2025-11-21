'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Download, FileText, RotateCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ReportsTabProps {
  dashboardData: any
  candidates: any
  isLoading: boolean
  onRefresh: () => void
}

/**
 * ReportsTab - Reports and activity tracking
 * Contains: Recent activity, pending items, recent candidates, exports
 */
export function ReportsTab({
  dashboardData,
  candidates,
  isLoading,
  onRefresh,
}: ReportsTabProps) {
  const candidateItems = Array.isArray(candidates) ? candidates : (candidates?.items || [])

  return (
    <>
      {/* Reports Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Reportes y Actividades</h2>
          <p className="text-muted-foreground">Seguimiento de actividad reciente y elementos pendientes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href="/reports/export">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </a>
          </Button>
        </div>
      </div>

      {/* Recent Activity & Pending Items Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Cargando...</div>
                ) : dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.slice(0, 8).map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      className="flex items-start gap-3 border-l-2 border-primary/20 pl-4 pb-4 last:pb-0 last:border-l-0"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{' '}
                            <span className="text-muted-foreground">{activity.description}</span>
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(activity.timestamp), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No hay actividad reciente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Items / Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Elementos Pendientes
              </CardTitle>
              <CardDescription>Acciones que requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Cargando...</div>
                ) : dashboardData?.upcomingItems && dashboardData.upcomingItems.length > 0 ? (
                  dashboardData.upcomingItems.slice(0, 6).map((item, index) => {
                    const priorityColors = {
                      high: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
                      medium: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
                      low: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
                    };

                    return (
                      <motion.div
                        key={item.id}
                        className={cn(
                          'p-3 rounded-lg border-l-4',
                          priorityColors[item.priority]
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(item.dueDate, 'dd MMM', { locale: es })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No hay elementos pendientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Candidatos Recientes</CardTitle>
            <CardDescription>Últimos registros de 履歴書</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
              ) : candidateItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Nombre</th>
                        <th className="text-left py-2 px-2 font-medium">Estado</th>
                        <th className="text-left py-2 px-2 font-medium">Fecha</th>
                        <th className="text-left py-2 px-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidateItems.slice(0, 10).map((candidate: any) => (
                        <motion.tr
                          key={candidate.id}
                          className="border-b hover:bg-muted/50 transition-colors"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="py-2 px-2">
                            <p className="font-medium">
                              {candidate.name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Sin nombre'}
                            </p>
                          </td>
                          <td className="py-2 px-2">
                            <span className={cn(
                              'inline-block px-2 py-1 rounded text-xs font-medium',
                              candidate.status === 'approved' ? 'bg-green-100 text-green-800' :
                              candidate.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {candidate.status || 'pendiente'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {candidate.created_at ? format(new Date(candidate.created_at), 'dd MMM yyyy', { locale: es }) : '-'}
                          </td>
                          <td className="py-2 px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={`/candidates/${candidate.id}`}>Ver</a>
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No hay candidatos recientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Opciones de Exportación
            </CardTitle>
            <CardDescription>Genera reportes en múltiples formatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-2"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">PDF Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-2"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">Excel Export</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-2"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">CSV Export</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-2"
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">Email Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
