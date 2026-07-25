import React from 'react';
import { 
  FileText, 
  CreditCard, 
  Droplet, 
  Calendar, 
  TrendingDown, 
  Package, 
  BookOpen, 
  Gauge, 
  Users, 
  Building2, 
  FileSpreadsheet,
  Scale,
  Shield
} from 'lucide-react';

interface ReportsProps {
  onReportSelect: (reportId: string) => void;
}

const reportCategories = [
  {
    id: 'daily-shift-report',
    title: 'Daily Shift Report',
    description: 'View shift-wise sales, collections, and performance metrics',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'credit-sale-report',
    title: 'Credit Sale Report',
    description: 'Track credit transactions and outstanding payments',
    icon: CreditCard,
    color: 'emerald'
  },
  {
    id: 'own-usage-report',
    title: 'Own Usage Report',
    description: 'Monitor fuel consumption for internal usage',
    icon: Droplet,
    color: 'cyan'
  },
  {
    id: 'monthly-yearly-summary',
    title: 'Monthly/Yearly Summary',
    description: 'Comprehensive summary reports for any period',
    icon: Calendar,
    color: 'purple'
  },
  {
    id: 'daily-sales-report',
    title: 'Daily Sales Report (DSR)',
    description: 'Detailed daily sales breakdown by product',
    icon: TrendingDown,
    color: 'orange'
  },
  {
    id: 'cash-shortage-report',
    title: 'Cash Shortage Report',
    description: 'Identify cash variances and reconciliation issues',
    icon: TrendingDown,
    color: 'rose'
  },
  {
    id: 'stock-report',
    title: 'Stock Report',
    description: 'Current inventory levels and stock movements',
    icon: Package,
    color: 'amber'
  },
  {
    id: 'ledger-statement',
    title: 'Ledger Statement',
    description: 'Account-wise transaction history and balances',
    icon: BookOpen,
    color: 'indigo'
  },
  {
    id: 'dispensing-unit-sale',
    title: 'Dispensing Unit/Nozzle Sale',
    description: 'Nozzle-wise and pump-wise sales analysis',
    icon: Gauge,
    color: 'violet'
  },
  {
    id: 'employee-performance',
    title: 'Employee Performance',
    description: 'Staff productivity and performance metrics',
    icon: Users,
    color: 'pink'
  },
  {
    id: 'integrated-report',
    title: 'Integrated Multi-Outlet Report',
    description: 'Consolidated reports across multiple locations',
    icon: Building2,
    color: 'teal'
  },
  {
    id: 'customised-reports',
    title: 'Customised Reports',
    description: 'Create custom reports with selected parameters',
    icon: FileSpreadsheet,
    color: 'lime'
  },
  {
    id: 'tds-tcs-report',
    title: 'TDS & TCS Report',
    description: 'Tax deducted/collected at source reports',
    icon: Scale,
    color: 'sky'
  },
  {
    id: 'audit-trails',
    title: 'Audit Trails',
    description: 'Complete audit log of system activities',
    icon: Shield,
    color: 'fuchsia'
  }
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-500',
    hover: 'hover:bg-blue-500/20 hover:border-blue-500/50',
    hoverText: 'group-hover:text-blue-600'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-500',
    hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/50',
    hoverText: 'group-hover:text-emerald-600'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-500',
    hover: 'hover:bg-cyan-500/20 hover:border-cyan-500/50',
    hoverText: 'group-hover:text-cyan-600'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-500',
    hover: 'hover:bg-purple-500/20 hover:border-purple-500/50',
    hoverText: 'group-hover:text-purple-600'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-500',
    hover: 'hover:bg-orange-500/20 hover:border-orange-500/50',
    hoverText: 'group-hover:text-orange-600'
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: 'text-rose-500',
    hover: 'hover:bg-rose-500/20 hover:border-rose-500/50',
    hoverText: 'group-hover:text-rose-600'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    hover: 'hover:bg-amber-500/20 hover:border-amber-500/50',
    hoverText: 'group-hover:text-amber-600'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: 'text-indigo-500',
    hover: 'hover:bg-indigo-500/20 hover:border-indigo-500/50',
    hoverText: 'group-hover:text-indigo-600'
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    icon: 'text-violet-500',
    hover: 'hover:bg-violet-500/20 hover:border-violet-500/50',
    hoverText: 'group-hover:text-violet-600'
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: 'text-pink-500',
    hover: 'hover:bg-pink-500/20 hover:border-pink-500/50',
    hoverText: 'group-hover:text-pink-600'
  },
  teal: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    icon: 'text-teal-500',
    hover: 'hover:bg-teal-500/20 hover:border-teal-500/50',
    hoverText: 'group-hover:text-teal-600'
  },
  lime: {
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    icon: 'text-lime-500',
    hover: 'hover:bg-lime-500/20 hover:border-lime-500/50',
    hoverText: 'group-hover:text-lime-600'
  },
  sky: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    icon: 'text-sky-500',
    hover: 'hover:bg-sky-500/20 hover:border-sky-500/50',
    hoverText: 'group-hover:text-sky-600'
  },
  fuchsia: {
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    icon: 'text-fuchsia-500',
    hover: 'hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50',
    hoverText: 'group-hover:text-fuchsia-600'
  }
};

export function Reports({ onReportSelect }: ReportsProps) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-sidebar-foreground mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Access comprehensive reports and analytics for your fuel station operations
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reportCategories.map((report) => {
          const Icon = report.icon;
          const colors = colorClasses[report.color as keyof typeof colorClasses];
          
          return (
            <button
              key={report.id}
              onClick={() => onReportSelect(report.id)}
              className={`group relative p-6 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.hover} transition-all duration-300 hover:scale-105 hover:shadow-lg text-left`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>

              {/* Content */}
              <h3 className={`text-sidebar-foreground font-medium mb-2 ${colors.hoverText} transition-colors`}>
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>

              {/* Hover indicator */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-2 h-2 rounded-full ${colors.icon.replace('text-', 'bg-')}`}></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
