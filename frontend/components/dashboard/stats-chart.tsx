'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
} from 'recharts';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Datos de ejemplo - Últimos 6 meses
const mockData = [
  {
    month: 'Ene',
    monthFull: 'Enero',
    employees: 45,
    hours: 3600,
    salary: 7200000,
    factories: 6,
  },
  {
    month: 'Feb',
    monthFull: 'Febrero',
    employees: 52,
    hours: 4160,
    salary: 8320000,
    factories: 7,
  },
  {
    month: 'Mar',
    monthFull: 'Marzo',
    employees: 48,
    hours: 3840,
    salary: 7680000,
    factories: 7,
  },
  {
    month: 'Abr',
    monthFull: 'Abril',
    employees: 61,
    hours: 4880,
    salary: 9760000,
    factories: 8,
  },
  {
    month: 'May',
    monthFull: 'Mayo',
    employees: 58,
    hours: 4640,
    salary: 9280000,
    factories: 8,
  },
  {
    month: 'Jun',
    monthFull: 'Junio',
    employees: 65,
    hours: 5200,
    salary: 10400000,
    factories: 8,
  },
];

export type TimePeriod = '7days' | '30days' | '90days' | '1year';

interface StatsChartProps {
  data?: typeof mockData;
  title?: string;
  description?: string;
  showPeriodSelector?: boolean;
  onPeriodChange?: (period: TimePeriod) => void;
  showExportButton?: boolean;
  onExport?: () => void;
}

export function StatsChart({
  data = mockData,
  title = 'Tendencias del Sistema',
  description = 'Evolución de empleados, horas y nómina',
  showPeriodSelector = true,
  onPeriodChange,
  showExportButton = false,
  onExport,
}: StatsChartProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const handleExport = () => {
    onExport?.();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-xs flex items-center gap-2"
              style={{ color: entry.color }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span>{entry.name}:</span>
              <span className="font-semibold">
                {entry.name.includes('Nómina')
                  ? `¥${(entry.value / 1000000).toFixed(1)}M`
                  : entry.value.toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            {showPeriodSelector && (
              <div className="flex items-center gap-1 border rounded-lg p-1">
                {(['7days', '30days', '90days', '1year'] as TimePeriod[]).map((period) => {
                  const labels = {
                    '7days': '7D',
                    '30days': '30D',
                    '90days': '90D',
                    '1year': '1A',
                  };
                  return (
                    <button
                      key={period}
                      onClick={() => handlePeriodChange(period)}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                        selectedPeriod === period
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      {labels[period]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Export Button */}
            {showExportButton && (
              <button
                onClick={handleExport}
                className="px-3 py-1 text-xs font-medium rounded-md border hover:bg-muted transition-colors"
              >
                Exportar
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="employees">Empleados & Horas</TabsTrigger>
            <TabsTrigger value="salary">Nómina</TabsTrigger>
          </TabsList>

          {/* Vista General - Gráfico Combinado */}
          <TabsContent value="overview" className="mt-0">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="employees"
                  fill="hsl(var(--primary))"
                  name="Empleados"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={3}
                  name="Horas Totales"
                  dot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Empleados y Horas */}
          <TabsContent value="employees" className="mt-0">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="employees"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEmployees)"
                  name="Empleados"
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHours)"
                  name="Horas Totales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Nómina */}
          <TabsContent value="salary" className="mt-0">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  tickFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                />
                <Legend />
                <Bar
                  dataKey="salary"
                  fill="hsl(var(--chart-1))"
                  name="Nómina Total"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Gráfico simple de líneas
export function SimpleLineChart({
  data = mockData,
  title,
  description,
}: StatsChartProps) {
  return (
    <Card>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="employees"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
