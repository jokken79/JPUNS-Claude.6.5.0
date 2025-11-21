/**
 * Component props fixtures for testing
 * Provides default props for common components
 */

// Button props
export const mockButtonProps = {
  onClick: () => {},
  disabled: false,
  variant: 'primary' as const,
  size: 'md' as const,
  children: 'Click me',
};

// Input props
export const mockInputProps = {
  id: 'test-input',
  name: 'testInput',
  value: '',
  onChange: () => {},
  placeholder: 'Enter text',
  type: 'text' as const,
};

// Form props
export const mockFormProps = {
  onSubmit: () => {},
  className: 'test-form',
};

// Modal props
export const mockModalProps = {
  isOpen: true,
  onClose: () => {},
  title: 'Test Modal',
  children: 'Modal content',
};

// Table props
export const mockTableProps = {
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ],
  data: [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ],
  onRowClick: () => {},
};

// Pagination props
export const mockPaginationProps = {
  currentPage: 1,
  totalPages: 5,
  onPageChange: () => {},
};

// Search props
export const mockSearchProps = {
  value: '',
  onChange: () => {},
  onSearch: () => {},
  placeholder: 'Search...',
};

// Employee form props
export const mockEmployeeFormProps = {
  onSubmit: () => {},
  initialData: null,
  isLoading: false,
};

// Candidate form props
export const mockCandidateFormProps = {
  onSubmit: () => {},
  initialData: null,
  isLoading: false,
};
