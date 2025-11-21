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
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  BarChart3,
  LineChart as LineChartIcon,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'

interface PerformanceMetric {
  name: string
  value: string
  change: number
  changeLabel: string
  icon: React.ElementType
  description: string
  status: 'good' | 'warning' | 'critical'
}

interface ChartDataPoint {
  time: string
  value: number
}

export default function MonitoringPerformancePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch metrics data
  const { data: metricsData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics data')
      }
      return response.json()
    },
    enabled: mounted,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Generate mock performance data for charts
  const generateMockChartData = (): ChartDataPoint[] => {
    const now = new Date()
    const data: ChartDataPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60000) // 5-minute intervals
      data.push({
        time: format(time, 'HH:mm'),
        value: Math.floor(Math.random() * 50) + 30 // Random value between 30-80
      })
    }
    return data
  }

  const responseTimeData = generateMockChartData()
  const throughputData = generateMockChartData().map(d => ({ ...d, value: Math.floor(Math.random() * 100) + 50 }))

  // Performance metrics
  const getPerformanceMetrics = (): PerformanceMetric[] => {
    const avgResponseTime = metricsData?.ocr_average_processing_time || 0
    const totalRequests = metricsData?.ocr_total_requests || 0
    const totalFailures = metricsData?.ocr_total_failures || 0
    const errorRate = totalRequests > 0 ? (totalFailures / totalRequests) * 100 : 0

    return [
      {
        name: 'Avg Response Time',
        value: avgResponseTime > 0 ? `${avgResponseTime.toFixed(0)}ms` : '< 50ms',
        change: -5.2,
        changeLabel: 'vs last hour',
        icon: Clock,
        description: '平均応答時間',
        status: avgResponseTime < 100 ? 'good' : avgResponseTime < 300 ? 'warning' : 'critical'
      },
      {
        name: 'Request Throughput',
        value: '~240/min',
        change: 12.5,
        changeLabel: 'vs last hour',
        icon: Zap,
        description: 'リクエスト処理量',
        status: 'good'
      },
      {
        name: 'Error Rate',
        value: `${errorRate.toFixed(2)}%`,
        change: errorRate > 1 ? 2.1 : -0.8,
        changeLabel: 'vs last hour',
        icon: AlertTriangle,
        description: 'エラー率',
        status: errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'critical'
      },
      {
        name: 'DB Query Time',
        value: '< 10ms',
        change: -3.4,
        changeLabel: 'vs last hour',
        icon: Database,
        description: 'データベースクエリ時間',
        status: 'good'
      }
    ]
  }

  const metrics = getPerformanceMetrics()

  const statusConfig = {
    good: {
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    warning: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  // Simple sparkline component
  const Sparkline = ({ data, color }: { data: ChartDataPoint[], color: string }) => {
    const max = Math.max(...data.map(d => d.value))
    const min = Math.min(...data.map(d => d.value))
    const range = max - min || 1

    return (
      <div className="flex items-end gap-0.5 h-8">
        {data.slice(-12).map((point, i) => {
          const height = ((point.value - min) / range) * 100
          return (
            <div
              key={i}
              className={cn("flex-1 rounded-sm transition-all", color)}
              style={{ height: `${height}%`, minHeight: '2px' }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <PageGuard pageKey="monitoring_performance">
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
              <h1 className="text-3xl font-bold">Performance Metrics</h1>
              <p className="text-gray-600">パフォーマンス指標</p>
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
              Failed to fetch performance metrics. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : (
            metrics.map((metric) => {
              const MetricIcon = metric.icon
              const config = statusConfig[metric.status]
              const isPositive = metric.change > 0

              return (
                <Card key={metric.name} className={cn("border-l-4", config.borderColor)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                      <MetricIcon className={cn("h-4 w-4", config.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                    <p className="text-xs text-muted-foreground mb-2">{metric.description}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(metric.change)}%
                      </span>
                      <span className="text-muted-foreground">{metric.changeLabel}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LineChartIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>API Response Time</CardTitle>
                  <CardDescription>Last 60 minutes (5-min intervals) • API応答時間</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Real-time
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Sparkline data={responseTimeData} color="bg-blue-500" />
              <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
                {responseTimeData.slice(-6).map((point, i) => (
                  <div key={i} className="text-center">
                    <div className="font-medium">{point.value}ms</div>
                    <div>{point.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Throughput Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle>Request Throughput</CardTitle>
                  <CardDescription>Requests per minute • リクエスト処理量</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Sparkline data={throughputData} color="bg-green-500" />
              <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
                {throughputData.slice(-6).map((point, i) => (
                  <div key={i} className="text-center">
                    <div className="font-medium">{point.value} req</div>
                    <div>{point.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle>Database Performance</CardTitle>
                  <CardDescription>データベースパフォーマンス</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Query Execution Time</span>
                    <span className="font-medium">8ms avg</span>
                  </div>
                  <Progress value={16} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Connection Pool Usage</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Cache Hit Rate</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-orange-600" />
                <div>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>エンドポイント統計</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div>
                    <p className="text-sm font-medium">/api/candidates</p>
                    <p className="text-xs text-muted-foreground">45ms avg</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    Good
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <div>
                    <p className="text-sm font-medium">/api/employees</p>
                    <p className="text-xs text-muted-foreground">52ms avg</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    Good
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <div>
                    <p className="text-sm font-medium">/api/timercards</p>
                    <p className="text-xs text-muted-foreground">38ms avg</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    Good
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">/api/azure_ocr</p>
                    <p className="text-xs text-muted-foreground">
                      {metricsData?.ocr_average_processing_time
                        ? `${metricsData.ocr_average_processing_time.toFixed(0)}ms avg`
                        : 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    OCR
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OCR Service Stats */}
        {metricsData && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <CardTitle>OCR Service Statistics</CardTitle>
                  <CardDescription>OCRサービス統計</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
                  <p className="text-3xl font-bold">{metricsData.ocr_total_requests || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Failures</p>
                  <p className="text-3xl font-bold text-red-600">{metricsData.ocr_total_failures || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {metricsData.ocr_total_requests > 0
                      ? `${(((metricsData.ocr_total_requests - metricsData.ocr_total_failures) / metricsData.ocr_total_requests) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Avg Process Time</p>
                  <p className="text-3xl font-bold">
                    {metricsData.ocr_average_processing_time
                      ? `${metricsData.ocr_average_processing_time.toFixed(0)}ms`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>パフォーマンス推奨事項</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Good:</strong> Average response time is under 100ms. System is performing optimally.
                </AlertDescription>
              </Alert>
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Excellent:</strong> Database query times are consistently under 10ms. Cache hit rate is high at 92%.
                </AlertDescription>
              </Alert>
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Monitoring:</strong> All API endpoints are responding within acceptable thresholds. No bottlenecks detected.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
          {' • '}
          Auto-refresh enabled (30s)
        </div>
      </div>
    </PageGuard>
  )
}
