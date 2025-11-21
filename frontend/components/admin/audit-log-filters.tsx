'use client';

import { useState } from 'react';
import { Search, Filter, X, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface AuditLogFilters {
  action_type?: string;
  resource_type?: string;
  resource_key?: string;
  admin_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  onExport?: () => void;
}

const ACTION_TYPES = [
  { value: 'PAGE_VISIBILITY_CHANGE', label: 'Page Visibility Change' },
  { value: 'ROLE_PERMISSION_CHANGE', label: 'Role Permission Change' },
  { value: 'BULK_OPERATION', label: 'Bulk Operation' },
  { value: 'CONFIG_CHANGE', label: 'Configuration Change' },
  { value: 'CACHE_CLEAR', label: 'Cache Clear' },
  { value: 'USER_MANAGEMENT', label: 'User Management' },
  { value: 'SYSTEM_SETTINGS', label: 'System Settings' },
];

const RESOURCE_TYPES = [
  { value: 'PAGE', label: 'Page' },
  { value: 'ROLE', label: 'Role' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'USER', label: 'User' },
  { value: 'PERMISSION', label: 'Permission' },
];

export function AuditLogFilters({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  onExport,
}: AuditLogFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const handleReset = () => {
    onReset();
    setIsFiltersOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Filter audit logs by various criteria</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Advanced Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      disabled={activeFilterCount === 0}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>

                  {/* Action Type Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="action_type">Action Type</Label>
                    <Select
                      value={filters.action_type || ''}
                      onValueChange={(value) => handleFilterChange('action_type', value)}
                    >
                      <SelectTrigger id="action_type">
                        <SelectValue placeholder="All action types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All action types</SelectItem>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resource Type Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="resource_type">Resource Type</Label>
                    <Select
                      value={filters.resource_type || ''}
                      onValueChange={(value) => handleFilterChange('resource_type', value)}
                    >
                      <SelectTrigger id="resource_type">
                        <SelectValue placeholder="All resource types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All resource types</SelectItem>
                        {RESOURCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resource Key Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="resource_key">Resource Key</Label>
                    <Input
                      id="resource_key"
                      placeholder="e.g., timer-cards"
                      value={filters.resource_key || ''}
                      onChange={(e) => handleFilterChange('resource_key', e.target.value)}
                    />
                  </div>

                  {/* Date Range Filters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={filters.start_date || ''}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={filters.end_date || ''}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Admin ID Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="admin_id">Admin User ID</Label>
                    <Input
                      id="admin_id"
                      type="number"
                      placeholder="e.g., 123"
                      value={filters.admin_id || ''}
                      onChange={(e) =>
                        handleFilterChange('admin_id', e.target.value ? parseInt(e.target.value) : undefined)
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSearch();
                        setIsFiltersOpen(false);
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search audit logs..."
              className="pl-10"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch();
                }
              }}
            />
          </div>
          <Button onClick={onSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.action_type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Action: {ACTION_TYPES.find((t) => t.value === filters.action_type)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('action_type', undefined)}
                />
              </Badge>
            )}
            {filters.resource_type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Resource: {RESOURCE_TYPES.find((t) => t.value === filters.resource_type)?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('resource_type', undefined)}
                />
              </Badge>
            )}
            {filters.resource_key && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Key: {filters.resource_key}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('resource_key', undefined)}
                />
              </Badge>
            )}
            {(filters.start_date || filters.end_date) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {filters.start_date && filters.end_date
                  ? `${filters.start_date} to ${filters.end_date}`
                  : filters.start_date
                  ? `From ${filters.start_date}`
                  : `Until ${filters.end_date}`}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    handleFilterChange('start_date', undefined);
                    handleFilterChange('end_date', undefined);
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
