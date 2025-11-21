'use client';

/**
 * Payroll Run Details Page
 * Página de detalles de una ejecución de nómina
 */
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { payrollAPI, PayrollRun, EmployeePayrollResult } from '@/lib/payroll-api';
import { usePayrollStore } from '@/stores/payroll-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollStatusBadge } from '@/components/payroll/payroll-status-badge';
import { PayrollSummaryCard } from '@/components/payroll/payroll-summary-card';
import { PayrollEmployeeTable } from '@/components/payroll/payroll-employee-table';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Settings,
  History,
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function PayrollRunDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { setLoading, loading } = usePayrollStore();

  const [payrollRun, setPayrollRun] = React.useState<PayrollRun | null>(null);
  const [employees, setEmployees] = React.useState<EmployeePayrollResult[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [processingAction, setProcessingAction] = React.useState(false);

  const payrollRunId = parseInt(params.id as string);

  // Load data
  React.useEffect(() => {
    if (payrollRunId) {
      loadPayrollData();
    }
  }, [payrollRunId]);

  const loadPayrollData = async () => {
    try {
      setLoadingData(true);

      // Load payroll run details
      const run = await payrollAPI.getPayrollRun(payrollRunId);
      setPayrollRun(run);

      // Load employees in this run
      try {
        const employeesData = await payrollAPI.getPayrollRunEmployees(payrollRunId);
        setEmployees(employeesData);
      } catch (empError) {
        // Employees might not be loaded yet
        setEmployees([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al cargar datos',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      setProcessingAction(true);
      await payrollAPI.approvePayrollRun(payrollRunId, {
        approved_by: 'admin', // TODO: Get from auth context
        notes: 'Aprobado desde la interfaz',
      });

      toast({
        title: 'Payroll aprobado',
        description: 'El payroll ha sido aprobado exitosamente',
      });

      await loadPayrollData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al aprobar payroll',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async () => {
    try {
      setProcessingAction(true);
      await payrollAPI.markPayrollRunAsPaid(payrollRunId);

      toast({
        title: 'Payroll marcado como pagado',
        description: 'El payroll ha sido marcado como pagado',
      });

      await loadPayrollData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al marcar como pagado',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setProcessingAction(true);
      await payrollAPI.deletePayrollRun(payrollRunId);

      toast({
        title: 'Payroll eliminado',
        description: 'El payroll ha sido eliminado',
      });

      router.push('/payroll');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar payroll',
        variant: 'destructive',
      });
      setProcessingAction(false);
    }
  };

  // Handle generate payslip
  const handleGeneratePayslip = async (employeeId: number) => {
    try {
      setLoading(true);
      const result = await payrollAPI.generatePayslip({
        employee_id: employeeId,
        payroll_run_id: payrollRunId,
      });

      if (result.success && result.pdf_url) {
        // Open PDF in new tab
        window.open(result.pdf_url, '_blank');
        toast({
          title: 'PDF generado',
          description: 'El comprobante de pago ha sido generado',
        });
      } else {
        throw new Error('No se pudo generar el PDF');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al generar PDF',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get available actions based on status
  const getAvailableActions = () => {
    if (!payrollRun) return [];

    const actions = [];

    if (payrollRun.status === 'calculated') {
      actions.push({
        label: 'Aprobar',
        icon: CheckCircle,
        onClick: handleApprove,
        variant: 'default' as const,
      });
    }

    if (payrollRun.status === 'approved') {
      actions.push({
        label: 'Marcar como Pagado',
        icon: DollarSign,
        onClick: handleMarkAsPaid,
        variant: 'default' as const,
      });
    }

    if (['draft', 'calculated'].includes(payrollRun.status)) {
      actions.push({
        label: 'Eliminar',
        icon: Trash2,
        onClick: () => setDeleteDialogOpen(true),
        variant: 'destructive' as const,
      });
    }

    return actions;
  };

  // Loading skeleton
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Not found
  if (!payrollRun) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Payroll Run no encontrado</h2>
              <p className="text-muted-foreground mb-6">
                El payroll run #{payrollRunId} no existe o no tienes permisos para verlo.
              </p>
              <Link href="/payroll">
                <Button>Volver a Payroll</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/payroll">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Payroll Run #{payrollRunId}
                </h1>
                <PayrollStatusBadge status={payrollRun.status} />
              </div>
              <p className="text-muted-foreground">
                {formatDate(payrollRun.pay_period_start)} - {formatDate(payrollRun.pay_period_end)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {getAvailableActions().map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant}
                onClick={action.onClick}
                disabled={processingAction}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <PayrollSummaryCard
            title="Total de Empleados"
            value={payrollRun.total_employees}
            icon={Users}
            iconClassName="bg-blue-500/10 text-blue-500"
          />
          <PayrollSummaryCard
            title="Monto Bruto"
            value={formatCurrency(payrollRun.total_gross_amount)}
            icon={DollarSign}
            iconClassName="bg-green-500/10 text-green-500"
          />
          <PayrollSummaryCard
            title="Deducciones Totales"
            value={formatCurrency(payrollRun.total_deductions)}
            icon={XCircle}
            iconClassName="bg-red-500/10 text-red-500"
          />
          <PayrollSummaryCard
            title="Monto Neto"
            value={formatCurrency(payrollRun.total_net_amount)}
            icon={CheckCircle}
            iconClassName="bg-primary/10 text-primary"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">
              <DollarSign className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="h-4 w-4 mr-2" />
              Empleados
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="h-4 w-4 mr-2" />
              Auditoría
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>Detalles del payroll run</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">#{payrollRun.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <PayrollStatusBadge status={payrollRun.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">
                      {formatDate(payrollRun.pay_period_start)} - {formatDate(payrollRun.pay_period_end)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creado por:</span>
                    <span className="font-medium">{payrollRun.created_by || 'Sistema'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de creación:</span>
                    <span className="font-medium">{formatDate(payrollRun.created_at)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen Financiero</CardTitle>
                  <CardDescription>Totales calculados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empleados:</span>
                    <span className="font-medium">{payrollRun.total_employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto Bruto:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(payrollRun.total_gross_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deducciones:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(payrollRun.total_deductions)}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Monto Neto:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(payrollRun.total_net_amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Empleados en este Payroll</CardTitle>
                <CardDescription>
                  Lista de todos los empleados incluidos en esta ejecución de nómina
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PayrollEmployeeTable
                  employees={employees}
                  onGeneratePayslip={handleGeneratePayslip}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Payroll</CardTitle>
                <CardDescription>
                  Configuraciones utilizadas para este cálculo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Configuración en desarrollo
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Auditoría</CardTitle>
                <CardDescription>
                  Registro de todas las acciones realizadas en este payroll
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-md">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Payroll creado</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payrollRun.created_at)} por {payrollRun.created_by || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  {payrollRun.updated_at !== payrollRun.created_at && (
                    <div className="flex items-start gap-4 p-4 bg-muted rounded-md">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Última actualización</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payrollRun.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar Payroll Run?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el payroll run #{payrollRunId} y todos los datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={processingAction}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={processingAction}
              >
                {processingAction ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
