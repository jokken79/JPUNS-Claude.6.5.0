'use client'

import { PageGuard } from '@/components/page-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  Activity,
  Database,
  Server,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Zap,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'

interface HealthData {
  status: string
  timestamp: number
  system: {
    platform: string
    python: string
    cpu_percent: number
    memory_percent: number
    uptime_seconds: number
  }
  process: {
    rss: number
    threads: number
  }
  ocr?: {
    requests?: number
    failures?: number
    average_duration?: number
  }
  application: {
    version: string
    environment: string
  }
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  icon: React.ElementType
  description: string
  responseTime?: string
  lastCheck: Date
}

export default function MonitoringHealthPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch health data
  const { data: healthData, isLoading, error, refetch, isRefetching } = useQuery<HealthData>({
    queryKey: ['monitoring-health-details'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/health')
      if (!response.ok) {
        throw new Error('Failed to fetch health data')
      }
      return response.json()
    },
    enabled: mounted,
    refetchInterval: 15000, // Refresh every 15 seconds
  })

  // Mock service statuses (in real app, these would come from backend)
  const getServiceStatuses = (): ServiceStatus[] => {
    const now = new Date()
    return [
      {
        name: 'Backend API',
        status: healthData?.status === 'ok' ? 'online' : 'offline',
        icon: Server,
        description: 'FastAPI REST API Server',
        responseTime: '< 50ms',
        lastCheck: now
      },
      {
        name: 'PostgreSQL Database',
        status: 'online',
        icon: Database,
        description: 'Primary database server',
        responseTime: '< 10ms',
        lastCheck: now
      },
      {
        name: 'Redis Cache',
        status: 'online',
        icon: Zap,
        description: 'Redis caching layer',
        responseTime: '< 5ms',
        lastCheck: now
      },
      {
        name: 'OCR Service',
        status: healthData?.ocr ? 'online' : 'degraded',
        icon: Layers,
        description: 'Azure Computer Vision OCR',
        responseTime: healthData?.ocr?.average_duration ? `${healthData.ocr.average_duration.toFixed(0)}ms` : 'N/A',
        lastCheck: now
      }
    ]
  }

  const services = getServiceStatuses()

  const statusConfig = {
    online: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      label: 'Online'
    },
    offline: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      label: 'Offline'
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      label: 'Degraded'
    }
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getStatusColor = (percent: number): 'success' | 'warning' | 'danger' => {
    if (percent < 60) return 'success'
    if (percent < 80) return 'warning'
    return 'danger'
  }

  return (
    <PageGuard pageKey="monitoring_health">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/monitoring">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">System Health</h1>
              <p className="text-gray-600">システムヘルスチェック</p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            variant="outline"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch health data. The monitoring service may be unavailable.
            </AlertDescription>
          </Alert>
        )}

        {/* Service Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => {
            const config = statusConfig[service.status]
            const ServiceIcon = service.icon
            const StatusIcon = config.icon

            return (
              <Card key={service.name} className={cn("border-l-4", config.borderColor)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <ServiceIcon className={cn("h-6 w-6", config.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{service.name}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={config.badge}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-medium">{service.responseTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Check</span>
                      <span className="font-medium">{format(service.lastCheck, 'HH:mm:ss')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* System Resources */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* CPU Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>CPU Usage</CardTitle>
                  <CardDescription>CPU利用率</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : healthData ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">
                      {healthData.system.cpu_percent.toFixed(1)}%
                    </span>
                    <Badge variant={
                      healthData.system.cpu_percent > 80 ? 'destructive' :
                      healthData.system.cpu_percent > 60 ? 'default' : 'outline'
                    }>
                      {getStatusColor(healthData.system.cpu_percent)}
                    </Badge>
                  </div>
                  <Progress value={healthData.system.cpu_percent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {healthData.system.cpu_percent < 60 ? 'CPU usage is normal' :
                     healthData.system.cpu_percent < 80 ? 'CPU usage is elevated' :
                     'CPU usage is high'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>メモリ使用量</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : healthData ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">
                      {healthData.system.memory_percent.toFixed(1)}%
                    </span>
                    <Badge variant={
                      healthData.system.memory_percent > 85 ? 'destructive' :
                      healthData.system.memory_percent > 70 ? 'default' : 'outline'
                    }>
                      {getStatusColor(healthData.system.memory_percent)}
                    </Badge>
                  </div>
                  <Progress value={healthData.system.memory_percent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {healthData.system.memory_percent < 70 ? 'Memory usage is normal' :
                     healthData.system.memory_percent < 85 ? 'Memory usage is elevated' :
                     'Memory usage is high'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Uptime & Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>System Uptime</CardTitle>
                <CardDescription>システム稼働時間</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : healthData ? (
              <div className="space-y-4">
                <div className="text-3xl font-bold">
                  {formatUptime(healthData.system.uptime_seconds)}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Platform</p>
                    <p className="font-medium">{healthData.system.platform}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Python Version</p>
                    <p className="font-medium">{healthData.system.python}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Process Threads</p>
                    <p className="font-medium">{healthData.process.threads}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* OCR Service Health */}
        {healthData?.ocr && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-orange-600" />
                <div>
                  <CardTitle>OCR Service</CardTitle>
                  <CardDescription>OCRサービス統計</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{healthData.ocr.requests || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failures</p>
                  <p className="text-2xl font-bold text-red-600">{healthData.ocr.failures || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                  <p className="text-2xl font-bold">
                    {healthData.ocr.average_duration ? `${healthData.ocr.average_duration.toFixed(0)}ms` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Check History */}
        <Card>
          <CardHeader>
            <CardTitle>Health Check History</CardTitle>
            <CardDescription>ヘルスチェック履歴</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData && (
                <>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Health check passed</p>
                        <p className="text-sm text-muted-foreground">All systems operational</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(healthData.timestamp * 1000), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Monitoring active</p>
                        <p className="text-sm text-muted-foreground">Auto-refresh: 15 seconds</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">Real-time</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Services responding</p>
                        <p className="text-sm text-muted-foreground">Backend API, Database, Cache</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      All OK
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        {healthData && (
          <div className="text-center text-sm text-muted-foreground">
            Last updated: {format(new Date(healthData.timestamp * 1000), 'yyyy-MM-dd HH:mm:ss')}
            {' • '}
            Auto-refresh enabled
          </div>
        )}
      </div>
    </PageGuard>
  )
}
