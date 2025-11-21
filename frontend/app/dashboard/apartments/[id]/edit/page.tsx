'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apartmentsV2Service } from '@/lib/api';
import type { ApartmentUpdate, ApartmentWithStats, RoomType } from '@/types/apartments-v2';
import { RoomType as RoomTypeEnum } from '@/types/apartments-v2';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Zod validation schema
const apartmentUpdateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  building_name: z.string().optional(),
  room_number: z.string().optional(),
  floor_number: z.number().min(0).optional(),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  room_type: z.nativeEnum(RoomTypeEnum).optional(),
  size_sqm: z.number().min(0).optional(),
  property_type: z.string().optional(),
  base_rent: z.number().min(0, 'Renta debe ser mayor a 0'),
  management_fee: z.number().min(0).default(0),
  deposit: z.number().min(0).default(0),
  key_money: z.number().min(0).default(0),
  default_cleaning_fee: z.number().min(0).default(20000),
  parking_spaces: z.number().min(0).optional(),
  parking_price_per_unit: z.number().min(0).optional(),
  initial_plus: z.number().min(0).default(5000),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  landlord_name: z.string().optional(),
  landlord_contact: z.string().optional(),
  real_estate_agency: z.string().optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default('active'),
});

type ApartmentFormData = z.infer<typeof apartmentUpdateSchema>;

export default function EditApartmentPage() {
  const router = useRouter();
  const params = useParams();
  const apartmentId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentUpdateSchema),
  });

  const baseRent = watch('base_rent') || 0;
  const managementFee = watch('management_fee') || 0;
  const totalCost = baseRent + managementFee;

  // Load apartment data
  useEffect(() => {
    const loadApartment = async () => {
      try {
        setIsLoading(true);
        const data = await apartmentsV2Service.getApartment(apartmentId);

        // Pre-populate form with existing data
        reset({
          name: data.name,
          building_name: data.building_name || undefined,
          room_number: data.room_number || undefined,
          floor_number: data.floor_number || undefined,
          status: data.status || 'active',
          postal_code: data.postal_code || undefined,
          prefecture: data.prefecture || undefined,
          city: data.city || undefined,
          address_line1: data.address_line1 || undefined,
          address_line2: data.address_line2 || undefined,
          room_type: (data.room_type as RoomType) || undefined,
          size_sqm: data.size_sqm || undefined,
          base_rent: data.base_rent,
          management_fee: data.management_fee || 0,
          deposit: data.deposit || 0,
          key_money: data.key_money || 0,
          default_cleaning_fee: data.default_cleaning_fee || 20000,
          parking_spaces: data.parking_spaces || undefined,
          parking_price_per_unit: data.parking_price_per_unit || undefined,
          initial_plus: data.initial_plus || 5000,
          contract_start_date: data.contract_start_date || undefined,
          contract_end_date: data.contract_end_date || undefined,
          landlord_name: data.landlord_name || undefined,
          landlord_contact: data.landlord_contact || undefined,
          real_estate_agency: data.real_estate_agency || undefined,
          emergency_contact: data.emergency_contact || undefined,
          notes: data.notes || undefined,
        });
      } catch (err: any) {
        console.error('Error loading apartment:', err);
        toast.error(err.response?.data?.detail || 'Error al cargar el apartamento');
        router.push('/apartments');
      } finally {
        setIsLoading(false);
      }
    };

    loadApartment();
  }, [apartmentId, reset, router]);

  const onSubmit = async (data: ApartmentFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: ApartmentUpdate = {
        name: data.name,
        building_name: data.building_name || undefined,
        room_number: data.room_number || undefined,
        floor_number: data.floor_number || undefined,
        status: data.status,
        postal_code: data.postal_code || undefined,
        prefecture: data.prefecture || undefined,
        city: data.city || undefined,
        address_line1: data.address_line1 || undefined,
        address_line2: data.address_line2 || undefined,
        room_type: data.room_type || undefined,
        size_sqm: data.size_sqm || undefined,
        base_rent: data.base_rent,
        management_fee: data.management_fee,
        deposit: data.deposit,
        key_money: data.key_money,
        default_cleaning_fee: data.default_cleaning_fee,
        parking_spaces: data.parking_spaces,
        parking_price_per_unit: data.parking_price_per_unit,
        initial_plus: data.initial_plus,
        contract_start_date: data.contract_start_date || undefined,
        contract_end_date: data.contract_end_date || undefined,
        landlord_name: data.landlord_name || undefined,
        landlord_contact: data.landlord_contact || undefined,
        real_estate_agency: data.real_estate_agency || undefined,
        emergency_contact: data.emergency_contact || undefined,
        notes: data.notes || undefined,
      };

      await apartmentsV2Service.updateApartment(apartmentId, updateData);
      toast.success('Apartamento actualizado exitosamente');
      router.push(`/apartments/${apartmentId}`);
    } catch (err: any) {
      console.error('Error updating apartment:', err);
      toast.error(err.response?.data?.detail || 'Error al actualizar el apartamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando apartamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/apartments/${apartmentId}`)}
          className="mb-4"
        >
          ← Volver a Detalles
        </Button>
        <h1 className="text-3xl font-bold">Editar Apartamento</h1>
        <p className="text-muted-foreground mt-2">
          Actualice la información del apartamento. Los campos marcados con * son obligatorios.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Detalles principales del apartamento</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">
                Nombre del Apartamento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="ej. マンション太陽 201"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="building_name">Nombre del Edificio</Label>
              <Input
                id="building_name"
                {...register('building_name')}
                placeholder="ej. 太陽ビル"
              />
            </div>

            <div>
              <Label htmlFor="room_number">Número de Habitación</Label>
              <Input
                id="room_number"
                {...register('room_number')}
                placeholder="ej. 201"
              />
            </div>

            <div>
              <Label htmlFor="floor_number">Número de Piso</Label>
              <Input
                id="floor_number"
                type="number"
                {...register('floor_number', { valueAsNumber: true })}
                placeholder="ej. 2"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
            <CardDescription>Dirección del apartamento</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prefecture">Prefectura</Label>
              <Input
                id="prefecture"
                {...register('prefecture')}
                placeholder="ej. 東京都"
              />
            </div>

            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="ej. 新宿区"
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="ej. 160-0022"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address_line1">Dirección Línea 1</Label>
              <Input
                id="address_line1"
                {...register('address_line1')}
                placeholder="ej. 新宿1-2-3"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address_line2">Dirección Línea 2 (opcional)</Label>
              <Input
                id="address_line2"
                {...register('address_line2')}
                placeholder="Información adicional de dirección"
              />
            </div>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
            <CardDescription>Tipo y tamaño del apartamento</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="property_type">Tipo de Propiedad</Label>
              <Select
                value={watch('property_type') || ''}
                onValueChange={(value) => setValue('property_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Edificio">Edificio</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="room_type">Tipo de Habitación</Label>
              <Select
                value={watch('room_type')}
                onValueChange={(value) => setValue('room_type', value as RoomType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RoomTypeEnum.R}>R (Habitación)</SelectItem>
                  <SelectItem value={RoomTypeEnum.K}>K (Cocina)</SelectItem>
                  <SelectItem value={RoomTypeEnum.DK}>DK (Comedor-Cocina)</SelectItem>
                  <SelectItem value={RoomTypeEnum.LDK}>LDK (Sala-Comedor-Cocina)</SelectItem>
                  <SelectItem value={RoomTypeEnum.S}>S (Studio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="size_sqm">Tamaño (m²)</Label>
              <Input
                id="size_sqm"
                type="number"
                step="0.01"
                {...register('size_sqm', { valueAsNumber: true })}
                placeholder="ej. 25.5"
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Costos */}
        <Card>
          <CardHeader>
            <CardTitle>Costos</CardTitle>
            <CardDescription>Información de precios y pagos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_rent">
                  Renta Base (¥) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="base_rent"
                  type="number"
                  {...register('base_rent', { valueAsNumber: true })}
                  placeholder="ej. 50000"
                  min="0"
                  className={errors.base_rent ? 'border-red-500' : ''}
                />
                {errors.base_rent && (
                  <p className="text-sm text-red-500 mt-1">{errors.base_rent.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="management_fee">Cuota de Administración (¥)</Label>
                <Input
                  id="management_fee"
                  type="number"
                  {...register('management_fee', { valueAsNumber: true })}
                  placeholder="ej. 5000"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="deposit">Depósito / 敷金 (¥)</Label>
                <Input
                  id="deposit"
                  type="number"
                  {...register('deposit', { valueAsNumber: true })}
                  placeholder="ej. 100000"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="key_money">Key Money / 礼金 (¥)</Label>
                <Input
                  id="key_money"
                  type="number"
                  {...register('key_money', { valueAsNumber: true })}
                  placeholder="ej. 100000"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="default_cleaning_fee">Cargo de Limpieza al Salir (¥)</Label>
                <Input
                  id="default_cleaning_fee"
                  type="number"
                  {...register('default_cleaning_fee', { valueAsNumber: true })}
                  placeholder="ej. 20000"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="parking_spaces">Estacionamientos</Label>
                <Input
                  id="parking_spaces"
                  type="number"
                  {...register('parking_spaces', { valueAsNumber: true })}
                  placeholder="ej. 1"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="parking_price_per_unit">Precio por Estacionamiento (¥)</Label>
                <Input
                  id="parking_price_per_unit"
                  type="number"
                  {...register('parking_price_per_unit', { valueAsNumber: true })}
                  placeholder="ej. 5000"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="initial_plus">Plus Adicional (¥)</Label>
                <Input
                  id="initial_plus"
                  type="number"
                  {...register('initial_plus', { valueAsNumber: true })}
                  placeholder="ej. 5000"
                  min="0"
                />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Costo Mensual Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ¥{totalCost.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Renta Base (¥{baseRent.toLocaleString()}) + Administración (¥{managementFee.toLocaleString()})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contrato */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Contrato</CardTitle>
            <CardDescription>Detalles del contrato y contactos</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_start_date">Fecha de Inicio del Contrato</Label>
              <Input
                id="contract_start_date"
                type="date"
                {...register('contract_start_date')}
              />
            </div>

            <div>
              <Label htmlFor="contract_end_date">Fecha de Fin del Contrato</Label>
              <Input
                id="contract_end_date"
                type="date"
                {...register('contract_end_date')}
              />
            </div>

            <div>
              <Label htmlFor="landlord_name">Nombre del Propietario</Label>
              <Input
                id="landlord_name"
                {...register('landlord_name')}
                placeholder="ej. 田中太郎"
              />
            </div>

            <div>
              <Label htmlFor="landlord_contact">Contacto del Propietario</Label>
              <Input
                id="landlord_contact"
                {...register('landlord_contact')}
                placeholder="ej. 03-1234-5678"
              />
            </div>

            <div>
              <Label htmlFor="real_estate_agency">Agencia Inmobiliaria</Label>
              <Input
                id="real_estate_agency"
                {...register('real_estate_agency')}
                placeholder="ej. 不動産エージェント株式会社"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact">Contacto de Emergencia</Label>
              <Input
                id="emergency_contact"
                {...register('emergency_contact')}
                placeholder="ej. 090-1234-5678"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Adicionales</CardTitle>
            <CardDescription>Información adicional sobre el apartamento</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('notes')}
              rows={4}
              placeholder="Información adicional sobre el apartamento..."
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/apartments/${apartmentId}`)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
