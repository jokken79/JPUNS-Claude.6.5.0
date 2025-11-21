'use client';

/**
 * Create Payroll Run Page
 * Página para crear una nueva ejecución de nómina
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { payrollAPI, PayrollRunCreate } from '@/lib/payroll-api';
import { usePayrollStore } from '@/stores/payroll-store';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

// Validation schema
const createPayrollSchema = z.object({
  pay_period_start: z.string().min(1, 'Fecha de inicio requerida'),
  pay_period_end: z.string().min(1, 'Fecha de fin requerida'),
  employee_ids: z.array(z.number()).min(1, 'Selecciona al menos un empleado'),
}).refine((data) => {
  const start = new Date(data.pay_period_start);
  const end = new Date(data.pay_period_end);
  return end >= start;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['pay_period_end'],
});

type CreatePayrollForm = z.infer<typeof createPayrollSchema>;

interface Employee {
  id: number;
  full_name_roman?: string;
  full_name_kanji?: string;
  employee_number?: string;
}

export default function CreatePayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setLoading, loading, setError, clearError } = usePayrollStore();

  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<number[]>([]);
  const [loadingEmployees, setLoadingEmployees] = React.useState(true);
  const [savingAsDraft, setSavingAsDraft] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePayrollForm>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: {
      pay_period_start: '',
      pay_period_end: '',
      employee_ids: [],
    },
  });

  const payPeriodStart = watch('pay_period_start');
  const payPeriodEnd = watch('pay_period_end');

  // Load employees
  React.useEffect(() => {
    loadEmployees();
  }, []);

  // Update form when selected employees change
  React.useEffect(() => {
    setValue('employee_ids', selectedEmployeeIds);
  }, [selectedEmployeeIds, setValue]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await api.get('/employees');
      setEmployees(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al cargar empleados',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Convert employees to multi-select options
  const employeeOptions: MultiSelectOption[] = React.useMemo(() => {
    return employees.map((emp) => ({
      label: `${emp.full_name_roman || emp.full_name_kanji || `Empleado #${emp.id}`} (${emp.employee_number || emp.id})`,
      value: emp.id,
    }));
  }, [employees]);

  // Calculate period statistics
  const periodStats = React.useMemo(() => {
    if (!payPeriodStart || !payPeriodEnd) {
      return { days: 0, weeks: 0 };
    }

    const start = new Date(payPeriodStart);
    const end = new Date(payPeriodEnd);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const diffWeeks = Math.ceil(diffDays / 7);

    return { days: diffDays, weeks: diffWeeks };
  }, [payPeriodStart, payPeriodEnd]);

  // Create payroll run
  const onSubmit = async (data: CreatePayrollForm, isDraft: boolean = false) => {
    try {
      if (isDraft) {
        setSavingAsDraft(true);
      } else {
        setLoading(true);
      }
      clearError();

      // Create payroll run
      const payrollRunData: PayrollRunCreate = {
        pay_period_start: data.pay_period_start,
        pay_period_end: data.pay_period_end,
      };

      const payrollRun = await payrollAPI.createPayrollRun(payrollRunData);

      toast({
        title: isDraft ? 'Borrador guardado' : 'Payroll creado',
        description: `Payroll run #${payrollRun.id} ${isDraft ? 'guardado como borrador' : 'creado exitosamente'}`,
      });

      // If not draft, calculate for all employees
      if (!isDraft && data.employee_ids.length > 0) {
        try {
          // Build employees data object
          const employeesData: Record<number, any> = {};
          data.employee_ids.forEach((empId) => {
            employeesData[empId] = {
              employee_id: empId,
              pay_period_start: data.pay_period_start,
              pay_period_end: data.pay_period_end,
            };
          });

          // Calculate bulk payroll
          await payrollAPI.calculateBulkPayroll(payrollRun.id, {
            employees_data: employeesData,
            payroll_run_id: payrollRun.id,
          });

          toast({
            title: 'Cálculos completados',
            description: `Se calculó la nómina para ${data.employee_ids.length} empleados`,
          });
        } catch (calcError: any) {
          toast({
            title: 'Advertencia',
            description: 'Payroll creado pero algunos cálculos fallaron',
            variant: 'destructive',
          });
        }
      }

      // Redirect to payroll run details
      router.push(`/payroll/${payrollRun.id}`);
    } catch (error: any) {
      setError(error.message || 'Error al crear payroll');
      toast({
        title: 'Error',
        description: error.message || 'Error al crear payroll',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSavingAsDraft(false);
    }
  };

  // Handle form submission
  const handleCreatePayroll = (data: CreatePayrollForm) => {
    onSubmit(data, false);
  };

  const handleSaveAsDraft = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  // Auto-fill end date (30 days after start)
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = new Date(e.target.value);
    if (!isNaN(startDate.getTime())) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 29); // 30 days period
      setValue('pay_period_end', endDate.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/payroll">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Nueva Ejecución de Payroll
            </h1>
            <p className="text-muted-foreground mt-2">
              Crea una nueva ejecución de nómina para un período específico
            </p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-xl font-bold">
                  {periodStats.days} días
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empleados</p>
                <p className="text-xl font-bold">
                  {selectedEmployeeIds.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <FileText className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="text-xl font-bold">Nuevo</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit(handleCreatePayroll)}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Información del Período</CardTitle>
              <CardDescription>
                Define el período de pago y selecciona los empleados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay_period_start">
                    Fecha de Inicio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pay_period_start"
                    type="date"
                    {...register('pay_period_start')}
                    onChange={(e) => {
                      register('pay_period_start').onChange(e);
                      handleStartDateChange(e);
                    }}
                    className={errors.pay_period_start ? 'border-destructive' : ''}
                  />
                  {errors.pay_period_start && (
                    <p className="text-sm text-destructive">
                      {errors.pay_period_start.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay_period_end">
                    Fecha de Fin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pay_period_end"
                    type="date"
                    {...register('pay_period_end')}
                    className={errors.pay_period_end ? 'border-destructive' : ''}
                  />
                  {errors.pay_period_end && (
                    <p className="text-sm text-destructive">
                      {errors.pay_period_end.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Period Info */}
              {periodStats.days > 0 && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Duración del período:</strong> {periodStats.days} días (~{periodStats.weeks} semanas)
                  </p>
                </div>
              )}

              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee_ids">
                  Empleados <span className="text-destructive">*</span>
                </Label>
                {loadingEmployees ? (
                  <div className="flex items-center gap-2 p-4 border rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span className="text-sm text-muted-foreground">
                      Cargando empleados...
                    </span>
                  </div>
                ) : (
                  <MultiSelect
                    options={employeeOptions}
                    selected={selectedEmployeeIds}
                    onChange={setSelectedEmployeeIds}
                    placeholder="Selecciona empleados..."
                    className={errors.employee_ids ? 'border-destructive' : ''}
                  />
                )}
                {errors.employee_ids && (
                  <p className="text-sm text-destructive">
                    {errors.employee_ids.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecciona los empleados para incluir en este payroll run
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/payroll')}
              disabled={loading || savingAsDraft}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveAsDraft}
              disabled={loading || savingAsDraft || selectedEmployeeIds.length === 0}
            >
              {savingAsDraft ? 'Guardando...' : 'Guardar como Borrador'}
            </Button>
            <Button
              type="submit"
              disabled={loading || savingAsDraft || selectedEmployeeIds.length === 0}
            >
              {loading ? 'Creando...' : 'Crear y Calcular'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
