'use client';

import React from 'react';
import { UserGroupIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ApartmentWithStats } from '@/types/apartments-v2';

interface OccupancyStatsProps {
  apartment: ApartmentWithStats;
  showAverageStay?: boolean;
  showLastAssignment?: boolean;
}

export function OccupancyStats({
  apartment,
  showAverageStay = true,
  showLastAssignment = true,
}: OccupancyStatsProps) {
  const occupancyPercentage = apartment.occupancy_rate;
  const occupancyColor =
    occupancyPercentage === 0
      ? 'bg-gray-400'
      : occupancyPercentage < 50
      ? 'bg-green-500'
      : occupancyPercentage < 100
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (days: number | null | undefined) => {
    if (!days) return 'N/A';
    if (days < 30) return `${days} días`;
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5" />
          Estadísticas de Ocupación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Occupancy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Ocupación Actual</span>
            </div>
            <span className="text-sm font-bold">
              {apartment.current_occupancy}/{apartment.max_occupancy}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress
              value={occupancyPercentage}
              className="h-3"
              indicatorClassName={occupancyColor}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium">{occupancyPercentage.toFixed(1)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {/* Availability Status */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Estado</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  apartment.is_available
                    ? apartment.occupancy_rate === 0
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium">
                {apartment.is_available
                  ? apartment.occupancy_rate === 0
                    ? 'Disponible'
                    : 'Parcial'
                  : 'Lleno'}
              </span>
            </div>
          </div>

          {/* Active Assignments */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Asignaciones Activas</span>
            <p className="text-sm font-medium">{apartment.active_assignments || 0}</p>
          </div>

          {/* Last Assignment Date */}
          {showLastAssignment && apartment.last_assignment_date && (
            <div className="space-y-1 col-span-2">
              <span className="text-xs text-muted-foreground">Última Asignación</span>
              <p className="text-sm font-medium">
                {formatDate(apartment.last_assignment_date)}
              </p>
            </div>
          )}

          {/* Average Stay Duration */}
          {showAverageStay && apartment.average_stay_duration && (
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Estadía Promedio</span>
              </div>
              <p className="text-sm font-medium">
                {formatDuration(apartment.average_stay_duration)}
              </p>
            </div>
          )}
        </div>

        {/* Capacity Breakdown */}
        <div className="pt-4 border-t space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Desglose de Capacidad</span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded">
              <p className="text-lg font-bold">{apartment.current_occupancy}</p>
              <p className="text-xs text-muted-foreground">Ocupado</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-lg font-bold">
                {apartment.max_occupancy - apartment.current_occupancy}
              </p>
              <p className="text-xs text-muted-foreground">Disponible</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-lg font-bold">{apartment.max_occupancy}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OccupancyStats;
