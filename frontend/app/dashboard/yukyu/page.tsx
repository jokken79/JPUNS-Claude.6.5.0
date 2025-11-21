'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, Check, X, Plus } from 'lucide-react';
import { PageSkeleton } from '@/components/page-skeleton';
import { ErrorState } from '@/components/error-state';
import { useDelayedLoading, useCombinedLoading, getErrorType } from '@/lib/loading-utils';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';

// API service for yukyu management
const yukyuService = {
  async getBalances() {
    const response = await api.get('/yukyu/balances');
    return response.data;
  },
  async getRequests() {
    const response = await api.get('/yukyu/requests');
    return response.data;
  },
};

export default function YukyuPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch yukyu balances
  const { data: balances, isLoading: loadingBalances, error: errorBalances, refetch: refetchBalances } = useQuery({
    queryKey: ['yukyu-balances'],
    queryFn: () => yukyuService.getBalances(),
    enabled: isAuthenticated && mounted,
    retry: 1,
  });

  // Fetch yukyu requests
  const { data: requests, isLoading: loadingRequests, error: errorRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['yukyu-requests'],
    queryFn: () => yukyuService.getRequests(),
    enabled: isAuthenticated && mounted,
    retry: 1,
  });

  const isLoading = loadingBalances || loadingRequests;
  const showLoading = useCombinedLoading(
    [loadingBalances, loadingRequests],
    { delay: 200, minDuration: 500 }
  );

  const hasCriticalError = errorBalances && errorRequests;
  const firstError = errorBalances || errorRequests;

  const handleRefresh = () => {
    refetchBalances();
    refetchRequests();
  };

  if (!mounted) {
    return <PageSkeleton type="list" />;
  }

  if (!isAuthenticated) {
    return (
      <ErrorState
        type="forbidden"
        title="Authentication Required"
        message="Please log in to access yukyu management."
        showRetry={false}
        showGoBack={false}
      />
    );
  }

  if (showLoading) {
    return <PageSkeleton type="list" />;
  }

  if (hasCriticalError && firstError) {
    return (
      <ErrorState
        type={getErrorType(firstError)}
        title="Failed to Load Yukyu Data"
        message="Unable to fetch yukyu information. Please try again."
        details={firstError}
        onRetry={handleRefresh}
        showRetry={true}
        showGoBack={false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yukyu (有給休暇)</h1>
          <p className="text-muted-foreground">
            Gestión de vacaciones pagadas y balance de días
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Días Disponibles
            </CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {balances?.total_available ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Días restantes de yukyu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Días Usados
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {balances?.total_used ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Días tomados este año
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Días Expirados
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {balances?.total_expired ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Días que vencieron
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Recientes</CardTitle>
          <CardDescription>
            Historial de solicitudes de yukyu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests && requests.length > 0 ? (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {request.status === 'approved' && (
                        <Check className="h-5 w-5 text-emerald-600" />
                      )}
                      {request.status === 'pending' && (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                      {request.status === 'rejected' && (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(request.start_date), 'dd MMM yyyy', { locale: es })}
                        {' - '}
                        {format(new Date(request.end_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.days_requested} día{request.days_requested !== 1 ? 's' : ''} solicitado{request.days_requested !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        request.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : request.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                      }`}
                    >
                      {request.status === 'approved' && 'Aprobado'}
                      {request.status === 'pending' && 'Pendiente'}
                      {request.status === 'rejected' && 'Rechazado'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No hay solicitudes recientes
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-300">
          <ul className="list-disc list-inside space-y-2">
            <li>Los días de yukyu se asignan automáticamente según la antigüedad del empleado</li>
            <li>Los días no utilizados expiran después de 2 años</li>
            <li>Debe usar al menos 5 días de yukyu por año (requerimiento legal japonés)</li>
            <li>Las solicitudes requieren aprobación del coordinador y la fábrica</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
