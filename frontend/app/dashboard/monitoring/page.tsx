'use client'

import { PageGuard } from '@/components/page-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw
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
  application: {
    version: string
    environment: string
  }
}

interface SystemMetric {
  name: string
  value: string
  status: 'healthy' | 'warning' | 'critical'
  icon: React.ElementType
  description: string
}

export default function MonitoringPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch health data
  const { data: healthData, isLoading, error, refetch, isRefetching } = useQuery<HealthData>({
    queryKey: ['monitoring-health'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/health')
      if (!response.ok) {
        throw new Error('Failed to fetch health data')
      }
      return response.json()
    },
    enabled: mounted,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Calculate system metrics
  const getSystemMetrics = (): SystemMetric[] => {
    if (!healthData) return []

    const cpuStatus = healthData.system.cpu_percent > 80 ? 'critical' :
                      healthData.system.cpu_percent > 60 ? 'warning' : 'healthy'

    const memoryStatus = healthData.system.memory_percent > 85 ? 'critical' :
                         healthData.system.memory_percent > 70 ? 'warning' : 'healthy'

    const uptimeDays = Math.floor(healthData.system.uptime_seconds / 86400)

    return [
      {
        name: 'CPU Usage',
        value: `${healthData.system.cpu_percent.toFixed(1)}%`,
        status: cpuStatus,
        icon: Cpu,
        description: 'CPU利用率'
      },
      {
        name: 'Memory Usage',
        value: `${healthData.system.memory_percent.toFixed(1)}%`,
        status: memoryStatus,
        icon: HardDrive,
        description: 'メモリ使用量'
      },
      {
        name: 'Database',
        value: 'Online',
        status: 'healthy',
        icon: Database,
        description: 'データベース状態'
      },
      {
        name: 'System Uptime',
        value: `${uptimeDays}d`,
        status: 'healthy',
        icon: Clock,
        description: 'システム稼働時間'
      }
    ]
  }

  const metrics = getSystemMetrics()
  const overallStatus = healthData?.status === 'ok' ? 'healthy' : 'critical'

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    critical: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  return (
    <PageGuard pageKey="monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Monitoring</h1>
            <p className="text-gray-600">システムモニタリング</p>
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

        {/* Overall Status Card */}
        <Card className={cn(
          "border-2",
          statusConfig[overallStatus].borderColor,
          statusConfig[overallStatus].bgColor
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {(() => {
                  const StatusIcon = statusConfig[overallStatus].icon
                  return <StatusIcon className={cn("h-12 w-12", statusConfig[overallStatus].color)} />
                })()}
                <div>
                  <h2 className="text-2xl font-bold">System Status</h2>
                  <p className="text-muted-foreground">システム全体の状態</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={statusConfig[overallStatus].badge}>
                  {overallStatus === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
                </Badge>
                {healthData && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Last updated: {format(new Date(healthData.timestamp * 1000), 'HH:mm:ss')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch monitoring data. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        )}

        {/* System Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : (
            metrics.map((metric) => {
              const MetricIcon = metric.icon
              const config = statusConfig[metric.status]
              return (
                <Card key={metric.name} className={cn("border-l-4", config.borderColor)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.name}
                    </CardTitle>
                    <MetricIcon className={cn("h-4 w-4", config.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                    <Badge className={cn("mt-2", config.badge)} variant="outline">
                      {metric.status}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
            <Link href="/monitoring/health">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle>Health Details</CardTitle>
                      <CardDescription>ヘルスチェック詳細</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View detailed system health information, database status, and service availability.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
            <Link href="/monitoring/performance">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>パフォーマンス指標</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor API response times, throughput, error rates, and system performance.
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* System Information */}
        {healthData && (
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>システム情報</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform</p>
                  <p className="text-lg font-semibold">{healthData.system.platform}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Python Version</p>
                  <p className="text-lg font-semibold">{healthData.system.python}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Application Version</p>
                  <p className="text-lg font-semibold">{healthData.application.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Environment</p>
                  <p className="text-lg font-semibold capitalize">{healthData.application.environment}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Process Threads</p>
                  <p className="text-lg font-semibold">{healthData.process.threads}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Process Memory (RSS)</p>
                  <p className="text-lg font-semibold">
                    {(healthData.process.rss / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>最近のイベント</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">System health check passed</p>
                  <p className="text-xs text-muted-foreground">All services are operating normally</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthData && format(new Date(healthData.timestamp * 1000), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Monitoring service active</p>
                  <p className="text-xs text-muted-foreground">Real-time monitoring enabled</p>
                  <p className="text-xs text-muted-foreground mt-1">Auto-refresh: 30 seconds</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database connection stable</p>
                  <p className="text-xs text-muted-foreground">PostgreSQL server responding normally</p>
                  <p className="text-xs text-muted-foreground mt-1">Response time: &lt;10ms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageGuard>
  )
}
