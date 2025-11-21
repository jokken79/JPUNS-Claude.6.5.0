'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import type { SystemSetting } from '@/lib/api';

interface SettingEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: SystemSetting | null;
  onSave: (key: string, value: any) => Promise<void>;
}

export function SettingEditDialog({
  open,
  onOpenChange,
  setting,
  onSave,
}: SettingEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  // Determine setting type from value or key
  const getSettingType = (setting: SystemSetting | null): 'string' | 'boolean' | 'integer' | 'enum' => {
    if (!setting) return 'string';

    if (setting.setting_type) return setting.setting_type;

    // Infer from value
    const value = setting.value;
    if (value === 'true' || value === 'false') return 'boolean';
    if (value && !isNaN(Number(value))) return 'integer';
    if (setting.allowed_values && setting.allowed_values.length > 0) return 'enum';

    return 'string';
  };

  const settingType = getSettingType(setting);
  const booleanValue = watch('booleanValue');

  useEffect(() => {
    if (setting) {
      if (settingType === 'boolean') {
        setValue('booleanValue', setting.value === 'true');
      } else {
        setValue('value', setting.value || '');
      }
    }
  }, [setting, setValue, settingType]);

  const onSubmit = async (data: any) => {
    if (!setting) return;

    try {
      setLoading(true);

      let value: any;
      if (settingType === 'boolean') {
        value = data.booleanValue ? 'true' : 'false';
      } else if (settingType === 'integer') {
        value = data.value.toString();
      } else {
        value = data.value;
      }

      await onSave(setting.key, value);
      toast.success(`Setting ${setting.key} updated successfully`);
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error(error.response?.data?.detail || 'Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = () => {
    if (!setting) return null;

    switch (settingType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id="booleanValue"
              checked={booleanValue}
              onCheckedChange={(checked) => setValue('booleanValue', checked)}
            />
            <Label htmlFor="booleanValue">
              {booleanValue ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );

      case 'integer':
        return (
          <Input
            id="value"
            type="number"
            placeholder="Enter number"
            {...register('value', {
              required: 'Value is required',
              pattern: {
                value: /^-?\d+$/,
                message: 'Must be a valid integer',
              },
            })}
          />
        );

      case 'enum':
        return (
          <Select
            value={watch('value')}
            onValueChange={(value) => setValue('value', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {setting.allowed_values?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'string':
      default:
        // Use textarea for long values
        const isLongText = (setting.value?.length || 0) > 100;

        if (isLongText) {
          return (
            <Textarea
              id="value"
              placeholder="Enter value"
              rows={4}
              {...register('value', { required: 'Value is required' })}
            />
          );
        }

        return (
          <Input
            id="value"
            type="text"
            placeholder="Enter value"
            {...register('value', { required: 'Value is required' })}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Setting</DialogTitle>
          <DialogDescription>
            Update the value for <strong>{setting?.key}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Description */}
          {setting?.description && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            </div>
          )}

          {/* Input Field */}
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            {renderInput()}
            {errors.value && (
              <p className="text-sm text-destructive">
                {errors.value.message as string}
              </p>
            )}
          </div>

          {/* Type Info */}
          <div className="text-xs text-muted-foreground">
            Type: <span className="font-mono">{settingType}</span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
