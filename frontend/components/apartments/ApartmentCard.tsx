'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyYenIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  UserPlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ApartmentWithStats } from '@/types/apartments-v2';

interface ApartmentCardProps {
  apartment: ApartmentWithStats;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onAssign?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ApartmentCard({ apartment, onView, onEdit, onAssign, onDelete }: ApartmentCardProps) {
  const router = useRouter();

  // Determine availability status
  const getAvailabilityStatus = () => {
    if (!apartment.is_available) return 'full';
    if (apartment.occupancy_rate === 0) return 'available';
    return 'partial';
  };

  const availabilityStatus = getAvailabilityStatus();

  // Status badge component
  const StatusBadge = () => {
    const variants = {
      available: { label: 'Disponible', variant: 'default' as const },
      partial: { label: 'Parcial', variant: 'secondary' as const },
      full: { label: 'Lleno', variant: 'destructive' as const },
    };

    const { label, variant } = variants[availabilityStatus];

    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleView = () => {
    if (onView) {
      onView(apartment.id);
    } else {
      router.push(`/apartments/${apartment.id}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(apartment.id);
    } else {
      router.push(`/apartments/${apartment.id}/edit`);
    }
  };

  const handleAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssign) {
      onAssign(apartment.id);
    } else {
      router.push(`/apartment-assignments/create?apartmentId=${apartment.id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(apartment.id);
    }
  };

  // Format full address
  const fullAddress = apartment.full_address ||
    [apartment.prefecture, apartment.city, apartment.address_line1, apartment.address_line2]
      .filter(Boolean)
      .join(', ');

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleView}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BuildingOfficeIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">{apartment.name}</h3>
            </div>
            {apartment.building_name && (
              <p className="text-sm text-muted-foreground">
                {apartment.building_name} {apartment.room_number}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPinIcon className="h-3 w-3" />
              {fullAddress}
            </p>
          </div>
          <StatusBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Ocupación</span>
            <p className="font-medium flex items-center gap-1 mt-1">
              <UserGroupIcon className="h-4 w-4" />
              {apartment.current_occupancy}/{apartment.max_occupancy} ({apartment.occupancy_rate.toFixed(0)}%)
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Renta Base</span>
            <p className="font-medium flex items-center gap-1 mt-1">
              <CurrencyYenIcon className="h-4 w-4" />
              ¥{apartment.base_rent.toLocaleString()}
            </p>
          </div>
          {apartment.total_monthly_cost && (
            <div className="col-span-2">
              <span className="text-muted-foreground text-xs">Costo Total Mensual</span>
              <p className="font-medium mt-1">
                ¥{apartment.total_monthly_cost.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Occupancy Progress Bar */}
        <div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                availabilityStatus === 'available'
                  ? 'bg-green-500'
                  : availabilityStatus === 'partial'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(apartment.occupancy_rate, 100)}%` }}
            />
          </div>
        </div>

        {/* Factory Info */}
        {apartment.primary_factory && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Fábrica Principal:</span> {apartment.primary_factory.company_name}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            className="flex-1"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="flex-1"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Editar
          </Button>
          {apartment.is_available && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAssign}
              className="flex-1"
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Asignar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
