'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apartmentsV2Service } from '@/lib/api';
import { ChargeType } from '@/types/apartments-v2';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyYenIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FinalCharge {
  charge_type: string;
  description: string;
  amount: number;
}

interface ProratedCalculation {
  monthly_rent: number;
  days_in_month: number;
  days_occupied: number;
  prorated_rent: number;
  daily_rate: number;
  is_prorated: boolean;
  calculation_formula: string;
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

const endAssignmentSchema = z.object({
  end_date: z.string().min(1, 'End date is required'),
  notes: z.string().optional(),
});

type EndAssignmentFormData = z.infer<typeof endAssignmentSchema>;

// ============================================================================
// CHARGE TYPE OPTIONS
// ============================================================================

const CHARGE_TYPE_OPTIONS = [
  { value: ChargeType.CLEANING, label: 'Cleaning (清掃)' },
  { value: ChargeType.REPAIR, label: 'Repair (修理)' },
  { value: ChargeType.DEPOSIT, label: 'Deposit (保証金)' },
  { value: ChargeType.PENALTY, label: 'Penalty (違約金)' },
  { value: ChargeType.OTHER, label: 'Other (その他)' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EndAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = parseInt(params.id as string);

  // ========================================
  // STATE
  // ========================================

  const [applyCleaningFee, setApplyCleaningFee] = useState(true);
  const [cleaningFeeAmount, setCleaningFeeAmount] = useState(20000);
  const [additionalCharges, setAdditionalCharges] = useState<FinalCharge[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [calculation, setCalculation] = useState<ProratedCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // New charge form state
  const [newChargeType, setNewChargeType] = useState('');
  const [newChargeDescription, setNewChargeDescription] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');

  // ========================================
  // REACT HOOK FORM
  // ========================================

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EndAssignmentFormData>({
    resolver: zodResolver(endAssignmentSchema),
    defaultValues: {
      end_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const endDate = watch('end_date');

  // ========================================
  // FETCH ASSIGNMENT
  // ========================================

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => apartmentsV2Service.getAssignment(id),
  });

  // ========================================
  // CALCULATE PRORATED RENT
  // ========================================

  useEffect(() => {
    if (!assignment || !endDate) return;

    const calculateProrated = async () => {
      setIsCalculating(true);
      try {
        const endDateObj = new Date(endDate);
        const year = endDateObj.getFullYear();
        const month = endDateObj.getMonth() + 1;

        const result = await apartmentsV2Service.calculateProratedRent({
          monthly_rent: assignment.monthly_rent,
          start_date: assignment.start_date,
          end_date: endDate,
          year,
          month,
        });

        setCalculation(result);
      } catch (error) {
        console.error('Failed to calculate prorated rent:', error);
        toast({
          title: 'Calculation Error',
          description: 'Failed to calculate prorated rent. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsCalculating(false);
      }
    };

    calculateProrated();
  }, [assignment, endDate, toast]);

  // ========================================
  // VALIDATION
  // ========================================

  const validateEndDate = (date: string): string | null => {
    if (!assignment) return null;

    const endDateObj = new Date(date);
    const startDateObj = new Date(assignment.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDateObj < startDateObj) {
      return 'End date cannot be before start date';
    }

    if (endDateObj > today) {
      return 'End date cannot be in the future';
    }

    return null;
  };

  // ========================================
  // CALCULATE TOTALS
  // ========================================

  const calculateTotals = () => {
    const proratedRent = calculation?.prorated_rent || 0;
    const cleaningFee = applyCleaningFee ? cleaningFeeAmount : 0;
    const additionalChargesSum = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const totalDeduction = proratedRent + cleaningFee + additionalChargesSum;

    return {
      proratedRent,
      cleaningFee,
      additionalChargesSum,
      totalDeduction,
    };
  };

  const totals = calculateTotals();

  // ========================================
  // ADD CHARGE HANDLER
  // ========================================

  const handleAddCharge = () => {
    if (!newChargeType) {
      toast({
        title: 'Validation Error',
        description: 'Please select a charge type',
        variant: 'destructive',
      });
      return;
    }

    if (!newChargeDescription.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(newChargeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const newCharge: FinalCharge = {
      charge_type: newChargeType,
      description: newChargeDescription,
      amount,
    };

    setAdditionalCharges([...additionalCharges, newCharge]);

    // Reset form
    setNewChargeType('');
    setNewChargeDescription('');
    setNewChargeAmount('');

    toast({
      title: 'Charge Added',
      description: 'Additional charge has been added successfully',
    });
  };

  // ========================================
  // REMOVE CHARGE HANDLER
  // ========================================

  const handleRemoveCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
    toast({
      title: 'Charge Removed',
      description: 'Additional charge has been removed',
    });
  };

  // ========================================
  // END ASSIGNMENT MUTATION
  // ========================================

  const endMutation = useMutation({
    mutationFn: async (data: EndAssignmentFormData) => {
      const dateValidationError = validateEndDate(data.end_date);
      if (dateValidationError) {
        throw new Error(dateValidationError);
      }

      // Prepare additional charges with charge_date
      const chargesWithDate = additionalCharges.map((charge) => ({
        ...charge,
        charge_date: data.end_date,
      }));

      return await apartmentsV2Service.endAssignment(id, {
        end_date: data.end_date,
        include_cleaning_fee: applyCleaningFee,
        cleaning_fee: applyCleaningFee ? cleaningFeeAmount : 0,
        additional_charges: chargesWithDate.length > 0 ? chargesWithDate : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: 'Assignment Ended',
        description: 'The assignment has been ended successfully',
      });
      router.push(`/apartment-assignments/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to end assignment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // ========================================
  // SUBMIT HANDLER
  // ========================================

  const onSubmit = (data: EndAssignmentFormData) => {
    const dateValidationError = validateEndDate(data.end_date);
    if (dateValidationError) {
      toast({
        title: 'Validation Error',
        description: dateValidationError,
        variant: 'destructive',
      });
      return;
    }

    if (cleaningFeeAmount < 0) {
      toast({
        title: 'Validation Error',
        description: 'Cleaning fee amount cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmEnd = () => {
    const data = {
      end_date: endDate,
      notes: watch('notes'),
    };
    endMutation.mutate(data);
    setShowConfirmDialog(false);
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (isLoading || !assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading assignment details...</div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">End Assignment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            End the assignment for {assignment.employee?.full_name_kanji} at{' '}
            {assignment.apartment?.name}
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800">This action cannot be undone</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Once the assignment is ended, the employee will be unassigned from the apartment
                and the assignment status will change to "Ended".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-medium">{assignment.employee?.full_name_kanji}</p>
              <p className="text-sm text-muted-foreground">
                ID: {assignment.employee?.hakenmoto_id}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Apartment</p>
              <p className="font-medium">{assignment.apartment?.name}</p>
              <p className="text-sm text-muted-foreground">{assignment.apartment?.full_address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {new Date(assignment.start_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="font-medium">¥{assignment.monthly_rent.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>End Assignment Details</CardTitle>
            <CardDescription>
              Provide the end date and any additional charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end_date">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                End Date *
              </Label>
              <Input
                id="end_date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                {...register('end_date')}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date.message}</p>
              )}
            </div>

            {/* Cleaning Fee */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply_cleaning_fee"
                  checked={applyCleaningFee}
                  onCheckedChange={(checked) => setApplyCleaningFee(checked as boolean)}
                />
                <Label
                  htmlFor="apply_cleaning_fee"
                  className="text-sm font-medium cursor-pointer"
                >
                  Apply Cleaning Fee (清掃費)
                </Label>
              </div>

              {applyCleaningFee && (
                <div className="space-y-2">
                  <Label htmlFor="cleaning_fee_amount">Cleaning Fee Amount (¥)</Label>
                  <Input
                    id="cleaning_fee_amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={cleaningFeeAmount}
                    onChange={(e) => setCleaningFeeAmount(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>

            {/* Additional Charges */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Additional Charges (追加料金)</h3>

              {/* Existing Charges List */}
              {additionalCharges.length > 0 && (
                <div className="space-y-2">
                  {additionalCharges.map((charge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {CHARGE_TYPE_OPTIONS.find((opt) => opt.value === charge.charge_type)
                              ?.label || charge.charge_type}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm">{charge.description}</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">
                          ¥{charge.amount.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCharge(index)}
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Charge Form */}
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_charge_type">Charge Type</Label>
                    <Select value={newChargeType} onValueChange={setNewChargeType}>
                      <SelectTrigger id="new_charge_type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARGE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_charge_description">Description</Label>
                    <Input
                      id="new_charge_description"
                      placeholder="e.g., Window repair"
                      value={newChargeDescription}
                      onChange={(e) => setNewChargeDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_charge_amount">Amount (¥)</Label>
                    <Input
                      id="new_charge_amount"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      value={newChargeAmount}
                      onChange={(e) => setNewChargeAmount(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="button" variant="outline" onClick={handleAddCharge}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional information about ending this assignment"
                rows={4}
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Calculation Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Final Deduction Preview</CardTitle>
            <CardDescription>
              {isCalculating ? 'Calculating...' : 'Review the final deduction breakdown'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCalculating ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Calculating prorated rent...</p>
              </div>
            ) : calculation ? (
              <div className="space-y-4">
                {/* Calculation Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Days in Month</p>
                    <p className="font-medium">{calculation.days_in_month} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days Occupied</p>
                    <p className="font-medium">{calculation.days_occupied} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Rate</p>
                    <p className="font-medium">¥{calculation.daily_rate.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prorated</p>
                    <p className="font-medium">{calculation.is_prorated ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Calculation Formula:</p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {calculation.calculation_formula}
                  </code>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prorated Rent</span>
                    <span className="font-medium">¥{totals.proratedRent.toLocaleString()}</span>
                  </div>

                  {applyCleaningFee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cleaning Fee</span>
                      <span className="font-medium">¥{totals.cleaningFee.toLocaleString()}</span>
                    </div>
                  )}

                  {additionalCharges.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Additional Charges ({additionalCharges.length})
                      </span>
                      <span className="font-medium">
                        ¥{totals.additionalChargesSum.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total Final Deduction</span>
                    <span className="text-primary">
                      <CurrencyYenIcon className="inline h-5 w-5 mr-1" />
                      {totals.totalDeduction.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Unable to calculate prorated rent</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-6">
          <Button type="submit" variant="destructive" disabled={endMutation.isPending}>
            {endMutation.isPending ? 'Ending Assignment...' : 'End Assignment'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm End Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee:</span>
                <span className="font-medium">{assignment.employee?.full_name_kanji}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Apartment:</span>
                <span className="font-medium">{assignment.apartment?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-medium">
                  {new Date(endDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Total Deduction:</span>
                <span className="text-primary">¥{totals.totalDeduction.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={endMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmEnd}
              disabled={endMutation.isPending}
            >
              {endMutation.isPending ? 'Ending...' : 'Confirm End Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
