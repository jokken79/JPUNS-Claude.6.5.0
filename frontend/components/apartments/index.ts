/**
 * Apartment Components - Barrel Export
 *
 * Modular components for apartment management in UNS-ClaudeJP 5.4.1
 * All components use TypeScript strict mode, React 19, and Shadcn/ui
 */

// Card Components
export { ApartmentCard } from './ApartmentCard';
export { AssignmentCard } from './AssignmentCard';
export { DeductionCard } from './DeductionCard';
export { StatCard } from './StatCard';
export { ReportCard } from './ReportCard';

// Form Components
export { AssignmentForm } from './AssignmentForm';
export { AdditionalChargeForm } from './AdditionalChargeForm';

// Selector Components
export { ApartmentSelectorEnhanced } from './ApartmentSelector-enhanced';

// Statistics & Visualization
export { OccupancyStats } from './OccupancyStats';
export { RentCalculator } from './RentCalculator';

// Type exports (for convenience)
export type { ApartmentCardProps } from './ApartmentCard';
export type { AssignmentCardProps } from './AssignmentCard';
export type { StatCardProps } from './StatCard';
