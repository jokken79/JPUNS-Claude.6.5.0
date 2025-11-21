'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { AssignmentCreate, ApartmentWithStats } from '@/types/apartments-v2';
import { RentCalculator } from './RentCalculator';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const assignmentFormSchema = z.object({
  employee_id: z.number({
    required_error: 'Por favor selecciona un empleado',
  }).positive('El ID del empleado debe ser positivo'),
  apartment_id: z.number().positive(),
  start_date: z.date({
    required_error: 'Por favor selecciona una fecha de inicio',
  }),
  end_date: z.date().optional().nullable(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return data.end_date > data.start_date;
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['end_date'],
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface AssignmentFormProps {
  apartmentId: number;
  employeeId?: number;
  onSubmit: (data: AssignmentCreate) => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

export function AssignmentForm({
  apartmentId,
  employeeId,
  onSubmit,
  onCancel,
  disabled = false,
}: AssignmentFormProps) {
  const { toast } = useToast();
  const [apartment, setApartment] = useState<ApartmentWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      apartment_id: apartmentId,
      employee_id: employeeId || undefined,
      start_date: new Date(),
      end_date: null,
      notes: '',
    },
  });

  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  // Fetch apartment details
  useEffect(() => {
    const fetchApartment = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.get<ApartmentWithStats>(
          `${API_BASE_URL}/apartments-v2/apartments/${apartmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setApartment(response.data);

        // Check if apartment is full
        if (!response.data.is_available) {
          toast({
            variant: 'destructive',
            title: 'Apartamento no disponible',
            description: 'Este apartamento está lleno y no puede aceptar más asignaciones.',
          });
        }
      } catch (error) {
        console.error('Error fetching apartment:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar la información del apartamento',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [apartmentId, toast]);

  const handleSubmit = async (values: AssignmentFormValues) => {
    try {
      setSubmitting(true);

      // Format dates to ISO string
      const formattedData: AssignmentCreate = {
        ...values,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
        monthly_rent: apartment?.base_rent || 0,
        days_in_month: 30, // Will be calculated by backend
        days_occupied: 30, // Will be calculated by backend
        prorated_rent: apartment?.base_rent || 0, // Will be calculated by backend
        is_prorated: false, // Will be determined by backend
        total_deduction: apartment?.base_rent || 0, // Will be calculated by backend
        status: 'active' as const,
      };

      await onSubmit(formattedData);

      toast({
        title: 'Asignación creada',
        description: 'La asignación del apartamento se ha creado exitosamente.',
      });

      form.reset();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo crear la asignación',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDisabled = disabled || !apartment?.is_available || submitting;

  return (
    <div className="space-y-6">
      {/* Apartment Info */}
      {apartment && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h3 className="font-semibold">{apartment.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Renta Base:</span>
              <span className="ml-2 font-medium">¥{apartment.base_rent.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ocupación:</span>
              <span className="ml-2 font-medium">
                {apartment.current_occupancy}/{apartment.max_occupancy}
              </span>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Employee ID Field - Simple number input for now */}
          {!employeeId && (
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado ID</FormLabel>
                  <FormControl>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isDisabled}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Ingresa el ID del empleado a asignar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Start Date */}
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isDisabled}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Fecha en que el empleado comenzará a ocupar el apartamento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date (Optional) */}
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Fin (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isDisabled}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Selecciona una fecha (opcional)</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => startDate ? date <= startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Deja vacío si la asignación no tiene fecha de fin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (Opcional)</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDisabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rent Calculator */}
          {apartment && startDate && (
            <RentCalculator
              baseRent={apartment.base_rent}
              startDate={startDate}
              endDate={endDate || undefined}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isDisabled} className="flex-1">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Asignación
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

export default AssignmentForm;
