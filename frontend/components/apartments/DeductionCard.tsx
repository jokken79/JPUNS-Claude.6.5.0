'use client';

import React, { useState } from 'react';
import {
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { DeductionResponse, DeductionStatus } from '@/types/apartments-v2';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface DeductionCardProps {
  deduction: DeductionResponse;
  onUpdate?: () => void;
  showActions?: boolean;
  userRole?: string;
}

const STATUS_COLORS: Record<DeductionStatus, string> = {
  pending: 'destructive',
  processed: 'secondary',
  paid: 'default',
  cancelled: 'outline',
};

const STATUS_LABELS: Record<DeductionStatus, string> = {
  pending: 'Pendiente',
  processed: 'Procesado',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

export function DeductionCard({
  deduction,
  onUpdate,
  showActions = false,
  userRole,
}: DeductionCardProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleMarkAsPaid = async () => {
    try {
      setUpdating(true);

      const token = localStorage.getItem('access_token');
      await axios.patch(
        `${API_BASE_URL}/apartments-v2/deductions/${deduction.id}`,
        { status: 'paid' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: 'Deducción actualizada',
        description: 'La deducción se ha marcado como pagada exitosamente.',
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error updating deduction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo actualizar la deducción',
      });
    } finally {
      setUpdating(false);
    }
  };

  const canMarkAsPaid = userRole === 'ADMIN' && deduction.status === 'processed';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">
              {deduction.month}/{deduction.year}
            </h3>
          </div>
          <Badge variant={STATUS_COLORS[deduction.status]}>
            {STATUS_LABELS[deduction.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Employee and Apartment Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <UserIcon className="h-4 w-4" />
              <span>Empleado</span>
            </div>
            <p className="font-medium">{deduction.employee_name || `ID: ${deduction.employee_id}`}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BuildingOfficeIcon className="h-4 w-4" />
              <span>Apartamento</span>
            </div>
            <p className="font-medium">{deduction.apartment_name || `ID: ${deduction.apartment_id}`}</p>
          </div>
        </div>

        {/* Financial Details */}
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Renta Base</span>
            <span className="font-medium">¥{deduction.base_rent.toLocaleString()}</span>
          </div>

          {deduction.additional_charges > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cargos Adicionales</span>
              <span className="font-medium text-orange-600">
                +¥{deduction.additional_charges.toLocaleString()}
              </span>
            </div>
          )}

          {deduction.was_prorated && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Días ocupados</span>
              <span>
                {deduction.days_occupied}/{deduction.days_in_month} días
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-base font-semibold pt-2 border-t">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5" />
              <span>Total Deducción</span>
            </div>
            <span className="text-lg">¥{deduction.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Prorated Badge */}
        {deduction.was_prorated && (
          <Badge variant="outline" className="w-full justify-center">
            Renta Prorrateada
          </Badge>
        )}

        {/* Notes */}
        {deduction.notes && (
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
            <span className="font-medium">Notas:</span> {deduction.notes}
          </div>
        )}

        {/* Actions */}
        {showActions && canMarkAsPaid && (
          <div className="pt-3 border-t">
            <Button
              onClick={handleMarkAsPaid}
              disabled={updating}
              className="w-full"
              variant="default"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Marcar como Pagado
            </Button>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground pt-2 space-y-1">
          <div>Creado: {new Date(deduction.created_at).toLocaleDateString()}</div>
          {deduction.updated_at && (
            <div>Actualizado: {new Date(deduction.updated_at).toLocaleDateString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DeductionCard;
