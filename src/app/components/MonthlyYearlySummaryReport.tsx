import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
  IndianRupee,
  Calendar,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  FileDown,
  Fuel,
  Droplet,
  CreditCard,
  Banknote,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Receipt,
  Layers,
  Gauge,
  Clock
} from 'lucide-react';
import {
  fetchMonthlySummaryReportApi,
  SummaryReportQueryParams,
  SummaryReportResponse
} from '../services/api';
import { toast } from 'sonner';

export interface SummaryReportRow {
  id: string;
  rowNumber?: number;
  date: string;
  monthName?: string;
  period?: string;
  shift: string;
  petrolQty: number;
  petrolAmount: number;
  dieselQty: number;
  dieselAmount: number;
  totalSales: number;
  phonePe: number;
  bpclAlp: number;
  ufil: number;
  hdfcSwap: number;
  fino: number;
  rtgs: number;
  totalOnline: number;
  creditSales: number;
  nios: number;
  legender: number;
  seltos: number;
  scorpio: number;
  tanker: number;
  dgSet: number;
  totalConsumption: number;
  netCashSales: number;
  employeeDeposit: number;
  finalChallan: number;
  difference: number;
}

const FISCAL_YEARS = [
  '2029-2030',
  '2028-2029',
  '2027-2028',
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024'
];

const MONTHS = [
  { value: 'ALL', label: 'All Months (Full Year)' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
];

const ALL_MPD_OPTIONS = [
  { id: 'MPD-1', label: 'MPD 1' },
  { id: 'MPD-2', label: 'MPD 2' },
  { id: 'MPD-3', label: 'MPD 3' },
  { id: 'MPD-4', label: 'MPD 4' },
];

export function MonthlyYearlySummaryReport() {
  // ── Filters ──
  const [viewMode, setViewMode] = useState<'shift' | 'day' | 'year'>('shift');
  const [fiscalYear, setFiscalYear] = useState<string>('2025-2026');
  const [month, setMonth] = useState<string>('03');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedMpds, setSelectedMpds] = useState<string[]>(['MPD-1', 'MPD-2', 'MPD-3', 'MPD-4']);
  const [isMpdDropdownOpen, setIsMpdDropdownOpen] = useState<boolean>(false);
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ── Sorting & Server-Side Pagination ──
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);

  // ── Data State ──
  const [records, setRecords] = useState<SummaryReportRow[]>([]);
  const [grandTotal, setGrandTotal] = useState<Partial<SummaryReportRow>>({});
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Helpers
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatLitres = (qty?: number) => {
    if (qty === undefined || qty === null || isNaN(qty)) return '0.00 L';
    return Number(qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L';
  };

  const formatDateDisplay = (dateStr: string, row: SummaryReportRow) => {
    if (viewMode === 'year') {
      return row.monthName || row.period || dateStr;
    }
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // MPD Multi-select toggle handlers
  const handleToggleAllMpds = () => {
    if (selectedMpds.length === ALL_MPD_OPTIONS.length) {
      setSelectedMpds([]);
    } else {
      setSelectedMpds(ALL_MPD_OPTIONS.map(m => m.id));
    }
    setCurrentPage(0);
  };

  const handleToggleMpd = (mpdId: string) => {
    setSelectedMpds(prev => {
      if (prev.includes(mpdId)) {
        return prev.filter(id => id !== mpdId);
      } else {
        return [...prev, mpdId];
      }
    });
    setCurrentPage(0);
  };

  const getMpdButtonLabel = () => {
    if (selectedMpds.length === ALL_MPD_OPTIONS.length) return 'All MPDs (4)';
    if (selectedMpds.length === 0) return 'No MPD Selected';
    if (selectedMpds.length === 1) {
      const found = ALL_MPD_OPTIONS.find(m => m.id === selectedMpds[0]);
      return found ? found.label : selectedMpds[0];
    }
    return `${selectedMpds.length} MPDs Selected`;
  };

  // ── Fetch summary report ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const mpdParam = (selectedMpds.length === 0 || selectedMpds.length === ALL_MPD_OPTIONS.length)
        ? 'ALL'
        : selectedMpds.join(',');

      const params: SummaryReportQueryParams = {
        page: currentPage,
        size: pageSize,
        fiscalYear,
        month: (fromDate || toDate) ? 'ALL' : month,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        mpds: mpdParam,
        shift: viewMode === 'shift' ? selectedShift : 'ALL',
        search: searchTerm.trim(),
        viewMode,
        sortBy,
        sortDir
      };

      const res: SummaryReportResponse<SummaryReportRow> = await fetchMonthlySummaryReportApi<SummaryReportRow>(params);
      setRecords(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
      setGrandTotal(res.grandTotal || {});
    } catch (err: any) {
      console.error('Failed to load summary report:', err);
      toast.error('Failed to load summary report', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, fiscalYear, month, fromDate, toDate, selectedMpds, selectedShift, searchTerm, viewMode, sortBy, sortDir]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Sort handler ──
  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(0);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50 ml-1 inline-block" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-primary ml-1 inline-block" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary ml-1 inline-block" />;
  };

  // ── Export handlers ──
  const handleExport = (format: 'csv' | 'excel' | 'print') => {
    if (format === 'print') {
      window.print();
      return;
    }

    if (!records || records.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = [
      'Date/Period',
      'Shift',
      'Petrol MS Qty (L)',
      'Petrol MS Amt (₹)',
      'Diesel HSD Qty (L)',
      'Diesel HSD Amt (₹)',
      'Total Sales (₹)',
      'PhonePe (₹)',
      'BPCL ALP (₹)',
      'HDFC Swap (₹)',
      'Total Online (₹)',
      'Credit Sales (₹)',
      'Own Consumption (₹)',
      'Net Cash Sales (₹)',
      'Emp. Deposit (₹)',
      'Final Challan (₹)',
      'Difference (₹)'
    ];

    const rows = records.map(r => [
      `"${formatDateDisplay(r.date, r)}"`,
      `"${r.shift}"`,
      r.petrolQty,
      r.petrolAmount,
      r.dieselQty,
      r.dieselAmount,
      r.totalSales,
      r.phonePe,
      r.bpclAlp,
      r.hdfcSwap,
      r.totalOnline,
      r.creditSales,
      r.totalConsumption,
      r.netCashSales,
      r.employeeDeposit,
      r.finalChallan,
      r.difference
    ]);

    if (grandTotal) {
      rows.push([
        '"GRAND TOTAL"',
        '""',
        grandTotal.petrolQty || 0,
        grandTotal.petrolAmount || 0,
        grandTotal.dieselQty || 0,
        grandTotal.dieselAmount || 0,
        grandTotal.totalSales || 0,
        grandTotal.phonePe || 0,
        grandTotal.bpclAlp || 0,
        grandTotal.hdfcSwap || 0,
        grandTotal.totalOnline || 0,
        grandTotal.creditSales || 0,
        grandTotal.totalConsumption || 0,
        grandTotal.netCashSales || 0,
        grandTotal.employeeDeposit || 0,
        grandTotal.finalChallan || 0,
        grandTotal.difference || 0
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Summary_Report_${fiscalYear}_${viewMode}.${format === 'excel' ? 'csv' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${records.length} records successfully!`);
  };

  return (
    <div className="p-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">Monthly &amp; Yearly Summary Report</h1>
          <p className="text-muted-foreground">
            Multi-period summary of fuel sales, digital collections, credit, and cash reconciliation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer text-xs">
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer text-xs">
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Stats Cards (Credit Sales Style) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Sales */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.totalSales)}
            </p>
            <p className="text-xs text-muted-foreground">Total Gross Sales</p>
          </div>
        </div>

        {/* Total Litres */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatLitres((grandTotal.petrolQty || 0) + (grandTotal.dieselQty || 0))}
            </p>
            <p className="text-xs text-muted-foreground">Fuel Dispensed (MS + HSD)</p>
          </div>
        </div>

        {/* Total Online Collections */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.totalOnline)}
            </p>
            <p className="text-xs text-muted-foreground">Digital / Online Collections</p>
          </div>
        </div>

        {/* Net Cash & Challan */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-500">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.netCashSales)}
            </p>
            <p className="text-xs text-muted-foreground">Net Cash Collected</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar (Credit Sales Style) ── */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search date, shift, amount..."
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>

          {/* View Mode Filter */}
          <div className="w-36">
            <Select value={viewMode} onValueChange={(v: any) => { setViewMode(v); setCurrentPage(0); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shift">Shift View</SelectItem>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="year">Year-wise View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Financial Year Filter */}
          <div className="w-36">
            <Select value={fiscalYear} onValueChange={v => { setFiscalYear(v); setCurrentPage(0); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Financial Year" />
              </SelectTrigger>
              <SelectContent>
                {FISCAL_YEARS.map(fy => (
                  <SelectItem key={fy} value={fy}>FY {fy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          {viewMode !== 'year' && (
            <div className="w-40">
              <Select value={month} onValueChange={v => { setMonth(v); setCurrentPage(0); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* MPD Multi-select Checkbox Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMpdDropdownOpen(prev => !prev)}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm flex items-center justify-between gap-2 min-w-[145px] hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Gauge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{getMpdButtonLabel()}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            {isMpdDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMpdDropdownOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-48 rounded-md border border-border bg-popover p-2 shadow-lg bg-background space-y-1">
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-muted cursor-pointer text-xs font-semibold border-b border-border/60 pb-2 mb-1 select-none">
                    <input
                      type="checkbox"
                      checked={selectedMpds.length === ALL_MPD_OPTIONS.length}
                      onChange={handleToggleAllMpds}
                      className="w-3.5 h-3.5 rounded border-border cursor-pointer text-primary focus:ring-primary/40"
                    />
                    <span>All MPDs (1 - 4)</span>
                  </label>

                  {/* Individual MPD Checkboxes */}
                  {ALL_MPD_OPTIONS.map((mpd) => (
                    <label
                      key={mpd.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-muted cursor-pointer text-xs text-foreground select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMpds.includes(mpd.id)}
                        onChange={() => handleToggleMpd(mpd.id)}
                        className="w-3.5 h-3.5 rounded border-border cursor-pointer text-primary focus:ring-primary/40"
                      />
                      <span>{mpd.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Date Range: From */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setCurrentPage(0); }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Date Range: To */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setCurrentPage(0); }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* ── Main Table (Credit Sales Style) ── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading summary report records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Receipt className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No summary records found</p>
              <p className="text-xs">
                Try adjusting your financial year, month, or clearing search filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="w-14 text-left p-3.5 font-medium text-muted-foreground">S.No</th>
                  <th 
                    className="text-left p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {viewMode === 'year' ? 'Month / Period' : 'Date'}
                      <SortIcon field="date" />
                    </div>
                  </th>

                  {viewMode !== 'year' && (
                    <th 
                      className="text-left p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                      onClick={() => handleSortToggle('shift')}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Shift
                        <SortIcon field="shift" />
                      </div>
                    </th>
                  )}

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('petrolQty')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      MS Petrol (L)
                      <SortIcon field="petrolQty" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('petrolAmount')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      MS Amt (₹)
                      <SortIcon field="petrolAmount" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('dieselQty')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      HSD Diesel (L)
                      <SortIcon field="dieselQty" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('dieselAmount')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      HSD Amt (₹)
                      <SortIcon field="dieselAmount" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-bold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('totalSales')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Total Sales (₹)
                      <SortIcon field="totalSales" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('totalOnline')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Online (₹)
                      <SortIcon field="totalOnline" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('creditSales')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Credit (₹)
                      <SortIcon field="creditSales" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('totalConsumption')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Own Use (₹)
                      <SortIcon field="totalConsumption" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('netCashSales')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Net Cash (₹)
                      <SortIcon field="netCashSales" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('finalChallan')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Challan (₹)
                      <SortIcon field="finalChallan" />
                    </div>
                  </th>

                  <th 
                    className="text-right p-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSortToggle('difference')}
                  >
                    <div className="flex items-center gap-1.5 justify-end">
                      Diff (₹)
                      <SortIcon field="difference" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 text-muted-foreground font-mono text-xs">
                      {currentPage * pageSize + index + 1}
                    </td>
                    <td className="p-3.5 font-medium whitespace-nowrap">
                      {formatDateDisplay(record.date, record)}
                    </td>
                    {viewMode !== 'year' && (
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge 
                          variant="outline"
                          className={
                            record.shift === 'Day'
                              ? 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                              : record.shift === 'Night'
                              ? 'border-indigo-500/30 text-indigo-600 bg-indigo-500/10'
                              : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          }
                        >
                          {record.shift}
                        </Badge>
                      </td>
                    )}
                    <td className="p-3.5 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatLitres(record.petrolQty)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {formatCurrency(record.petrolAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatLitres(record.dieselQty)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {formatCurrency(record.dieselAmount)}
                    </td>
                    <td className="p-3.5 text-right font-bold text-foreground font-mono whitespace-nowrap">
                      {formatCurrency(record.totalSales)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {formatCurrency(record.totalOnline)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {formatCurrency(record.creditSales)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {formatCurrency(record.totalConsumption)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs font-semibold whitespace-nowrap">
                      {formatCurrency(record.netCashSales)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {formatCurrency(record.finalChallan)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs whitespace-nowrap">
                      <span className={Math.abs(record.difference || 0) < 1 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-semibold'}>
                        {formatCurrency(record.difference)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t border-border text-xs font-medium">
                <tr>
                  <td colSpan={viewMode === 'year' ? 2 : 3} className="p-3.5 text-left font-semibold">
                    Page Total ({records.length} records)
                  </td>
                  <td className="p-3.5 text-right font-mono text-muted-foreground">
                    {formatLitres(records.reduce((s, r) => s + (r.petrolQty || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.petrolAmount || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono text-muted-foreground">
                    {formatLitres(records.reduce((s, r) => s + (r.dieselQty || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.dieselAmount || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-foreground">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalSales || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalOnline || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.creditSales || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalConsumption || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold">
                    {formatCurrency(records.reduce((s, r) => s + (r.netCashSales || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.finalChallan || 0), 0))}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    <span className={Math.abs(records.reduce((s, r) => s + (r.difference || 0), 0)) < 1 ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatCurrency(records.reduce((s, r) => s + (r.difference || 0), 0))}
                    </span>
                  </td>
                </tr>
                {grandTotal && (
                  <tr className="bg-muted/50 border-t border-border font-bold">
                    <td colSpan={viewMode === 'year' ? 2 : 3} className="p-3.5 text-left font-bold text-foreground">
                      Overall Grand Total ({totalElements} {viewMode === 'year' ? 'Months' : 'Shifts'})
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-600">
                      {formatLitres(grandTotal.petrolQty)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(grandTotal.petrolAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-blue-600">
                      {formatLitres(grandTotal.dieselQty)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(grandTotal.dieselAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-foreground text-sm">
                      {formatCurrency(grandTotal.totalSales)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(grandTotal.totalOnline)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(grandTotal.creditSales)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(grandTotal.totalConsumption)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-teal-600">
                      {formatCurrency(grandTotal.netCashSales)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      {formatCurrency(grandTotal.finalChallan)}
                    </td>
                    <td className="p-3.5 text-right font-mono">
                      <span className={Math.abs(grandTotal.difference || 0) < 1 ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatCurrency(grandTotal.difference)}
                      </span>
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Server-Side Pagination (Credit Sales Style) ── */}
        {totalElements > 0 && (
          <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
                  className="h-8 rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={31}>31</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0 || loading}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm font-medium px-2">
                  Page {currentPage + 1} of {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1 || loading}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}