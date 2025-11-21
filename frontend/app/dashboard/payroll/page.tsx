'use client';

/**
 * Payroll Dashboard - Página principal
 * Dashboard principal del sistema de payroll
 */
import { useEffect, useState } from 'react';
import { usePayrollStore } from '@/stores/payroll-store';
import { payrollAPI } from '@/lib/payroll-api';
import Link from 'next/link';

export default function PayrollPage() {
  const {
    payrollSummary,
    setPayrollSummary,
    loading,
    setLoading,
    error,
    setError,
    clearError,
  } = usePayrollStore();

  const [stats, setStats] = useState({
    totalRuns: 0,
    totalEmployees: 0,
    totalAmount: 0,
    pendingRuns: 0,
  });

  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      clearError();

      const summary = await payrollAPI.getPayrollSummary({ limit: 50 });
      setPayrollSummary(summary);

      // Calculate stats
      const totalRuns = summary.length;
      const totalEmployees = summary.reduce((acc, run) => acc + run.total_employees, 0);
      const totalAmount = summary.reduce((acc, run) => acc + run.total_net_amount, 0);
      const pendingRuns = summary.filter((run) => run.status === 'draft').length;

      setStats({
        totalRuns,
        totalEmployees,
        totalAmount,
        pendingRuns,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de payroll');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: 'bg-muted text-muted-foreground',
      calculated: 'bg-info text-info-foreground',
      approved: 'bg-success text-success-foreground',
      paid: 'bg-primary text-primary-foreground',
      cancelled: 'bg-destructive text-destructive-foreground',
    };

    const statusLabels = {
      draft: 'Borrador',
      calculated: 'Calculado',
      approved: 'Aprobado',
      paid: 'Pagado',
      cancelled: 'Cancelado',
    };

    return (
      <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${statusMap[status as keyof typeof statusMap]}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sistema de Payroll</h1>
            <p className="text-muted-foreground mt-2">
              Gestión completa de nóminas y cálculos salariales
            </p>
          </div>
          <Link
            href="/payroll/create"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-medium transition-colors"
          >
            Nueva Ejecución de Payroll
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-destructive hover:text-destructive/80 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-md shadow-sm border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Ejecuciones</h3>
            <p className="text-3xl font-bold text-primary">{stats.totalRuns}</p>
          </div>

          <div className="bg-card p-6 rounded-md shadow-sm border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Empleados</h3>
            <p className="text-3xl font-bold text-success">{stats.totalEmployees}</p>
          </div>

          <div className="bg-card p-6 rounded-md shadow-sm border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Monto Total Pagado</h3>
            <p className="text-2xl font-bold text-info">{formatCurrency(stats.totalAmount)}</p>
          </div>

          <div className="bg-card p-6 rounded-md shadow-sm border border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Ejecuciones Pendientes</h3>
            <p className="text-3xl font-bold text-warning">{stats.pendingRuns}</p>
          </div>
        </div>

      {/* Quick Actions */}
      <div className="bg-card p-6 rounded-md shadow-sm border border-border mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/payroll/calculate"
            className="flex items-center p-4 border-2 border-dashed border-border rounded-md hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Calcular Payroll Individual</h3>
              <p className="text-sm text-muted-foreground">Calcular salario para un empleado</p>
            </div>
          </Link>

          <Link
            href="/payroll/settings"
            className="flex items-center p-4 border-2 border-dashed border-border rounded-md hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Configuración</h3>
              <p className="text-sm text-muted-foreground">Ajustar tasas y parámetros</p>
            </div>
          </Link>

          <Link
            href="/payroll/timer-cards"
            className="flex items-center p-4 border-2 border-dashed border-border rounded-md hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Timer Cards</h3>
              <p className="text-sm text-muted-foreground">Subir y procesar timer cards</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Payroll Summary Table */}
      <div className="bg-card rounded-md shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Resumen de Payroll</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando datos...</p>
          </div>
        ) : payrollSummary.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No hay ejecuciones de payroll registradas</p>
            <Link
              href="/payroll/create"
              className="mt-4 inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
            >
              Crear Primera Ejecución
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Empleados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Monto Bruto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Monto Neto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {payrollSummary.map((run) => (
                  <tr key={run.payroll_run_id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {formatDate(run.pay_period_start)} - {formatDate(run.pay_period_end)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(run.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {run.total_employees}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatCurrency(run.total_gross_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(run.total_net_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/payroll/${run.payroll_run_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
