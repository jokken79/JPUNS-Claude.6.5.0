'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { userManagementService, type UserManagementUser } from '@/lib/api';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'KANRININSHA', label: 'Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'CONTRACT_WORKER', label: 'Contract Worker' },
  { value: 'KEITOSAN', label: 'Finance Manager' },
  { value: 'TANTOSHA', label: 'Representative' },
];

interface UserDialogProps {
  mode: 'create' | 'edit' | 'reset-password';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserManagementUser | null;
  onSuccess: () => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const initialFormData: FormData = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  full_name: '',
  role: 'EMPLOYEE',
  is_active: true,
};

export function UserDialog({ mode, open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          full_name: user.full_name || '',
          role: user.role || 'EMPLOYEE',
          is_active: user.is_active ?? true,
        });
      } else if (mode === 'reset-password') {
        setFormData({
          ...initialFormData,
          username: user?.username || '',
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, mode, user]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode !== 'reset-password') {
      // Username validation
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }

      // Role validation
      if (!formData.role) {
        newErrors.role = 'Role is required';
      }
    }

    // Password validation (for create and reset-password)
    if (mode === 'create' || mode === 'reset-password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else {
        // Check password strength
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumber = /\d/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
          newErrors.password =
            'Password must contain uppercase, lowercase, number, and special character';
        }
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        await userManagementService.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || undefined,
          role: formData.role,
        });
        toast.success(`User ${formData.username} created successfully`);
      } else if (mode === 'edit' && user) {
        await userManagementService.updateUser(user.id, {
          username: formData.username !== user.username ? formData.username : undefined,
          email: formData.email !== user.email ? formData.email : undefined,
          full_name: formData.full_name !== user.full_name ? formData.full_name : undefined,
          role: formData.role !== user.role ? formData.role : undefined,
          is_active: formData.is_active !== user.is_active ? formData.is_active : undefined,
        });
        toast.success(`User ${formData.username} updated successfully`);
      } else if (mode === 'reset-password' && user) {
        await userManagementService.resetPassword(user.id, {
          new_password: formData.password,
        });
        toast.success(`Password reset successfully for ${user.username}`);
      }

      onSuccess();
    } catch (error: any) {
      console.error(`Error ${mode}ing user:`, error);
      const errorMessage = error.response?.data?.detail || `Failed to ${mode} user`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get dialog title and description
  const getDialogTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New User';
      case 'edit':
        return `Edit User: ${user?.username}`;
      case 'reset-password':
        return `Reset Password: ${user?.username}`;
      default:
        return 'User Management';
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case 'create':
        return 'Create a new user account with role and permissions';
      case 'edit':
        return 'Update user information and settings';
      case 'reset-password':
        return 'Set a new password for this user';
      default:
        return '';
    }
  };

  const getDialogIcon = () => {
    switch (mode) {
      case 'create':
        return <Plus className="h-5 w-5" />;
      case 'edit':
        return <Edit2 className="h-5 w-5" />;
      case 'reset-password':
        return <Key className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDialogIcon()}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          {mode !== 'reset-password' && (
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={loading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>
          )}

          {/* Email */}
          {mode !== 'reset-password' && (
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
          )}

          {/* Password */}
          {(mode === 'create' || mode === 'reset-password') && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
            </div>
          )}

          {/* Confirm Password */}
          {(mode === 'create' || mode === 'reset-password') && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Full Name */}
          {mode !== 'reset-password' && (
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={loading}
              />
            </div>
          )}

          {/* Role */}
          {mode !== 'reset-password' && (
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
            </div>
          )}

          {/* Active Status */}
          {mode === 'edit' && (
            <div className="flex items-center justify-between space-y-2 p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive users cannot log in
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
                disabled={loading}
              />
            </div>
          )}

          {mode === 'create' && (
            <div className="flex items-center justify-between space-y-2 p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_active_create">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Set initial active status
                </p>
              </div>
              <Switch
                id="is_active_create"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
                disabled={loading}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Processing...'
                : mode === 'create'
                ? 'Create User'
                : mode === 'edit'
                ? 'Save Changes'
                : 'Reset Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
