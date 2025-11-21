'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { apartmentsV2Service } from '@/lib/api';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ChargeType, ChargeStatus } from '@/types/apartments-v2';

const chargeFormSchema = z.object({
  charge_type: z.nativeEnum(ChargeType, {
    required_error: 'Por favor selecciona un tipo de cargo',
  }),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  charge_date: z.date({
    required_error: 'Por favor selecciona una fecha',
  }),
  notes: z.string().optional(),
});

type ChargeFormValues = z.infer<typeof chargeFormSchema>;

interface AdditionalChargeFormProps {
  assignmentId: number;
  apartmentId: number;
  employeeId: number;
  onSuccess: () => void;
  onCancel?: () => void;
}

const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  [ChargeType.CLEANING]: 'Limpieza',
  [ChargeType.REPAIR]: 'Reparación',
  [ChargeType.DEPOSIT]: 'Depósito',
  [ChargeType.PENALTY]: 'Penalidad',
  [ChargeType.OTHER]: 'Otro',
};

export function AdditionalChargeForm({
  assignmentId,
  apartmentId,
  employeeId,
  onSuccess,
  onCancel,
}: AdditionalChargeFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      charge_type: ChargeType.OTHER,
      description: '',
      amount: 0,
      charge_date: new Date(),
      notes: '',
    },
  });

  const handleSubmit = async (values: ChargeFormValues) => {
    try {
      setSubmitting(true);

      const payload = {
        assignment_id: assignmentId,
        employee_id: employeeId,
        apartment_id: apartmentId,
        charge_type: values.charge_type,
        description: values.description,
        amount: values.amount,
        charge_date: format(values.charge_date, 'yyyy-MM-dd'),
        status: ChargeStatus.PENDING,
        notes: values.notes || null,
      };

      await apartmentsV2Service.createCharge(payload);

      toast({
        title: 'Cargo creado',
        description: 'El cargo adicional se ha creado exitosamente.',
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating charge:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo crear el cargo adicional',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Charge Type */}
        <FormField
          control={form.control}
          name="charge_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Cargo</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={submitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de cargo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CHARGE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Tipo de cargo adicional a aplicar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Limpieza profunda del apartamento"
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Descripción detallada del cargo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto (¥)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  disabled={submitting}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Monto del cargo en yenes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Charge Date */}
        <FormField
          control={form.control}
          name="charge_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha del Cargo</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      disabled={submitting}
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
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Fecha en que se aplica el cargo
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
                <Textarea
                  placeholder="Notas adicionales..."
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Cargo
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
  );
}

export default AdditionalChargeForm;
