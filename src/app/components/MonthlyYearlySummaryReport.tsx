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
  SummaryReportResponse,
  SummaryReportColumnsMeta,
  SummaryReportProductCol,
  SummaryReportPaymentCol,
  SummaryReportVehicleCol
} from '../services/api';
import { toast } from 'sonner';

export interface SummaryReportRow {
  id: string;
  rowNumber?: number;
  date: string;
  monthName?: string;
  period?: string;
  shift: string;
  totalSales: number;
  totalOnline: number;
  creditSales: number;
  totalConsumption: number;
  netCashSales: number;
  employeeDeposit: number;
  finalChallan: number;
  difference: number;
  [key: string]: any;
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

const DEFAULT_COLUMNS: SummaryReportColumnsMeta = {
  products: [
    { id: 1, name: 'Petrol E20', key: 'petrolE20', qtyKey: 'petrolE20Qty', amountKey: 'petrolE20Amount', unit: 'Litre' },
    { id: 2, name: 'Diesel', key: 'diesel', qtyKey: 'dieselQty', amountKey: 'dieselAmount', unit: 'Litre' }
  ],
  payments: [
    { id: 'phonePe', name: 'Phone Pe', key: 'phonePe' },
    { id: 'bpclAlp', name: 'BPCL/ALP', key: 'bpclAlp' },
    { id: 'ufil', name: 'UFIL', key: 'ufil' },
    { id: 'hdfcSwap', name: 'HDFC Swap', key: 'hdfcSwap' },
    { id: 'fino', name: 'Fino', key: 'fino' },
    { id: 'rtgs', name: 'RTGS', key: 'rtgs' }
  ],
  vehicles: [
    { id: 1, name: 'Tanker', key: 'tanker', make: 'Ashok Leyland', vehicleNumber: 'Tanker' },
    { id: 2, name: 'D.G.Set', key: 'dgset', make: 'Kirloskar', vehicleNumber: 'D.G.Set' },
    { id: 3, name: 'Seltos', key: 'seltos', make: 'Kia', vehicleNumber: 'Seltos' },
    { id: 4, name: 'Scorpio', key: 'scorpio', make: 'Mahindra', vehicleNumber: 'Scorpio' },
    { id: 5, name: 'Nios', key: 'nios', make: 'Hyundai', vehicleNumber: 'Nios' },
    { id: 6, name: 'Legender', key: 'legender', make: 'Toyota', vehicleNumber: 'Legender' }
  ]
};

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

  // ── Dynamic Metadata & Data State ──
  const [columnsMeta, setColumnsMeta] = useState<SummaryReportColumnsMeta>(DEFAULT_COLUMNS);
  const [records, setRecords] = useState<SummaryReportRow[]>([]);
  const [grandTotal, setGrandTotal] = useState<Partial<SummaryReportRow>>({});
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // Helpers
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    if (amount < 0) {
      const pos = Math.abs(amount);
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(pos);
      return `(${formatted})`;
    }
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
      if (res.columns) {
        setColumnsMeta(res.columns);
      }
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

  // ── Enhanced Export handlers (Complete Filtered Dataset + ASC Oldest First + Month Table Separation + Excel Design) ──
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      toast.info(`Fetching complete dataset for export...`);

      const mpdParam = (selectedMpds.length === 0 || selectedMpds.length === ALL_MPD_OPTIONS.length)
        ? 'ALL'
        : selectedMpds.join(',');

      const queryParams: SummaryReportQueryParams = {
        page: 0,
        size: 5000, // Fetch all records matching the filter criteria
        fiscalYear,
        month: (fromDate || toDate) ? 'ALL' : month,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        mpds: mpdParam,
        shift: viewMode === 'shift' ? selectedShift : 'ALL',
        search: searchTerm.trim(),
        viewMode,
        sortBy: 'date',
        sortDir: 'asc' // Oldest created data on top (ASC)
      };

      const res = await fetchMonthlySummaryReportApi<SummaryReportRow>(queryParams);
      const exportRecords: SummaryReportRow[] = res.content || [];
      const exportGrand: Partial<SummaryReportRow> = res.grandTotal || grandTotal || {};

      if (exportRecords.length === 0) {
        toast.warning('No records found to export for the selected filter');
        return;
      }

      // Strict Chronological Sort (ASC - Oldest to Newest)
      exportRecords.sort((a, b) => {
        const d1 = a.date || '';
        const d2 = b.date || '';
        if (d1 !== d2) return d1.localeCompare(d2);
        const s1 = (a.shift || '').toLowerCase();
        const s2 = (b.shift || '').toLowerCase();
        if (s1 === 'day' && s2 !== 'day') return -1;
        if (s1 !== 'day' && s2 === 'day') return 1;
        return s1.localeCompare(s2);
      });

      const products = res.columns?.products || columnsMeta.products || [];
      const payments = res.columns?.payments || columnsMeta.payments || [];
      const vehicles = res.columns?.vehicles || columnsMeta.vehicles || [];

      // Build header definitions with colors matching Master FY 25-26.xlsx
      const headerCols: { label: string; bg: string; color: string; width: number }[] = [];
      headerCols.push({ label: 'Date', bg: '#D9D9D9', color: '#000000', width: 95 });
      headerCols.push({ label: 'Shift', bg: '#D9D9D9', color: '#000000', width: 70 });

      products.forEach(p => {
        headerCols.push({ label: `${p.name} Qty.`, bg: '#F8CBAD', color: '#000000', width: 95 });
        headerCols.push({ label: 'Amount', bg: '#F8CBAD', color: '#000000', width: 105 });
      });

      headerCols.push({ label: 'Total Sales', bg: '#FFFF00', color: '#000000', width: 115 });

      payments.forEach(pay => {
        headerCols.push({ label: pay.name, bg: '#BDD7EE', color: '#000000', width: 95 });
      });

      headerCols.push({ label: 'Total Online', bg: '#9BC2E6', color: '#000000', width: 110 });
      headerCols.push({ label: 'Credit Sales', bg: '#D5A6BD', color: '#000000', width: 100 });

      vehicles.forEach(v => {
        headerCols.push({ label: v.name, bg: '#FFF2CC', color: '#000000', width: 90 });
      });
      headerCols.push({ label: 'Total Consumption', bg: '#FFE699', color: '#000000', width: 115 });
      headerCols.push({ label: 'Net Cash Sales', bg: '#C6E0B4', color: '#000000', width: 115 });
      headerCols.push({ label: 'Employee Deposit', bg: '#E2EFDA', color: '#000000', width: 115 });
      headerCols.push({ label: 'Final Challan', bg: '#E2EFDA', color: '#000000', width: 95 });
      headerCols.push({ label: 'Difference', bg: '#F8CBAD', color: '#000000', width: 95 });

      const totalColSpan = headerCols.length;

      const formatCellNum = (v: any) => {
        if (v === undefined || v === null || v === '' || Number(v) === 0 || isNaN(Number(v))) {
          return '-';
        }
        const num = Number(v);
        if (num < 0) {
          return `(${Math.abs(num).toFixed(2)})`;
        }
        return num.toFixed(2);
      };

      const formatRawNum = (v: any) => {
        if (v === undefined || v === null || isNaN(Number(v))) return 0;
        return Number(v);
      };

      const getMonthLabelFromDate = (dStr: string) => {
        if (!dStr) return '';
        const parts = dStr.split('-');
        if (parts.length >= 2) {
          const yr = parts[0];
          const m = parts[1];
          const monthNamesMap: Record<string, string> = {
            '01': 'January', '02': 'February', '03': 'March', '04': 'April',
            '05': 'May', '06': 'June', '07': 'July', '08': 'August',
            '09': 'September', '10': 'October', '11': 'November', '12': 'December'
          };
          const mName = monthNamesMap[m] || m;
          return `${mName} ${yr}`;
        }
        return dStr;
      };

      // Group records into Month Groups
      const monthGroups: { monthKey: string; monthLabel: string; rows: SummaryReportRow[] }[] = [];
      if (viewMode === 'year') {
        monthGroups.push({
          monthKey: 'YEAR_SUMMARY',
          monthLabel: `Financial Year ${fiscalYear} - Monthly Summary`,
          rows: exportRecords
        });
      } else {
        const groupMap = new Map<string, SummaryReportRow[]>();
        exportRecords.forEach(r => {
          const mKey = (r.date && r.date.length >= 7) ? r.date.substring(0, 7) : 'Other';
          if (!groupMap.has(mKey)) groupMap.set(mKey, []);
          groupMap.get(mKey)!.push(r);
        });

        // Ensure chronological order of month keys
        const sortedMonthKeys = Array.from(groupMap.keys()).sort();
        sortedMonthKeys.forEach(mKey => {
          const groupRows = groupMap.get(mKey)!;
          const mLabel = getMonthLabelFromDate(mKey);
          monthGroups.push({
            monthKey: mKey,
            monthLabel: mLabel,
            rows: groupRows
          });
        });
      }

      if (format === 'excel') {
        let excelBodyHtml = '';

        monthGroups.forEach((grp, grpIdx) => {
          // 1. Month Header Banner (Bright Yellow)
          excelBodyHtml += `
            <tr style="height: 28px;">
              <td colspan="${totalColSpan}" style="background-color: #FFFF00; color: #000000; font-weight: bold; font-size: 11pt; padding: 6px 10px; border: 1.5pt solid #000000; text-align: left;">
                Month: ${grp.monthLabel}
              </td>
            </tr>
          `;

          // 2. 26-Column Header Row with distinct group colors matching Excel Sheet
          excelBodyHtml += `
            <tr style="height: 25px;">
              ${headerCols.map(c => `<th style="background-color: ${c.bg}; color: ${c.color}; font-weight: bold; border: 0.5pt solid #7F7F7F; padding: 4px 6px; text-align: center; font-size: 9pt; width: ${c.width}px;">${c.label}</th>`).join('')}
            </tr>
          `;

          // 3. Shift/Day Data Rows with per-group odd/even alternating colors (Row 1 colored, Row 2 clean #FFFFFF)
          const monthSubtotal: Record<string, number> = {};

          grp.rows.forEach((r, rIdx) => {
            const rowCells: string[] = [];
            // 1st row (rIdx % 2 === 0) applies the light color of each column group
            // 2nd row (rIdx % 2 === 1) is clean non-colored pure white (#FFFFFF)
            const isColored = rIdx % 2 === 0;

            const dateBg = isColored ? '#F2F2F2' : '#FFFFFF';
            const fuelBg = isColored ? '#FCE4D6' : '#FFFFFF';
            const salesBg = isColored ? '#FFF2CC' : '#FFFFFF';
            const onlineBg = isColored ? '#DDEBF7' : '#FFFFFF';
            const totOnlineBg = isColored ? '#BDD7EE' : '#FFFFFF';
            const creditBg = isColored ? '#EAD1DC' : '#FFFFFF';
            const fleetBg = isColored ? '#FFF2CC' : '#FFFFFF';
            const totConsBg = isColored ? '#FFE699' : '#FFFFFF';
            const netCashBg = isColored ? '#C6E0B4' : '#FFFFFF';
            const depositBg = isColored ? '#E2EFDA' : '#FFFFFF';
            const diffBg = isColored ? '#FCE4D6' : '#FFFFFF';

            // Date & Shift
            rowCells.push(`<td style="background-color: ${dateBg}; border: 0.5pt solid #D9D9D9; text-align: center; mso-number-format:'\\@';">${formatDateDisplay(r.date, r)}</td>`);
            rowCells.push(`<td style="background-color: ${dateBg}; border: 0.5pt solid #D9D9D9; text-align: center;">${r.shift || ''}</td>`);

            // Products (Petrol / Diesel Qty & Amount)
            products.forEach(p => {
              const qVal = r[p.qtyKey];
              const aVal = r[p.amountKey];
              monthSubtotal[p.qtyKey] = (monthSubtotal[p.qtyKey] || 0) + formatRawNum(qVal);
              monthSubtotal[p.amountKey] = (monthSubtotal[p.amountKey] || 0) + formatRawNum(aVal);

              rowCells.push(`<td class="${formatCellNum(qVal) === '-' ? 'center' : 'num'}" style="background-color: ${fuelBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(qVal)}</td>`);
              rowCells.push(`<td class="${formatCellNum(aVal) === '-' ? 'center' : 'num'}" style="background-color: ${fuelBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(aVal)}</td>`);
            });

            // Total Sales
            monthSubtotal['totalSales'] = (monthSubtotal['totalSales'] || 0) + formatRawNum(r.totalSales);
            rowCells.push(`<td class="${formatCellNum(r.totalSales) === '-' ? 'center' : 'num'} font-bold" style="background-color: ${salesBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.totalSales)}</td>`);

            // Payments
            payments.forEach(pay => {
              const pVal = r[pay.key];
              monthSubtotal[pay.key] = (monthSubtotal[pay.key] || 0) + formatRawNum(pVal);
              rowCells.push(`<td class="${formatCellNum(pVal) === '-' ? 'center' : 'num'}" style="background-color: ${onlineBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(pVal)}</td>`);
            });

            // Total Online & Credit Sales
            monthSubtotal['totalOnline'] = (monthSubtotal['totalOnline'] || 0) + formatRawNum(r.totalOnline);
            monthSubtotal['creditSales'] = (monthSubtotal['creditSales'] || 0) + formatRawNum(r.creditSales);
            rowCells.push(`<td class="${formatCellNum(r.totalOnline) === '-' ? 'center' : 'num'} font-bold" style="background-color: ${totOnlineBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.totalOnline)}</td>`);
            rowCells.push(`<td class="${formatCellNum(r.creditSales) === '-' ? 'center' : 'num'}" style="background-color: ${creditBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.creditSales)}</td>`);

            // Vehicles
            vehicles.forEach(v => {
              const vVal = r[v.key];
              monthSubtotal[v.key] = (monthSubtotal[v.key] || 0) + formatRawNum(vVal);
              rowCells.push(`<td class="${formatCellNum(vVal) === '-' ? 'center' : 'num'}" style="background-color: ${fleetBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(vVal)}</td>`);
            });

            // Total Consumption, Net Cash, Deposits, Challan, Diff
            monthSubtotal['totalConsumption'] = (monthSubtotal['totalConsumption'] || 0) + formatRawNum(r.totalConsumption);
            monthSubtotal['netCashSales'] = (monthSubtotal['netCashSales'] || 0) + formatRawNum(r.netCashSales);
            monthSubtotal['employeeDeposit'] = (monthSubtotal['employeeDeposit'] || 0) + formatRawNum(r.employeeDeposit);
            monthSubtotal['finalChallan'] = (monthSubtotal['finalChallan'] || 0) + formatRawNum(r.finalChallan);
            monthSubtotal['difference'] = (monthSubtotal['difference'] || 0) + formatRawNum(r.difference);

            rowCells.push(`<td class="${formatCellNum(r.totalConsumption) === '-' ? 'center' : 'num'} font-bold" style="background-color: ${totConsBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.totalConsumption)}</td>`);
            rowCells.push(`<td class="${formatCellNum(r.netCashSales) === '-' ? 'center' : 'num'} font-bold" style="background-color: ${netCashBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.netCashSales)}</td>`);
            rowCells.push(`<td class="${formatCellNum(r.employeeDeposit) === '-' ? 'center' : 'num'}" style="background-color: ${depositBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.employeeDeposit)}</td>`);
            rowCells.push(`<td class="${formatCellNum(r.finalChallan) === '-' ? 'center' : 'num'}" style="background-color: ${depositBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.finalChallan)}</td>`);
            rowCells.push(`<td class="${formatCellNum(r.difference) === '-' ? 'center' : 'num'} font-bold" style="background-color: ${diffBg}; border: 0.5pt solid #D9D9D9;">${formatCellNum(r.difference)}</td>`);

            excelBodyHtml += `<tr>${rowCells.join('')}</tr>`;
          });

          // 4. Month Subtotal Row with matching group colors
          if (viewMode !== 'year') {
            const subCells: string[] = [
              `<td colspan="2" style="background-color: #D9D9D9; font-weight: bold; border: 1pt solid #7F7F7F; text-align: center;">Month Total (${grp.monthLabel})</td>`
            ];

            products.forEach(p => {
              subCells.push(`<td class="num font-bold" style="background-color: #F8CBAD; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal[p.qtyKey])}</td>`);
              subCells.push(`<td class="num font-bold" style="background-color: #F8CBAD; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal[p.amountKey])}</td>`);
            });

            subCells.push(`<td class="num font-bold" style="background-color: #FFFF00; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['totalSales'])}</td>`);

            payments.forEach(pay => {
              subCells.push(`<td class="num font-bold" style="background-color: #BDD7EE; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal[pay.key])}</td>`);
            });

            subCells.push(`<td class="num font-bold" style="background-color: #9BC2E6; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['totalOnline'])}</td>`);
            subCells.push(`<td class="num font-bold" style="background-color: #D5A6BD; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['creditSales'])}</td>`);

            vehicles.forEach(v => {
              subCells.push(`<td class="num font-bold" style="background-color: #FFF2CC; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal[v.key])}</td>`);
            });

            subCells.push(`<td class="num font-bold" style="background-color: #FFE699; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['totalConsumption'])}</td>`);
            subCells.push(`<td class="num font-bold" style="background-color: #C6E0B4; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['netCashSales'])}</td>`);
            subCells.push(`<td class="num font-bold" style="background-color: #E2EFDA; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['employeeDeposit'])}</td>`);
            subCells.push(`<td class="num font-bold" style="background-color: #E2EFDA; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['finalChallan'])}</td>`);
            subCells.push(`<td class="num font-bold" style="background-color: #F8CBAD; border: 1pt solid #7F7F7F;">${formatCellNum(monthSubtotal['difference'])}</td>`);

            excelBodyHtml += `<tr style="height: 25px;">${subCells.join('')}</tr>`;
          }

          // 5. Blank Separator Row (Gap between months as in Excel)
          if (grpIdx < monthGroups.length - 1) {
            excelBodyHtml += `
              <tr style="height: 18px; border: none; background-color: #FFFFFF;">
                <td colspan="${totalColSpan}" style="border: none; background-color: #FFFFFF; height: 18px;">&nbsp;</td>
              </tr>
            `;
          }
        });

        // 6. Overall Grand Total Row with full Excel palette
        if (exportGrand) {
          const grandCells: string[] = [
            `<td colspan="2" style="background-color: #D9D9D9; font-weight: bold; font-size: 10pt; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; text-align: center; color: #000000;">GRAND TOTAL (FY ${fiscalYear})</td>`
          ];

          products.forEach(p => {
            grandCells.push(`<td class="num font-bold" style="background-color: #F8CBAD; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand[p.qtyKey] ?? exportGrand.petrolQty)}</td>`);
            grandCells.push(`<td class="num font-bold" style="background-color: #F8CBAD; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand[p.amountKey] ?? exportGrand.petrolAmount)}</td>`);
          });

          grandCells.push(`<td class="num font-bold" style="background-color: #FFFF00; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.totalSales)}</td>`);

          payments.forEach(pay => {
            grandCells.push(`<td class="num font-bold" style="background-color: #BDD7EE; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand[pay.key])}</td>`);
          });

          grandCells.push(`<td class="num font-bold" style="background-color: #9BC2E6; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.totalOnline)}</td>`);
          grandCells.push(`<td class="num font-bold" style="background-color: #D5A6BD; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.creditSales)}</td>`);

          vehicles.forEach(v => {
            grandCells.push(`<td class="num font-bold" style="background-color: #FFF2CC; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand[v.key])}</td>`);
          });

          grandCells.push(`<td class="num font-bold" style="background-color: #FFE699; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.totalConsumption)}</td>`);
          grandCells.push(`<td class="num font-bold" style="background-color: #C6E0B4; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.netCashSales)}</td>`);
          grandCells.push(`<td class="num font-bold" style="background-color: #E2EFDA; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.employeeDeposit)}</td>`);
          grandCells.push(`<td class="num font-bold" style="background-color: #E2EFDA; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.finalChallan)}</td>`);
          grandCells.push(`<td class="num font-bold" style="background-color: #F8CBAD; border-top: 1.5pt solid #000000; border-bottom: 2pt double #000000; color: #000000;">${formatCellNum(exportGrand.difference)}</td>`);

          excelBodyHtml += `
            <tr style="height: 14px; border: none; background-color: #FFFFFF;"><td colspan="${totalColSpan}" style="border: none; height: 14px;">&nbsp;</td></tr>
            <tr style="height: 28px;">${grandCells.join('')}</tr>
          `;
        }

        const excelHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <!--[if gte mso 9]><xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Summary</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                      <x:FreezePanes/>
                      <x:FrozenNoSplit/>
                      <x:SplitRow>2</x:SplitRow>
                      <x:TopRowBottomPane>2</x:TopRowBottomPane>
                      <x:SplitColumn>2</x:SplitColumn>
                      <x:LeftColumnRightPane>2</x:LeftColumnRightPane>
                      <x:ActivePane>0</x:ActivePane>
                    </x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml><![endif]-->
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
            <style>
              table { border-collapse: collapse; font-family: Arial, Calibri, sans-serif; font-size: 9pt; }
              th { border: 0.5pt solid #7F7F7F; padding: 4px 6px; font-weight: bold; text-align: center; }
              td { border: 0.5pt solid #D9D9D9; padding: 4px 6px; }
              .num { mso-number-format:"\\_\\(\\#\\,\\#\\#0\\.00\\_\\)\\;\\(\\#\\,\\#\\#0\\.00\\)\\;\\_\\(\"-\"??\\_\\)\\;\\_\\(\\@\\_\\)"; text-align: right; }
              .center { text-align: center; }
              .font-bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <table>
              <tbody>
                ${excelBodyHtml}
              </tbody>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Summary_Report_${fiscalYear}_${viewMode}_All.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported all ${exportRecords.length} filtered records to Excel successfully!`);
        return;
      }

      // ── CSV Export ──
      const csvLines: string[] = [];
      const csvHeaderLine = headerCols.map(h => `"${h.label}"`).join(',');

      monthGroups.forEach(grp => {
        csvLines.push(`"Month: ${grp.monthLabel}"`);
        csvLines.push(csvHeaderLine);

        const monthSubtotal: Record<string, number> = {};

        grp.rows.forEach(r => {
          const row: (string | number)[] = [
            `"${formatDateDisplay(r.date, r)}"`,
            `"${r.shift || ''}"`
          ];

          products.forEach(p => {
            const q = formatRawNum(r[p.qtyKey]);
            const a = formatRawNum(r[p.amountKey]);
            monthSubtotal[p.qtyKey] = (monthSubtotal[p.qtyKey] || 0) + q;
            monthSubtotal[p.amountKey] = (monthSubtotal[p.amountKey] || 0) + a;
            row.push(q);
            row.push(a);
          });

          const ts = formatRawNum(r.totalSales);
          monthSubtotal['totalSales'] = (monthSubtotal['totalSales'] || 0) + ts;
          row.push(ts);

          payments.forEach(pay => {
            const py = formatRawNum(r[pay.key]);
            monthSubtotal[pay.key] = (monthSubtotal[pay.key] || 0) + py;
            row.push(py);
          });

          const onl = formatRawNum(r.totalOnline);
          const crd = formatRawNum(r.creditSales);
          monthSubtotal['totalOnline'] = (monthSubtotal['totalOnline'] || 0) + onl;
          monthSubtotal['creditSales'] = (monthSubtotal['creditSales'] || 0) + crd;
          row.push(onl);
          row.push(crd);

          vehicles.forEach(v => {
            const vh = formatRawNum(r[v.key]);
            monthSubtotal[v.key] = (monthSubtotal[v.key] || 0) + vh;
            row.push(vh);
          });

          const tc = formatRawNum(r.totalConsumption);
          const nc = formatRawNum(r.netCashSales);
          const ed = formatRawNum(r.employeeDeposit);
          const fc = formatRawNum(r.finalChallan);
          const df = formatRawNum(r.difference);

          monthSubtotal['totalConsumption'] = (monthSubtotal['totalConsumption'] || 0) + tc;
          monthSubtotal['netCashSales'] = (monthSubtotal['netCashSales'] || 0) + nc;
          monthSubtotal['employeeDeposit'] = (monthSubtotal['employeeDeposit'] || 0) + ed;
          monthSubtotal['finalChallan'] = (monthSubtotal['finalChallan'] || 0) + fc;
          monthSubtotal['difference'] = (monthSubtotal['difference'] || 0) + df;

          row.push(tc);
          row.push(nc);
          row.push(ed);
          row.push(fc);
          row.push(df);

          csvLines.push(row.join(','));
        });

        if (viewMode !== 'year') {
          const subRow: (string | number)[] = [
            `"Month Total (${grp.monthLabel})"`,
            '""'
          ];
          products.forEach(p => {
            subRow.push(monthSubtotal[p.qtyKey] || 0);
            subRow.push(monthSubtotal[p.amountKey] || 0);
          });
          subRow.push(monthSubtotal['totalSales'] || 0);
          payments.forEach(pay => subRow.push(monthSubtotal[pay.key] || 0));
          subRow.push(monthSubtotal['totalOnline'] || 0);
          subRow.push(monthSubtotal['creditSales'] || 0);
          vehicles.forEach(v => subRow.push(monthSubtotal[v.key] || 0));
          subRow.push(monthSubtotal['totalConsumption'] || 0);
          subRow.push(monthSubtotal['netCashSales'] || 0);
          subRow.push(monthSubtotal['employeeDeposit'] || 0);
          subRow.push(monthSubtotal['finalChallan'] || 0);
          subRow.push(monthSubtotal['difference'] || 0);
          csvLines.push(subRow.join(','));
        }

        csvLines.push(''); // Blank line separator between months
      });

      // Grand Total CSV line
      if (exportGrand) {
        const grandRow: (string | number)[] = [
          `"GRAND TOTAL (FY ${fiscalYear})"`,
          '""'
        ];
        products.forEach(p => {
          grandRow.push(exportGrand[p.qtyKey] ?? exportGrand.petrolQty ?? 0);
          grandRow.push(exportGrand[p.amountKey] ?? exportGrand.petrolAmount ?? 0);
        });
        grandRow.push(exportGrand.totalSales ?? 0);
        payments.forEach(pay => grandRow.push(exportGrand[pay.key] ?? 0));
        grandRow.push(exportGrand.totalOnline ?? 0);
        grandRow.push(exportGrand.creditSales ?? 0);
        vehicles.forEach(v => grandRow.push(exportGrand[v.key] ?? 0));
        grandRow.push(exportGrand.totalConsumption ?? 0);
        grandRow.push(exportGrand.netCashSales ?? 0);
        grandRow.push(exportGrand.employeeDeposit ?? 0);
        grandRow.push(exportGrand.finalChallan ?? 0);
        grandRow.push(exportGrand.difference ?? 0);
        csvLines.push(grandRow.join(','));
      }

      const csvContent = '\uFEFF' + csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Summary_Report_${fiscalYear}_${viewMode}_All.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported all ${exportRecords.length} filtered records to CSV successfully!`);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Export failed', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const petrolProd = columnsMeta.products.find(p => p.name.toLowerCase().includes('petrol')) || columnsMeta.products[0];
  const dieselProd = columnsMeta.products.find(p => p.name.toLowerCase().includes('diesel')) || columnsMeta.products[1];

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-2">Monthly &amp; Yearly Summary Report</h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive fuel station ledger with dynamic products, digital settlements, credit sales, and vehicle own-use consumption
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={exporting} className="h-9 gap-1.5 bg-primary text-primary-foreground">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer text-xs" disabled={exporting}>
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export to CSV (All Filtered)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer text-xs" disabled={exporting}>
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export to Excel (All Filtered)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Stats Cards (Dynamic Master Product Names) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Total Gross Sales */}
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

        {/* 2. Product 1 (e.g. Petrol E20) Sales & Volume */}
        {petrolProd && (
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">
                {formatCurrency(grandTotal[petrolProd.amountKey] ?? grandTotal.petrolAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {petrolProd.name} ({formatLitres(grandTotal[petrolProd.qtyKey] ?? grandTotal.petrolQty)})
              </p>
            </div>
          </div>
        )}

        {/* 3. Product 2 (e.g. Diesel) Sales & Volume */}
        {dieselProd && (
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">
                {formatCurrency(grandTotal[dieselProd.amountKey] ?? grandTotal.dieselAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {dieselProd.name} ({formatLitres(grandTotal[dieselProd.qtyKey] ?? grandTotal.dieselQty)})
              </p>
            </div>
          </div>
        )}

        {/* 4. Digital / Online Collections */}
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

        {/* 5. Credit Sales */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.creditSales)}
            </p>
            <p className="text-xs text-muted-foreground">Credit Sales</p>
          </div>
        </div>

        {/* 6. Own Use */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.totalConsumption)}
            </p>
            <p className="text-xs text-muted-foreground">Own Use Consumption</p>
          </div>
        </div>

        {/* 7. Settlements / Net Cash */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-500">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.netCashSales)}
            </p>
            <p className="text-xs text-muted-foreground">Net Cash Sales</p>
          </div>
        </div>

        {/* 8. Employee Deposits */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(grandTotal.employeeDeposit)}
            </p>
            <p className="text-xs text-muted-foreground">Employee Deposits</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
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
              <Select
                value={month}
                onValueChange={v => {
                  setMonth(v);
                  setFromDate('');
                  setToDate('');
                  setCurrentPage(0);
                }}
              >
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

          {/* Reset Date Range Button */}
          {(fromDate || toDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setFromDate(''); setToDate(''); setCurrentPage(0); }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Dates
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Table (Dynamic Master Headers) ── */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto relative">
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
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="bg-muted/95 backdrop-blur-md">
                  <th className="w-12 text-left p-3 font-medium text-muted-foreground whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border">S.No</th>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border"
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
                      className="text-left p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border"
                      onClick={() => handleSortToggle('shift')}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Shift
                        <SortIcon field="shift" />
                      </div>
                    </th>
                  )}

                  {/* Dynamic Fuel Products from Master Data (e.g. Petrol E20, Diesel) */}
                  {columnsMeta.products.map(prod => (
                    <React.Fragment key={prod.key}>
                      <th
                        className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border"
                        onClick={() => handleSortToggle(prod.qtyKey)}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {prod.name} Qty.
                          <SortIcon field={prod.qtyKey} />
                        </div>
                      </th>
                      <th
                        className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border"
                        onClick={() => handleSortToggle(prod.amountKey)}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          Amount (₹)
                          <SortIcon field={prod.amountKey} />
                        </div>
                      </th>
                    </React.Fragment>
                  ))}

                  {/* Total Sales */}
                  <th
                    className="text-right p-3 font-bold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted backdrop-blur-md border-b border-border"
                    onClick={() => handleSortToggle('totalSales')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Total Sales (₹)
                      <SortIcon field="totalSales" />
                    </div>
                  </th>

                  {/* Dynamic Online Settlements from Master */}
                  {columnsMeta.payments.map(pay => (
                    <th
                      key={pay.key}
                      className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border"
                      onClick={() => handleSortToggle(pay.key)}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        {pay.name}
                        <SortIcon field={pay.key} />
                      </div>
                    </th>
                  ))}
                  <th
                    className="text-right p-3 font-bold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted backdrop-blur-md border-b border-border"
                    onClick={() => handleSortToggle('totalOnline')}
                  >
                    <div className="flex items-center gap-1 justify-end">Total Online<SortIcon field="totalOnline" /></div>
                  </th>

                  {/* Credit Sales */}
                  <th className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border" onClick={() => handleSortToggle('creditSales')}>
                    <div className="flex items-center gap-1 justify-end">Credit Sales<SortIcon field="creditSales" /></div>
                  </th>

                  {/* Dynamic Vehicles from Master Data (Nios, Legender, Seltos, Scorpio, Tanker, D.G.Set) */}
                  {columnsMeta.vehicles.map(veh => (
                    <th
                      key={veh.key}
                      className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border"
                      onClick={() => handleSortToggle(veh.key)}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        {veh.name}
                        <SortIcon field={veh.key} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right p-3 font-bold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted backdrop-blur-md border-b border-border" onClick={() => handleSortToggle('totalConsumption')}>
                    <div className="flex items-center gap-1 justify-end">Total Consumption<SortIcon field="totalConsumption" /></div>
                  </th>

                  {/* Cash Reconciliation */}
                  <th className="text-right p-3 font-bold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-teal-500/20 backdrop-blur-md border-b border-border" onClick={() => handleSortToggle('netCashSales')}>
                    <div className="flex items-center gap-1 justify-end">Net Cash Sales<SortIcon field="netCashSales" /></div>
                  </th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border" onClick={() => handleSortToggle('employeeDeposit')}>
                    <div className="flex items-center gap-1 justify-end">Employee Deposit<SortIcon field="employeeDeposit" /></div>
                  </th>
                  <th className="text-right p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border" onClick={() => handleSortToggle('finalChallan')}>
                    <div className="flex items-center gap-1 justify-end">Final Challan<SortIcon field="finalChallan" /></div>
                  </th>
                  <th className="text-right p-3 font-bold cursor-pointer hover:bg-muted/80 transition-colors select-none whitespace-nowrap bg-muted/95 backdrop-blur-md border-b border-border" onClick={() => handleSortToggle('difference')}>
                    <div className="flex items-center gap-1 justify-end">Difference<SortIcon field="difference" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground font-mono text-xs border-b border-border/50">
                      {currentPage * pageSize + index + 1}
                    </td>
                    <td className="p-3 font-medium whitespace-nowrap border-b border-border/50">
                      {formatDateDisplay(record.date, record)}
                    </td>
                    {viewMode !== 'year' && (
                      <td className="p-3 whitespace-nowrap border-b border-border/50">
                        <Badge
                          variant="outline"
                          className={
                            record.shift === 'Day'
                              ? 'border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs px-1.5 py-0'
                              : record.shift === 'Night'
                                ? 'border-indigo-500/30 text-indigo-600 bg-indigo-500/10 text-xs px-1.5 py-0'
                                : 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs px-1.5 py-0'
                          }
                        >
                          {record.shift}
                        </Badge>
                      </td>
                    )}

                    {/* Dynamic Fuel Products Cells */}
                    {columnsMeta.products.map(prod => (
                      <React.Fragment key={prod.key}>
                        <td className="p-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap border-b border-border/50">
                          {formatLitres(record[prod.qtyKey] ?? (prod.name.toLowerCase().includes('petrol') ? record.petrolQty : record.dieselQty))}
                        </td>
                        <td className="p-3 text-right font-mono text-xs whitespace-nowrap border-b border-border/50">
                          {formatCurrency(record[prod.amountKey] ?? (prod.name.toLowerCase().includes('petrol') ? record.petrolAmount : record.dieselAmount))}
                        </td>
                      </React.Fragment>
                    ))}

                    <td className="p-3 text-right font-bold text-foreground font-mono text-xs whitespace-nowrap bg-muted/20 border-b border-border/50">
                      {formatCurrency(record.totalSales)}
                    </td>

                    {/* Dynamic Payments Cells */}
                    {columnsMeta.payments.map(pay => (
                      <td key={pay.key} className="p-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap border-b border-border/50">
                        {formatCurrency(record[pay.key])}
                      </td>
                    ))}

                    <td className="p-3 text-right font-semibold font-mono text-xs whitespace-nowrap bg-muted/20 border-b border-border/50">
                      {formatCurrency(record.totalOnline)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs whitespace-nowrap border-b border-border/50">
                      {formatCurrency(record.creditSales)}
                    </td>

                    {/* Dynamic Vehicles Cells */}
                    {columnsMeta.vehicles.map(veh => (
                      <td key={veh.key} className="p-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap border-b border-border/50">
                        {formatCurrency(record[veh.key])}
                      </td>
                    ))}

                    <td className="p-3 text-right font-semibold font-mono text-xs whitespace-nowrap bg-muted/20 border-b border-border/50">
                      {formatCurrency(record.totalConsumption)}
                    </td>
                    <td className="p-3 text-right font-bold text-teal-600 font-mono text-xs whitespace-nowrap bg-teal-500/5 border-b border-border/50">
                      {formatCurrency(record.netCashSales)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs whitespace-nowrap border-b border-border/50">
                      {formatCurrency(record.employeeDeposit)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs whitespace-nowrap border-b border-border/50">
                      {formatCurrency(record.finalChallan)}
                    </td>
                    <td className="p-3 text-right font-mono text-xs whitespace-nowrap border-b border-border/50">
                      <span className={Math.abs(record.difference || 0) < 1 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-semibold'}>
                        {formatCurrency(record.difference)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-md border-t-2 border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] text-xs font-medium">
                {/* Page Total Row */}
                <tr>
                  <td colSpan={viewMode === 'year' ? 2 : 3} className="p-3 text-left font-semibold">
                    Page Total ({records.length} records)
                  </td>

                  {columnsMeta.products.map(prod => (
                    <React.Fragment key={prod.key}>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {formatLitres(records.reduce((s, r) => s + (r[prod.qtyKey] || 0), 0))}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(records.reduce((s, r) => s + (r[prod.amountKey] || 0), 0))}
                      </td>
                    </React.Fragment>
                  ))}

                  <td className="p-3 text-right font-mono font-bold text-foreground bg-muted/30">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalSales || 0), 0))}
                  </td>

                  {columnsMeta.payments.map(pay => (
                    <td key={pay.key} className="p-3 text-right font-mono text-muted-foreground">
                      {formatCurrency(records.reduce((s, r) => s + (r[pay.key] || 0), 0))}
                    </td>
                  ))}

                  <td className="p-3 text-right font-mono font-semibold bg-muted/30">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalOnline || 0), 0))}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.creditSales || 0), 0))}
                  </td>

                  {columnsMeta.vehicles.map(veh => (
                    <td key={veh.key} className="p-3 text-right font-mono text-muted-foreground">
                      {formatCurrency(records.reduce((s, r) => s + (r[veh.key] || 0), 0))}
                    </td>
                  ))}

                  <td className="p-3 text-right font-mono font-semibold bg-muted/30">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalConsumption || 0), 0))}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-teal-600 bg-teal-500/5">
                    {formatCurrency(records.reduce((s, r) => s + (r.netCashSales || 0), 0))}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.employeeDeposit || 0), 0))}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + (r.finalChallan || 0), 0))}
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span className={Math.abs(records.reduce((s, r) => s + (r.difference || 0), 0)) < 1 ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatCurrency(records.reduce((s, r) => s + (r.difference || 0), 0))}
                    </span>
                  </td>
                </tr>

                {/* Overall Grand Total Row */}
                {grandTotal && (
                  <tr className="bg-muted/50 border-t border-border font-bold">
                    <td colSpan={viewMode === 'year' ? 2 : 3} className="p-3 text-left font-bold text-foreground">
                      Overall Grand Total ({totalElements} {viewMode === 'year' ? 'Months' : 'Shifts'})
                    </td>

                    {columnsMeta.products.map(prod => (
                      <React.Fragment key={prod.key}>
                        <td className="p-3 text-right font-mono text-emerald-600">
                          {formatLitres(grandTotal[prod.qtyKey] ?? (prod.name.toLowerCase().includes('petrol') ? grandTotal.petrolQty : grandTotal.dieselQty))}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {formatCurrency(grandTotal[prod.amountKey] ?? (prod.name.toLowerCase().includes('petrol') ? grandTotal.petrolAmount : grandTotal.dieselAmount))}
                        </td>
                      </React.Fragment>
                    ))}

                    <td className="p-3 text-right font-mono font-bold text-foreground bg-muted/40">
                      {formatCurrency(grandTotal.totalSales)}
                    </td>

                    {columnsMeta.payments.map(pay => (
                      <td key={pay.key} className="p-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(grandTotal[pay.key])}
                      </td>
                    ))}

                    <td className="p-3 text-right font-mono font-bold bg-muted/40">
                      {formatCurrency(grandTotal.totalOnline)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(grandTotal.creditSales)}
                    </td>

                    {columnsMeta.vehicles.map(veh => (
                      <td key={veh.key} className="p-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(grandTotal[veh.key])}
                      </td>
                    ))}

                    <td className="p-3 text-right font-mono font-bold bg-muted/40">
                      {formatCurrency(grandTotal.totalConsumption)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-teal-600 bg-teal-500/10">
                      {formatCurrency(grandTotal.netCashSales)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(grandTotal.employeeDeposit)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(grandTotal.finalChallan)}
                    </td>
                    <td className="p-3 text-right font-mono">
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

        {/* ── Server-Side Pagination Bar ── */}
        <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{records.length > 0 ? currentPage * pageSize + 1 : 0}</span> to <span className="font-semibold text-foreground">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of <span className="font-semibold text-foreground">{totalElements}</span> entries
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={v => { setPageSize(Number(v)); setCurrentPage(0); }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="31">31</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0 || loading}
              className="h-8 px-3 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>

            <span className="text-xs text-muted-foreground px-2">
              Page <span className="font-semibold text-foreground">{currentPage + 1}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="h-8 px-3 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}