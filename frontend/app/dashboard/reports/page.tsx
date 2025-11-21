'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Building2,
  TrendingUp,
  FileText,
  Filter
} from 'lucide-react';
import { useState } from 'react';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportType, setReportType] = useState('all');

  const reportCategories = [
    {
      id: 'payroll',
      title: '給与レポート (Nómina)',
      description: 'Reportes de cálculos de salarios y pagos',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      reports: [
        { name: 'Reporte Mensual de Nómina', format: 'PDF/Excel', lastGenerated: '2025-10-15' },
        { name: 'Desglose de Horas Extra', format: 'Excel', lastGenerated: '2025-10-14' },
        { name: 'Deducciones y Bonificaciones', format: 'PDF', lastGenerated: '2025-10-13' },
      ]
    },
    {
      id: 'attendance',
      title: 'タイムカードレポート (Asistencia)',
      description: 'Reportes de control de horas y asistencia',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      reports: [
        { name: 'Resumen de Asistencia Mensual', format: 'PDF/Excel', lastGenerated: '2025-10-15' },
        { name: 'Horas Trabajadas por Empleado', format: 'Excel', lastGenerated: '2025-10-14' },
        { name: 'Turnos y Horarios (朝番/昼番/夜番)', format: 'PDF', lastGenerated: '2025-10-12' },
      ]
    },
    {
      id: 'employees',
      title: '社員レポート (Empleados)',
      description: 'Reportes de personal y recursos humanos',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      reports: [
        { name: 'Lista de Empleados Activos', format: 'Excel', lastGenerated: '2025-10-15' },
        { name: 'Nuevas Contrataciones', format: 'PDF', lastGenerated: '2025-10-10' },
        { name: 'Renovaciones de Contratos', format: 'Excel', lastGenerated: '2025-10-08' },
      ]
    },
    {
      id: 'factories',
      title: '派遣先レポート (Clientes)',
      description: 'Reportes de empresas cliente y asignaciones',
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      reports: [
        { name: 'Empleados por Fábrica', format: 'PDF/Excel', lastGenerated: '2025-10-14' },
        { name: 'Evaluación de Clientes', format: 'PDF', lastGenerated: '2025-10-11' },
        { name: 'Contratos y Renovaciones', format: 'Excel', lastGenerated: '2025-10-09' },
      ]
    },
    {
      id: 'analytics',
      title: '分析レポート (Analíticas)',
      description: 'Reportes estadísticos y tendencias',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      reports: [
        { name: 'KPIs Mensuales', format: 'PDF', lastGenerated: '2025-10-15' },
        { name: 'Análisis de Productividad', format: 'Excel', lastGenerated: '2025-10-12' },
        { name: 'Tendencias de Rotación', format: 'PDF', lastGenerated: '2025-10-10' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Reportes
          </h1>
          <p className="text-muted-foreground mt-1">
            Generación y descarga de reportes del sistema
          </p>
        </div>
        <Button className="gap-2 hover:bg-accent hover:text-accent-foreground">
          <Download className="h-4 w-4" />
          Descargar Múltiples
        </Button>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Reportes
          </CardTitle>
          <CardDescription>
            Selecciona el período y tipo de reporte que deseas generar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los reportes</SelectItem>
                  <SelectItem value="payroll">Nómina</SelectItem>
                  <SelectItem value="attendance">Asistencia</SelectItem>
                  <SelectItem value="employees">Empleados</SelectItem>
                  <SelectItem value="factories">Clientes</SelectItem>
                  <SelectItem value="analytics">Analíticas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select defaultValue="pdf">
                <SelectTrigger id="format">
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Categories */}
      <div className="grid gap-6">
        {reportCategories
          .filter(category => reportType === 'all' || reportType === category.id)
          .map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {category.reports.length} reportes
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.reports.map((report, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>Último: {new Date(report.lastGenerated).toLocaleDateString('es-ES')}</span>
                              <span>•</span>
                              <span>Formato: {report.format}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2 hover:bg-accent hover:text-accent-foreground">
                            <Download className="h-4 w-4" />
                            Descargar
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-accent hover:text-accent-foreground">
                            Generar Nuevo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Reportes frecuentemente utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="justify-start gap-3 h-auto py-3 hover:bg-accent hover:text-accent-foreground">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Reporte de Nómina del Mes Actual</p>
                <p className="text-xs text-muted-foreground">Generar PDF con todos los cálculos</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-auto py-3 hover:bg-accent hover:text-accent-foreground">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Resumen de Asistencia Semanal</p>
                <p className="text-xs text-muted-foreground">Últimos 7 días de タイムカード</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-auto py-3 hover:bg-accent hover:text-accent-foreground">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Lista Completa de Empleados</p>
                <p className="text-xs text-muted-foreground">Excel con todos los datos actuales</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-3 h-auto py-3 hover:bg-accent hover:text-accent-foreground">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <div className="text-left">
                <p className="font-medium">Dashboard Ejecutivo</p>
                <p className="text-xs text-muted-foreground">KPIs y métricas principales</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Sistema de Reportes Automatizado
              </p>
              <p className="text-blue-700">
                Los reportes se generan automáticamente basados en los datos más recientes del sistema.
                Puedes programar reportes recurrentes o descargarlos bajo demanda en múltiples formatos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
