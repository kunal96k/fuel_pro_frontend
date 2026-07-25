import React, { useState } from 'react';
import { ArrowLeft, Download, Filter, Calendar, Search, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ReportViewerProps {
  reportId: string;
  reportTitle: string;
  onBack: () => void;
}

export function ReportViewer({ reportId, reportTitle, onBack }: ReportViewerProps) {
  const [dateRange, setDateRange] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual data based on reportId
  const mockData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    date: new Date(2024, 2, i + 1).toLocaleDateString('en-IN'),
    description: `Transaction ${i + 1}`,
    amount: (Math.random() * 50000 + 10000).toFixed(2),
    status: i % 3 === 0 ? 'Completed' : i % 3 === 1 ? 'Pending' : 'Processing'
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sidebar-foreground mb-2">{reportTitle}</h1>
            <p className="text-muted-foreground">
              View and export detailed report data
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="gap-2 bg-violet-500 hover:bg-violet-600">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-sidebar-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-sidebar-border rounded-lg text-sidebar-foreground"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Status</label>
            <select className="w-full px-3 py-2 bg-background border border-sidebar-border rounded-lg text-sidebar-foreground">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
            </select>
          </div>

          {/* Apply Filters */}
          <div className="flex items-end">
            <Button className="w-full gap-2 bg-violet-500 hover:bg-violet-600">
              <Filter className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-sidebar-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-2xl font-semibold text-sidebar-foreground">1,234</p>
          <p className="text-xs text-green-500 mt-1">+12.5% from last period</p>
        </div>
        
        <div className="bg-card border border-sidebar-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-2xl font-semibold text-sidebar-foreground">₹4,56,789</p>
          <p className="text-xs text-green-500 mt-1">+8.3% from last period</p>
        </div>
        
        <div className="bg-card border border-sidebar-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-semibold text-sidebar-foreground">987</p>
          <p className="text-xs text-muted-foreground mt-1">80% completion rate</p>
        </div>
        
        <div className="bg-card border border-sidebar-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-semibold text-sidebar-foreground">247</p>
          <p className="text-xs text-amber-500 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-sidebar-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-sidebar-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-sidebar-foreground">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-sidebar-foreground">Description</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-sidebar-foreground">Amount (₹)</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-sidebar-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-sidebar-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={`border-b border-sidebar-border hover:bg-muted/30 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-sidebar-foreground">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-sidebar-foreground">{row.description}</td>
                  <td className="px-6 py-4 text-sm text-sidebar-foreground font-medium">₹{row.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === 'Completed' 
                        ? 'bg-green-500/10 text-green-500' 
                        : row.status === 'Pending'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button variant="ghost" size="sm" className="text-violet-500 hover:text-violet-600">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-sidebar-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1 to 15 of 1,234 entries
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-violet-500 text-white hover:bg-violet-600">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
