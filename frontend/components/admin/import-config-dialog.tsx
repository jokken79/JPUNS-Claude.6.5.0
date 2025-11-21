'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileJson, CheckCircle, AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ImportConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ConfigData {
  exported_at?: string;
  exported_by?: string;
  pages?: Array<{
    page_key: string;
    page_name: string;
    is_enabled: boolean;
    disabled_message?: string;
  }>;
  settings?: Array<{
    key: string;
    value: string;
  }>;
}

interface ImportOptions {
  pages: boolean;
  settings: boolean;
}

interface ValidationWarning {
  type: 'warning' | 'error';
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported_at: string;
  imported_pages: number;
  imported_settings: number;
}

export function ImportConfigDialog({ open, onOpenChange, onSuccess }: ImportConfigDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    pages: true,
    settings: true,
  });
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset dialog state
  const resetDialog = useCallback(() => {
    setStep(1);
    setSelectedFile(null);
    setConfigData(null);
    setImportOptions({ pages: true, settings: true });
    setValidationWarnings([]);
    setImportResult(null);
    setLoading(false);
  }, []);

  // Handle dialog close
  const handleClose = useCallback(() => {
    resetDialog();
    onOpenChange(false);
  }, [resetDialog, onOpenChange]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error('File must be a JSON file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Parse JSON
    try {
      const text = await file.text();
      const json = JSON.parse(text) as ConfigData;
      setConfigData(json);

      // Validate config structure
      const warnings = validateConfig(json);
      setValidationWarnings(warnings);

      // Move to preview step
      setStep(2);
    } catch (error) {
      toast.error('Invalid JSON format');
      setSelectedFile(null);
    }
  }, []);

  // BUG #7 FIX: Validar configuración más completamente
  const validateConfig = (config: ConfigData): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];

    // Check if config has any data
    if (!config.pages && !config.settings) {
      warnings.push({
        type: 'error',
        message: 'Configuration does not contain any pages or settings',
      });
    }

    // Validate pages
    const pageKeys = new Set<string>();
    if (config.pages) {
      config.pages.forEach((page, index) => {
        // Validación: page_key es requerido
        if (!page.page_key) {
          warnings.push({
            type: 'error',
            message: `Page at index ${index} is missing page_key`,
          });
          return;
        }

        // Validación: page_key no debe estar vacío
        if (page.page_key.trim() === '') {
          warnings.push({
            type: 'error',
            message: `Page at index ${index} has empty page_key`,
          });
          return;
        }

        // Validación: no duplicar page_keys
        if (pageKeys.has(page.page_key)) {
          warnings.push({
            type: 'error',
            message: `Duplicate page_key found: "${page.page_key}"`,
          });
          return;
        }
        pageKeys.add(page.page_key);

        // Validación: is_enabled debe ser booleano
        if (typeof page.is_enabled !== 'boolean') {
          warnings.push({
            type: 'error',
            message: `Page "${page.page_key}" has invalid is_enabled value (must be true/false)`,
          });
        }

        // Validación: page_name es recomendado
        if (!page.page_name) {
          warnings.push({
            type: 'warning',
            message: `Page "${page.page_key}" does not have a page_name (recommended)`,
          });
        }
      });
    }

    // Validate settings
    const settingKeys = new Set<string>();
    if (config.settings) {
      config.settings.forEach((setting, index) => {
        // Validación: key es requerido
        if (!setting.key) {
          warnings.push({
            type: 'error',
            message: `Setting at index ${index} is missing key`,
          });
          return;
        }

        // Validación: key no debe estar vacío
        if (setting.key.trim() === '') {
          warnings.push({
            type: 'error',
            message: `Setting at index ${index} has empty key`,
          });
          return;
        }

        // Validación: no duplicar keys
        if (settingKeys.has(setting.key)) {
          warnings.push({
            type: 'error',
            message: `Duplicate setting key found: "${setting.key}"`,
          });
          return;
        }
        settingKeys.add(setting.key);

        // Validación: value es requerido
        if (!setting.value) {
          warnings.push({
            type: 'warning',
            message: `Setting "${setting.key}" has no value (may cause issues)`,
          });
        }
      });
    }

    // Check for export metadata
    if (!config.exported_at) {
      warnings.push({
        type: 'warning',
        message: 'Configuration does not contain export timestamp (may not be a valid export)',
      });
    }

    // Validación: exported_by es recomendado
    if (!config.exported_by) {
      warnings.push({
        type: 'warning',
        message: 'Configuration does not contain export user (recommended for audit trail)',
      });
    }

    return warnings;
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle browse button click
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle next button
  const handleNext = useCallback(() => {
    if (step === 2) {
      // Check if there are any errors
      const hasErrors = validationWarnings.some((w) => w.type === 'error');
      if (hasErrors) {
        toast.error('Please fix validation errors before proceeding');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Execute import
      handleImport();
    }
  }, [step, validationWarnings]);

  // Handle back button
  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!configData) {
      toast.error('No configuration data to import');
      return;
    }

    setLoading(true);

    try {
      // Build import payload
      const payload: any = {};

      if (importOptions.pages && configData.pages) {
        payload.pages = configData.pages;
      }

      if (importOptions.settings && configData.settings) {
        payload.settings = configData.settings;
      }

      // Call import API
      const response = await api.post<ImportResult>('/admin/import-config', payload);

      setImportResult(response.data);
      setStep(4);

      // Show success toast
      toast.success('Configuration imported successfully');

      // Call onSuccess callback
      onSuccess();
    } catch (error: any) {
      console.error('Error importing configuration:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to import configuration';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [configData, importOptions, onSuccess]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Can proceed to next step
  const canProceed =
    (step === 1 && selectedFile) ||
    (step === 2 && !validationWarnings.some((w) => w.type === 'error')) ||
    step === 3;

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Upload Configuration File';
      case 2:
        return 'Preview Configuration';
      case 3:
        return 'Import Options';
      case 4:
        return 'Import Results';
      default:
        return 'Import Configuration';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {step < 4
              ? `Step ${step} of 3: ${getStepTitle()}`
              : 'Configuration import completed'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        {step < 4 && (
          <div className="space-y-2">
            <Progress value={(step / 3) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Upload</span>
              <span>Preview</span>
              <span>Import</span>
            </div>
          </div>
        )}

        <Separator />

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drag & drop JSON file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Maximum file size: 5MB
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileInputChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button variant="outline" type="button">
                Browse Files
              </Button>
            </div>

            {selectedFile && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileJson className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && configData && (
          <div className="space-y-4">
            {/* Export metadata */}
            {(configData.exported_at || configData.exported_by) && (
              <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                <h3 className="font-semibold text-sm">Export Information</h3>
                {configData.exported_at && (
                  <p className="text-sm">
                    <strong>Exported At:</strong> {formatDate(configData.exported_at)}
                  </p>
                )}
                {configData.exported_by && (
                  <p className="text-sm">
                    <strong>Exported By:</strong> {configData.exported_by}
                  </p>
                )}
              </div>
            )}

            {/* Configuration counts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pages</p>
                    <p className="text-2xl font-bold">
                      {configData.pages?.length || 0}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
                {configData.pages && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {configData.pages.filter((p) => p.is_enabled).length} enabled,{' '}
                    {configData.pages.filter((p) => !p.is_enabled).length} disabled
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Settings</p>
                    <p className="text-2xl font-bold">
                      {configData.settings?.length || 0}
                    </p>
                  </div>
                  <FileJson className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </div>
            </div>

            {/* Validation warnings */}
            {validationWarnings.length > 0 && (
              <Alert variant={validationWarnings.some((w) => w.type === 'error') ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {validationWarnings.some((w) => w.type === 'error')
                    ? 'Validation Errors'
                    : 'Validation Warnings'}
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationWarnings.map((warning, index) => (
                      <li key={index} className="text-sm">
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview details */}
            {configData.pages && configData.pages.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Page Visibility Preview</h3>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {configData.pages.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{page.page_key}</span>
                      <Badge variant={page.is_enabled ? 'default' : 'secondary'}>
                        {page.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                  {configData.pages.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      ... and {configData.pages.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Import Options */}
        {step === 3 && configData && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Import Confirmation</AlertTitle>
              <AlertDescription>
                You are about to import configuration data. This will overwrite existing
                settings. Please review your selections carefully.
              </AlertDescription>
            </Alert>

            {/* What to import */}
            <div className="space-y-3">
              <h3 className="font-semibold">What to import:</h3>

              {configData.pages && configData.pages.length > 0 && (
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id="import-pages"
                    checked={importOptions.pages}
                    onCheckedChange={(checked) =>
                      setImportOptions((prev) => ({ ...prev, pages: checked as boolean }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="import-pages" className="font-medium cursor-pointer">
                      Page Visibility Settings
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Import {configData.pages.length} page visibility configurations
                    </p>
                  </div>
                </div>
              )}

              {configData.settings && configData.settings.length > 0 && (
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id="import-settings"
                    checked={importOptions.settings}
                    onCheckedChange={(checked) =>
                      setImportOptions((prev) => ({ ...prev, settings: checked as boolean }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="import-settings" className="font-medium cursor-pointer">
                      System Settings
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Import {configData.settings.length} system settings
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Import Summary:</h3>
              <ul className="text-sm space-y-1">
                {importOptions.pages && configData.pages && (
                  <li>• {configData.pages.length} pages will be updated</li>
                )}
                {importOptions.settings && configData.settings && (
                  <li>• {configData.settings.length} settings will be updated</li>
                )}
                <li>• Existing values will be overwritten</li>
                <li>• Changes take effect immediately</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && importResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Import Successful!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configuration imported at {formatDate(importResult.imported_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Import statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-sm text-muted-foreground">Pages Imported</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.imported_pages}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm text-muted-foreground">Settings Imported</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {importResult.imported_settings}
                </p>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Configuration Updated</AlertTitle>
              <AlertDescription>
                The system configuration has been updated successfully. Changes are now
                active across the application.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step < 4 && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} disabled={loading}>
                  Back
                </Button>
              )}
              <Button onClick={handleNext} disabled={!canProceed || loading}>
                {loading ? 'Importing...' : step === 3 ? 'Import' : 'Next'}
              </Button>
            </>
          )}
          {step === 4 && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
