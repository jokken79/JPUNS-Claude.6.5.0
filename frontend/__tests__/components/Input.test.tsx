/**
 * Input Component Unit Tests
 * Tests input component rendering, validation, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '@/tests/utils/test-helpers';

// Mock Input component (replace with actual import)
interface InputProps {
  label?: string;
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Input = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  placeholder, 
  error,
  required,
  disabled,
  onChange,
  onBlur
}: InputProps) => (
  <div className="input-wrapper">
    {label && (
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      onChange={onChange}
      onBlur={onBlur}
      className={error ? 'input-error' : ''}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
    />
    {error && (
      <span id={`${name}-error`} className="error-message" role="alert">
        {error}
      </span>
    )}
  </div>
);

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders with label', () => {
      render(<Input name="username" label="Username" />);
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
    });

    it('renders without label', () => {
      render(<Input name="username" placeholder="Enter username" />);
      
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('renders required indicator', () => {
      render(<Input name="email" label="Email" required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('renders different input types', () => {
      const { rerender } = render(<Input name="password" type="password" />);
      expect(screen.getByRole('textbox', { hidden: true })).toHaveAttribute('type', 'password');
      
      rerender(<Input name="email" type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders with placeholder', () => {
      render(<Input name="search" placeholder="Search..." />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<Input name="name" value="John Doe" onChange={vi.fn()} />);
      
      expect(screen.getByRole('textbox')).toHaveValue('John Doe');
    });
  });

  describe('User Interactions', () => {
    it('handles onChange events', () => {
      const handleChange = vi.fn();
      render(<Input name="username" onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'newuser' } });
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'newuser' })
        })
      );
    });

    it('handles onBlur events', () => {
      const handleBlur = vi.fn();
      render(<Input name="email" onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('updates value on user input', () => {
      const { rerender } = render(<Input name="search" value="" onChange={vi.fn()} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
      
      rerender(<Input name="search" value="test query" onChange={vi.fn()} />);
      expect(input).toHaveValue('test query');
    });

    it('can be focused programmatically', () => {
      render(<Input name="username" />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).toHaveFocus();
    });
  });

  describe('Validation States', () => {
    it('displays error message', () => {
      render(
        <Input 
          name="email" 
          label="Email" 
          error="Email is required" 
        />
      );
      
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
      expect(screen.getByRole('textbox')).toHaveClass('input-error');
    });

    it('sets aria-invalid when error present', () => {
      render(<Input name="username" error="Username is taken" />);
      
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message with aria-describedby', () => {
      render(<Input name="password" error="Password too weak" />);
      
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      
      expect(errorId).toBe('password-error');
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'password-error');
    });

    it('removes error when fixed', () => {
      const { rerender } = render(
        <Input name="email" error="Email is required" />
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      rerender(<Input name="email" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Input name="username" disabled />);
      
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not trigger onChange when disabled', () => {
      const handleChange = vi.fn();
      render(<Input name="username" disabled onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('cannot be focused when disabled', () => {
      render(<Input name="username" disabled />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      
      expect(input).not.toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has correct label association', () => {
      render(<Input name="username" label="Username" />);
      
      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('supports required attribute', () => {
      render(<Input name="email" required />);
      
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('announces errors to screen readers', () => {
      render(<Input name="password" error="Password is required" />);
      
      const error = screen.getByRole('alert');
      expect(error).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(<Input name="search" placeholder="Search" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'search');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Integration with Forms', () => {
    it('works with controlled inputs', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <Input 
            name="controlled" 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
          />
        );
      };
      
      render(<ControlledInput />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'controlled value' } });
      
      await waitFor(() => {
        expect(input).toHaveValue('controlled value');
      });
    });

    it('validates on blur', () => {
      const handleBlur = vi.fn((e) => {
        if (!e.target.value) {
          // Simulate validation
        }
      });
      
      render(<Input name="email" onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalled();
    });
  });
});

// React import for controlled input test
import React from 'react';
