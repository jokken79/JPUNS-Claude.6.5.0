'use client';

// Disable static generation for this page (uses client-side hooks)
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Calendar,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Search
} from 'lucide-react';
import api from '@/lib/api';
import { DevModeAlert } from '@/components/dev-mode-alert';

interface Employee {
  id: number;
  full_name_kanji: string;
  hakenmoto_id: number;  // 社員№ (Employee Number) - INTEGER in database
  yukyu_remaining?: number;
}

interface SchedulerJob {
  id?: string;
  name?: string;
  trigger?: string;
  next_run?: string;
}

interface SchedulerStatus {
  running: boolean;
  jobs?: SchedulerJob[];
}

interface YukyuCalculationResponse {
  employee_id: number;
  total_available: number;
  assignment_date: string;
  message: string;
}

interface ExpireResponse {
  message: string;
  expired_count: number;
}

export default function AdminYukyuManagementPage() {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [expireDialogOpen, setExpireDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees/');  // Added trailing slash to fix 307 redirect
      const data = res.data;
      const items = data.items || [];
      console.log('✅ Employees loaded:', items.length, 'employees');
      console.log('First 3:', items.slice(0, 3).map((e: Employee) => ({id: e.id, name: e.full_name_kanji, shainNo: e.hakenmoto_id})));
      return items;
    }
  });

  // Fetch scheduler status
  const { data: schedulerStatus, refetch: refetchScheduler } = useQuery<SchedulerStatus>({
    queryKey: ['scheduler-status'],
    queryFn: async () => {
      const res = await api.get('/yukyu/maintenance/scheduler-status');
      return res.data;
    }
  });

  // Calculate yukyu mutation
  const calculateMutation = useMutation<YukyuCalculationResponse, Error, number>({
    mutationFn: async (employeeId: number) => {
      console.log('📡 Sending API request for employee:', employeeId);
      const res = await api.post('/yukyu/balances/calculate', {
        employee_id: employeeId,
        calculation_date: new Date().toISOString().split('T')[0]
      });
      console.log('📥 API response:', res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('✅ Success:', data);
      toast.success(`Yukyus calculados: ${data.total_available} días disponibles`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: Error) => {
      console.log('❌ Error:', error);
      toast.error(`Error: ${error.message}`);
    }
  });

  // Expire old yukyus mutation
  const expireMutation = useMutation<ExpireResponse, Error>({
    mutationFn: async () => {
      const res = await api.post('/yukyu/maintenance/expire-old-yukyus');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.message}`);
      setExpireDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleCalculate = () => {
    console.log('🔘 Calculate button clicked');
    console.log('Selected Employee ID:', selectedEmployeeId);
    if (!selectedEmployeeId) {
      console.log('❌ No employee selected');
      toast.error('Por favor selecciona un empleado');
      return;
    }
    console.log('✅ Starting calculation for employee:', parseInt(selectedEmployeeId));
    calculateMutation.mutate(parseInt(selectedEmployeeId));
  };

  const handleExpire = () => {
    setExpireDialogOpen(true);
  };

  const confirmExpire = () => {
    expireMutation.mutate();
  };

  // Filtrar empleados por búsqueda
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchQuery.trim()) return employees;

    const query = searchQuery.toLowerCase();
    console.log('🔍 Searching for:', query, 'in', employees.length, 'employees');
    const results = employees.filter((emp: Employee) => {
      const matchId = emp.id.toString().includes(query);
      const matchShainNumber = emp.hakenmoto_id?.toString().includes(query);  // 社員№ (convert number to string)
      const matchName = emp.full_name_kanji?.toLowerCase().includes(query);
      return matchId || matchShainNumber || matchName;
    });
    console.log('Found:', results.length, 'employees');
    if (results.length > 0) {
      console.log('Results:', results.map(e => ({id: e.id, shainNo: e.hakenmoto_id, name: e.full_name_kanji})));
    }
    return results;
  }, [employees, searchQuery]);

  // Auto-select employee if only one result
  useEffect(() => {
    if (filteredEmployees.length === 1) {
      setSelectedEmployeeId(filteredEmployees[0].id.toString());
    } else if (filteredEmployees.length === 0) {
      setSelectedEmployeeId('');
    }
  }, [filteredEmployees]);

  // Calcular estadísticas
  const stats = {
    totalEmployees: employees?.length || 0,
    totalAvailable: employees?.reduce((sum: number, e: Employee) => sum + (e.yukyu_remaining || 0), 0) || 0,
    totalUsed: 0, // TODO: calcular desde requests
    totalExpired: 0 // TODO: calcular desde balances
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          有給休暇管理 (Admin)
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión administrativa de yukyus - Cálculo, expiración y monitoreo
        </p>
      </div>

      {/* Development Alert */}
      <div className="mb-6">
        <DevModeAlert
          pageName="Yukyu Management (Admin)"
          message="Some statistics calculations are incomplete (Total Used and Total Expired). These features are currently being implemented."
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Empleados</p>
                <p className="text-3xl font-bold">{stats.totalEmployees}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Días Disponibles</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalAvailable}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Días Usados</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsed}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Días Expirados</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalExpired}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Calculate Yukyus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calcular Yukyus Manualmente
            </CardTitle>
            <CardDescription>
              Calcular y asignar yukyus para un empleado específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Buscar Empleado</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por 社員№, ID, o nombre (ej: 200901)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-500 mt-1">
                  {filteredEmployees.length} empleado{filteredEmployees.length !== 1 ? 's' : ''} encontrado{filteredEmployees.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div>
              <Label>Seleccionar Empleado</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp: Employee) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        社員№: {emp.hakenmoto_id || 'N/A'} - {emp.full_name_kanji} (ID: {emp.id})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-results" disabled>
                      No se encontraron empleados
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending || !selectedEmployeeId}
              className="w-full"
            >
              {calculateMutation.isPending ? 'Calculando...' : 'Calcular Yukyus'}
            </Button>
          </CardContent>
        </Card>

        {/* Expire Old Yukyus */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Expirar Yukyus Antiguos
            </CardTitle>
            <CardDescription>
              Forzar expiración de yukyus mayores de 2 años (時効)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Esta acción buscará y expirará automáticamente todos los yukyus con más de 2 años de antigüedad.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleExpire}
              disabled={expireMutation.isPending}
              variant="outline"
              className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              {expireMutation.isPending ? 'Expirando...' : 'Forzar Expiración'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estado del Scheduler de Cron Jobs
          </CardTitle>
          <CardDescription>
            Monitoreo del sistema automático de expiración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedulerStatus ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estado:</span>
                  <Badge variant={schedulerStatus.running ? "default" : "destructive"}>
                    {schedulerStatus.running ? 'Activo' : 'Detenido'}
                  </Badge>
                </div>
                {schedulerStatus.jobs && schedulerStatus.jobs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Jobs Configurados:</h4>
                    <div className="space-y-2">
                      {schedulerStatus.jobs.map((job: SchedulerJob, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{job.name || job.id}</p>
                              {job.next_run && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Próxima ejecución: {new Date(job.next_run).toLocaleString('es-ES')}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">{job.trigger || 'Cron'}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">Cargando estado del scheduler...</p>
            )}
            <Button onClick={() => refetchScheduler()} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar Estado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expire Confirmation Dialog */}
      <Dialog open={expireDialogOpen} onOpenChange={setExpireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Expiración de Yukyus</DialogTitle>
            <DialogDescription>
              Esta acción expirará todos los yukyus con más de 2 años de antigüedad según la ley japonesa.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-amber-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Los yukyus expirados no se pueden recuperar. Esta acción es permanente.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpireDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmExpire}
              disabled={expireMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {expireMutation.isPending ? 'Expirando...' : 'Confirmar Expiración'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
