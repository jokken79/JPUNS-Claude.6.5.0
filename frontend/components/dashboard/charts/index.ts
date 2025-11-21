/**
 * Dashboard Charts - Centralized Exports
 */

// Area Charts
export {
  AreaChartCard,
  EmployeeTrendChart,
  WorkHoursTrendChart,
  SalaryTrendChart,
} from './AreaChartCard';

// Bar Charts
export {
  BarChartCard,
  MonthlySalaryBarChart,
  FactoryDistributionBarChart,
  StackedGrowthBarChart,
  ComparisonBarChart,
} from './BarChartCard';

// Donut Charts
export {
  DonutChartCard,
  EmployeeStatusDonutChart,
  NationalityDonutChart,
  FactoryDonutChart,
  ContractTypeDonutChart,
} from './DonutChartCard';

// Trend Cards
export {
  TrendCard,
  EmployeeTrendCard,
  HoursTrendCard,
  SalaryTrendCard,
  CandidatesTrendCard,
} from './TrendCard';

// Occupancy Chart
export { OccupancyChart } from './OccupancyChart';

// Types
export type {
  AreaChartDataPoint,
  AreaChartSeries,
  AreaChartCardProps,
} from './AreaChartCard';

export type {
  BarChartDataPoint,
  BarChartSeries,
  BarChartCardProps,
} from './BarChartCard';

export type {
  DonutChartDataPoint,
  DonutChartCardProps,
} from './DonutChartCard';

export type {
  TrendDataPoint,
  TrendCardProps,
} from './TrendCard';

export type {
  OccupancyData,
  OccupancyChartProps,
} from './OccupancyChart';
