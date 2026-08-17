import React from 'react';
import { CreditSales } from './CreditSales';
import { OwnUsage } from './OwnUsage';
import { CashCollection } from './CashCollection';
import {
  fetchMpdsAll,
  MPD,
  MeterReading,
  saveMeterReadingsBatchApi,
  fetchLatestMeterReading,
  fetchExistingMeterReading,
  fetchMeterReadingsHistory,
  fetchMeterReadingsSummary,
  MeterReadingSummaryDTO,
  fetchShiftsAll,
  ShiftMaster,
  fetchProducts,
  Product,
  formatDateToDMY,
  fetchSettlementsByMpd,
  createSettlementApi,
  updateSettlementApi,
  deleteSettlementApi,
  ShiftSettlementRecord,
  fetchEmployees,
  Employee,
  fetchLatestOrDateRates,
  saveMpdReconciliationApi,
  fetchExistingMpdReconciliation,
  MpdReconciliationRecord,
  MpdReconciliationItem,
  fetchEmployeeAssignments,
  EmployeeAssignment,
  fetchCreditSales,
  fetchOwnUsages,
  fetchCashCollections
} from '../services/api';
import { resolveMpdNameFromList, isStrictMpdMatch } from '../utils/mpdUtils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import {
  Plus, Eye, Edit, Trash2, Check, ChevronDown, ChevronLeft, ChevronRight,
  CreditCard, User, Clock, Package, IndianRupee, Droplet, Car, SlidersHorizontal,
  Layers, Calendar, Fuel, Save, Loader2, History, Download, FileText, Search, RefreshCw, AlertCircle
} from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';

// FuelSaleForm - Shift Sales & Meter Reading Management
const subTabs = ['Meter Reading', 'Credit Sales', 'Own Use', 'Settlements', 'Employee Deposits', 'Summary'];

const getFuelRate = (fuelType: string, rateMaster?: Record<string, number>) => {
  if (!fuelType) return 104.50;

  if (rateMaster && Object.keys(rateMaster).length > 0) {
    // 1. Direct match
    if (rateMaster[fuelType] !== undefined && rateMaster[fuelType] > 0) {
      return rateMaster[fuelType];
    }
    // 2. Case-insensitive / fuzzy key match
    const normType = fuelType.toLowerCase().trim();
    for (const [key, val] of Object.entries(rateMaster)) {
      if (val > 0) {
        const kNorm = key.toLowerCase().trim();
        if (kNorm === normType || normType.includes(kNorm) || kNorm.includes(normType)) {
          return val;
        }
      }
    }
  }

  // Standard default fallback if not configured in rateMaster
  const norm = fuelType.toLowerCase();
  if (norm.includes('diesel') || norm.includes('hsd')) return 89.75;
  if (norm.includes('lpg') || norm.includes('cng') || norm.includes('gas') || norm.includes('auto lpg')) return 65.00;
  return 104.50;
};

const getDefaultOpeningReading = (nozzleName: string, fuelType: string, index: number) => {
  return 0.00;
};

const formatIndianCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export function getActiveShiftNameFromMaster(shifts: ShiftMaster[], now: Date = new Date()): string {
  if (!shifts || shifts.length === 0) return 'Shift 1';

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  for (const shift of shifts) {
    if (!shift.startTime || !shift.endTime) continue;
    const startMin = parseTimeToMinutes(shift.startTime);
    const endMin = parseTimeToMinutes(shift.endTime);

    if (startMin <= endMin) {
      if (currentMinutes >= startMin && currentMinutes < endMin) {
        return shift.shiftName;
      }
    } else {
      if (currentMinutes >= startMin || currentMinutes < endMin) {
        return shift.shiftName;
      }
    }
  }

  return shifts[0]?.shiftName || 'Shift 1';
}

const fuelBadgeStyle = (fuel?: string) => {
  const norm = (fuel || '').toLowerCase();
  if (norm.includes('diesel')) return 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-medium';
  if (norm.includes('lpg')) return 'bg-sky-500/10 text-sky-600 border-sky-500/30 font-medium';
  return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium';
};

function MeterReadingHistoryModal({
  open,
  onOpenChange,
  mpdId,
  mpdName
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mpdId?: string;
  mpdName?: string;
}) {
  const [readings, setReadings] = React.useState<MeterReading[]>([]);
  const [summaryData, setSummaryData] = React.useState<MeterReadingSummaryDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [shiftFilter, setShiftFilter] = React.useState('ALL');
  const [fuelTypeFilter, setFuelTypeFilter] = React.useState('ALL');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalElements, setTotalElements] = React.useState(0);
  const [masterShifts, setMasterShifts] = React.useState<ShiftMaster[]>([]);
  const [fuelProducts, setFuelProducts] = React.useState<Product[]>([]);

  const loadHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      const cleanMpdId = mpdId ? String(mpdId).replaceAll(/\D+/g, '') : undefined;
      const [res, summaryRes] = await Promise.all([
        fetchMeterReadingsHistory({
          page,
          size: 20,
          search: searchTerm || undefined,
          mpdId: cleanMpdId || undefined,
          shiftName: shiftFilter !== 'ALL' ? shiftFilter : undefined,
          fuelType: fuelTypeFilter !== 'ALL' ? fuelTypeFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          sortBy: 'date',
          sortDir: 'desc'
        }),
        fetchMeterReadingsSummary({
          search: searchTerm || undefined,
          mpdId: cleanMpdId || undefined,
          shiftName: shiftFilter !== 'ALL' ? shiftFilter : undefined,
          fuelType: fuelTypeFilter !== 'ALL' ? fuelTypeFilter : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined
        })
      ]);
      setReadings(res.content || []);
      setSummaryData(summaryRes);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err: any) {
      console.error('Failed to load meter reading logs:', err);
      toast.error('Failed to load meter reading history logs');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, mpdId, shiftFilter, fuelTypeFilter, fromDate, toDate]);

  React.useEffect(() => {
    if (open) {
      loadHistory();
      fetchShiftsAll().then(res => {
        if (res && res.length > 0) setMasterShifts(res);
      }).catch(err => console.error('Failed to load master shifts:', err));

      fetchProducts({ size: 1000, category: 'Fuel' }).then(res => {
        if (res && res.content) setFuelProducts(res.content);
      }).catch(err => console.error('Failed to load fuel products:', err));
    }
  }, [open, loadHistory]);

  const downloadCSV = (data: MeterReading[]) => {
    if (!data.length) { toast.warning('No records to export'); return; }
    const headers = ['ID', 'Date', 'Shift', 'MPD', 'Nozzle', 'Fuel Type', 'Opening Reading', 'Closing Reading', 'Testing (L)', 'Sales (L)', 'Rate (₹)', 'Total Amount (₹)'];
    const rows = data.map((r: any) => [
      r.id || '',
      r.date || '',
      `"${r.shiftName || ''}"`,
      `"${r.mpdName || ''}"`,
      `"${r.nozzleName || ''}"`,
      `"${r.fuelType || ''}"`,
      r.openingReading ?? 0,
      r.closingReading ?? 0,
      r.testingQuantity ?? 0,
      r.salesLiters ?? r.salesQuantity ?? 0,
      r.ratePerLitre ?? r.rate ?? 0,
      r.totalAmount ?? r.netAmount ?? ((r.salesLiters || r.salesQuantity || 0) * (r.ratePerLitre || r.rate || 0))
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `meter_readings_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported CSV logs successfully!');
  };

  const downloadXLS = (data: MeterReading[]) => {
    if (!data.length) { toast.warning('No records to export'); return; }
    const headers = ['ID\tDate\tShift\tMPD\tNozzle\tFuel Type\tOpening Reading\tClosing Reading\tTesting (L)\tSales (L)\tRate (₹)\tTotal Amount (₹)'];
    const rows = data.map((r: any) =>
      `${r.id || ''}\t${r.date || ''}\t${r.shiftName || ''}\t${r.mpdName || ''}\t${r.nozzleName || ''}\t${r.fuelType || ''}\t${r.openingReading ?? 0}\t${r.closingReading ?? 0}\t${r.testingQuantity ?? 0}\t${r.salesLiters ?? r.salesQuantity ?? 0}\t${r.ratePerLitre ?? r.rate ?? 0}\t${r.totalAmount ?? r.netAmount ?? ((r.salesLiters || r.salesQuantity || 0) * (r.ratePerLitre || r.rate || 0))}`
    );
    const xlsContent = '\uFEFF' + [headers.join('\n'), ...rows].join('\n');
    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `meter_readings_audit_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported Excel report successfully!');
  };

  const downloadPDF = (data: MeterReading[]) => {
    if (!data.length) { toast.warning('No records to print'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Pop-up blocked. Please allow pop-ups.'); return; }
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Meter Readings Audit Log Report</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin-bottom: 4px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 600; }
            .num { text-align: right; font-family: monospace; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
          </style>
        </head>
        <body>
          <h2>Meter Readings Shift Audit Logs</h2>
          <p>Generated on ${new Date().toLocaleString()} ${mpdName ? `| Filtered for: ${mpdName}` : ''}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>MPD / Nozzle</th>
                <th>Fuel Type</th>
                <th class="num">Opening</th>
                <th class="num">Closing</th>
                <th class="num">Testing (L)</th>
                <th class="num">Net Sales (L)</th>
                <th class="num">Rate (₹)</th>
                <th class="num">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((r: any) => `
                <tr>
                  <td>${r.date || '-'}</td>
                  <td>${r.shiftName || '-'}</td>
                  <td>${r.mpdName || ''} - ${r.nozzleName || ''}</td>
                  <td><span class="badge">${r.fuelType || '-'}</span></td>
                  <td class="num">${r.openingReading?.toFixed(2) ?? '0.00'}</td>
                  <td class="num">${r.closingReading?.toFixed(2) ?? '0.00'}</td>
                  <td class="num">${(r.testingQuantity || 0).toFixed(2)}</td>
                  <td class="num"><b>${(r.salesLiters ?? r.salesQuantity ?? 0).toFixed(2)} L</b></td>
                  <td class="num">₹${(r.ratePerLitre ?? r.rate ?? 0).toFixed(2)}</td>
                  <td class="num"><b>₹${(r.totalAmount ?? r.netAmount ?? ((r.salesLiters || r.salesQuantity || 0) * (r.ratePerLitre || r.rate || 0))).toFixed(2)}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const totalVolume = summaryData?.totalSalesLiters || 0;
  const totalRevenue = summaryData?.totalAmount || 0;

  const hasActiveFilters = Boolean(searchTerm || shiftFilter !== 'ALL' || fuelTypeFilter !== 'ALL' || fromDate || toDate);

  const resetFilters = () => {
    setSearchTerm('');
    setShiftFilter('ALL');
    setFuelTypeFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col overflow-hidden p-0 border shadow-2xl rounded-xl"
        style={{ maxWidth: '95vw', width: '95vw', height: '92vh', maxHeight: '92vh' }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0 pr-12">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <History className="w-5 h-5 text-primary" />
              Meter Readings History &amp; Audit Logs
              {mpdName && (
                <Badge variant="outline" className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 font-semibold text-xs ml-2">
                  {mpdName}
                </Badge>
              )}
            </DialogTitle>

            <div className="hidden sm:flex items-center gap-4 bg-background/80 backdrop-blur px-3.5 py-1.5 rounded-lg border text-xs shadow-xs mr-8">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Total Logs:</span>
                <span className="font-bold text-foreground">{totalElements}</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totalVolume.toFixed(2)} L</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Inline Filter Bar matching Duty Records modal */}
        <div className="px-6 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center gap-3 shrink-0">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search Nozzle or MPD..."
              className="pl-8 h-8 text-xs bg-background"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(0); }}
              className="w-32 h-8 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(0); }}
              className="w-32 h-8 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">Shift</label>
            <Select value={shiftFilter} onValueChange={v => { setShiftFilter(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-40 text-xs bg-background">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Shifts</SelectItem>
                {masterShifts.map(s => (
                  <SelectItem key={s.id || s.shiftName} value={s.shiftName}>
                    {s.shiftName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground font-medium">Fuel Type</label>
            <Select value={fuelTypeFilter} onValueChange={v => { setFuelTypeFilter(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-44 text-xs bg-background">
                <SelectValue placeholder="All Fuel Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Fuel Types</SelectItem>
                {fuelProducts.map(p => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={resetFilters}>
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-medium hover:bg-green-50 dark:hover:bg-green-950/30" onClick={() => downloadCSV(readings)}>
              <FileText className="w-3.5 h-3.5 text-green-600" /> CSV
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => downloadXLS(readings)}>
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-medium hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => downloadPDF(readings)}>
              <Download className="w-3.5 h-3.5 text-red-600" /> PDF
            </Button>
          </div>
        </div>

        {/* Scrollable Table matching Employee Assignment duty records table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading meter reading logs...</p>
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
              <History className="w-10 h-10 opacity-20" />
              <p className="text-sm">No meter reading logs found matching your filters.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border z-10">
                <tr>
                  <th className="w-14 text-center px-3 py-3 font-medium text-muted-foreground">S.No</th>
                  <th className="w-28 text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Shift</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">MPD</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nozzle</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fuel</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Opening</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Closing</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Testing</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sales (L)</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Rate</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, idx) => (
                  <tr key={r.id || idx} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                    <td className="w-14 text-center px-3 py-3 font-semibold text-muted-foreground text-xs">
                      {page * 20 + idx + 1}
                    </td>
                    <td className="w-28 px-4 py-3 font-mono text-xs">{r.date ? formatDateToDMY(r.date) : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{r.shiftName || '-'}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.mpdName || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-purple-700 dark:text-purple-300 text-xs">{r.nozzleName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${fuelBadgeStyle(r.fuelType)}`}>
                        {r.fuelType || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r.openingReading?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">{r.closingReading?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{(r.testingQuantity || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{((r as any).salesLiters ?? (r as any).salesQuantity ?? 0).toFixed(2)} L</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">₹{((r as any).ratePerLitre ?? (r as any).rate ?? 0).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{((r as any).totalAmount ?? (r as any).netAmount ?? (((r as any).salesLiters || 0) * ((r as any).ratePerLitre || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {/* Spacer row to prevent sticky tfoot from obscuring the last data row */}
                <tr className="h-14 border-none pointer-events-none" aria-hidden="true">
                  <td colSpan={12} className="p-0 border-none h-14" />
                </tr>
              </tbody>
              <tfoot className="sticky bottom-0 bg-muted/95 backdrop-blur-sm border-t-2 border-border z-10 font-bold text-xs">
                <tr className="bg-muted/60">
                  <td className="text-left px-4 py-3 text-foreground" colSpan={6}>
                    Total ({totalElements.toLocaleString()} records)
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {(summaryData?.totalOpening || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {(summaryData?.totalClosing || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {(summaryData?.totalTesting || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {(summaryData?.totalSalesLiters || 0).toFixed(2)} L
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{(summaryData?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination footer matching Employee Assignment duty records modal */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20 shrink-0">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {totalElements.toLocaleString()} records
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              className="h-7 px-2 gap-1"
              disabled={page === 0 || loading}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono px-2">{page + 1}</span>
            <Button
              variant="outline" size="sm"
              className="h-7 px-2 gap-1"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MeterReadingTable({
  mpdName,
  mpd,
  selectedDate,
  scopeMode = 'shift',
  rateMaster,
  onTotalSalesChange,
  onFuelSalesSummaryChange,
  onShiftChange
}: {
  mpdName: string;
  mpd?: MPD;
  selectedDate?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
  rateMaster?: Record<string, number>;
  onTotalSalesChange?: (val: number) => void;
  onFuelSalesSummaryChange?: (summary: Array<{ product: string; units: number; rate: number; amount: number }>) => void;
  onShiftChange?: (shiftName: string) => void;
}) {
  const [masterShifts, setMasterShifts] = React.useState<ShiftMaster[]>([]);
  const [selectedShift, setSelectedShift] = React.useState('');
  const [savingReadings, setSavingReadings] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [dynamicOpeningReadings, setDynamicOpeningReadings] = React.useState<{ [nozzleId: string]: number }>({});
  const [savedNozzleRates, setSavedNozzleRates] = React.useState<{ [shift: string]: { [srNo: number]: number } }>({});
  const [scopeHistoricalSales, setScopeHistoricalSales] = React.useState<number | null>(null);
  const [nozzleScopeSummaries, setNozzleScopeSummaries] = React.useState<{
    [nozzleKey: string]: {
      openingReading: number;
      closingReading: number;
      testingQuantity: number;
      salesLiters: number;
      ratePerLitre: number;
      totalAmount: number;
    };
  }>({});

  React.useEffect(() => {
    const loadMasterShifts = async () => {
      try {
        const shifts = await fetchShiftsAll();
        if (shifts && shifts.length > 0) {
          setMasterShifts(shifts);
          const activeShift = getActiveShiftNameFromMaster(shifts);
          setSelectedShift(activeShift);
          if (onShiftChange) onShiftChange(activeShift);
        }
      } catch (err) {
        console.error('Failed to fetch master shifts:', err);
      }
    };
    loadMasterShifts();
  }, []);

  const activeShiftNames = React.useMemo(() => {
    if (masterShifts.length > 0) {
      return masterShifts.map(s => s.shiftName);
    }
    return ['Shift 1 (Morning)', 'Shift 2 (Afternoon)', 'Shift 3 (Night)'];
  }, [masterShifts]);

  const prevActiveRef = React.useRef<string>('');
  React.useEffect(() => {
    if (activeShiftNames.length > 0) {
      const activeShift = getActiveShiftNameFromMaster(masterShifts);
      if (activeShift && (!selectedShift || activeShift !== prevActiveRef.current)) {
        prevActiveRef.current = activeShift;
        const matched = activeShiftNames.includes(activeShift) ? activeShift : activeShiftNames[0];
        setSelectedShift(matched);
        if (onShiftChange) onShiftChange(matched);
      }
    }
  }, [activeShiftNames, masterShifts]);

  React.useEffect(() => {
    if (selectedShift && onShiftChange) {
      onShiftChange(selectedShift);
    }
  }, [selectedShift]);

  const [savedOpeningReadings, setSavedOpeningReadings] = React.useState<{ [shift: string]: { [nozzleId: string]: number } }>({});

  const targetDate = React.useMemo(() => selectedDate || new Date().toISOString().slice(0, 10), [selectedDate]);

  React.useEffect(() => {
    if (scopeMode === 'shift') {
      setScopeHistoricalSales(null);
      setNozzleScopeSummaries({});
      return;
    }
    const loadScopeMeterSales = async () => {
      try {
        const params: any = {
          size: 100000
        };
        const cleanMpdId = mpd?.id ? String(mpd.id).replaceAll(/\D+/g, '') : undefined;
        if (cleanMpdId) params.mpdId = cleanMpdId;
        if (scopeMode === 'day' && targetDate) {
          params.fromDate = targetDate;
          params.toDate = targetDate;
        }
        const res = await fetchMeterReadingsHistory(params);
        let filtered = res.content || [];
        const targetMpdName = mpd?.mpdName || mpdName;
        if (targetMpdName) {
          const matchNumber = targetMpdName.match(/\d+/);
          const numStr = matchNumber ? matchNumber[0] : '';
          filtered = filtered.filter(r => {
            if (r.mpdName && targetMpdName && r.mpdName.toLowerCase().includes(targetMpdName.toLowerCase())) return true;
            if (r.mpdName && targetMpdName && targetMpdName.toLowerCase().includes(r.mpdName.toLowerCase())) return true;
            if (numStr && r.mpdName && r.mpdName.match(/\d+/)?.[0] === numStr) return true;
            if (numStr && r.mpdId && String(r.mpdId) === numStr) return true;
            return false;
          });
        }
        const total = filtered.reduce((sum: number, item: any) => {
          const amt = item.netAmount !== undefined && item.netAmount !== null
            ? Number(item.netAmount)
            : (Number(item.salesQuantity) || (Number(item.salesLiters) || 0)) * (Number(item.rate) || (Number(item.ratePerLitre) || 0));
          return sum + (amt || 0);
        }, 0);
        setScopeHistoricalSales(total);

        // Group per nozzle
        const summaries: { [key: string]: any } = {};
        filtered.forEach((r: any) => {
          const nozzleIdKey = r.nozzleId ? String(r.nozzleId).toLowerCase() : '';
          const nozzleNameKey = r.nozzleName ? String(r.nozzleName).toLowerCase() : '';
          const matchNum = (r.nozzleName || '').match(/\d+/)?.[0] || String(r.nozzleId || '').match(/\d+/)?.[0] || '';

          const keys = [
            nozzleIdKey,
            nozzleNameKey,
            matchNum ? `nozzle_${matchNum}` : '',
            matchNum ? `noz_${matchNum}` : '',
            matchNum ? `n_${matchNum}` : '',
            matchNum ? matchNum : ''
          ].filter(Boolean);

          keys.forEach(key => {
            if (!summaries[key]) {
              summaries[key] = {
                openingReading: Number(r.openingReading) || 0,
                closingReading: Number(r.closingReading) || 0,
                testingQuantity: Number(r.testingQuantity) || 0,
                salesLiters: Number(r.salesLiters || r.salesQuantity) || 0,
                ratePerLitre: Number(r.ratePerLitre || r.rate) || 0,
                totalAmount: Number(r.totalAmount || r.netAmount) || 0,
                firstDate: r.date,
                lastDate: r.date
              };
            } else {
              if (Number(r.openingReading) > 0 && (summaries[key].openingReading === 0 || r.date < summaries[key].firstDate)) {
                summaries[key].openingReading = Number(r.openingReading);
                summaries[key].firstDate = r.date;
              }
              if (Number(r.closingReading) >= summaries[key].closingReading) {
                summaries[key].closingReading = Number(r.closingReading);
                summaries[key].lastDate = r.date;
              }
              summaries[key].testingQuantity += Number(r.testingQuantity) || 0;
              summaries[key].salesLiters += Number(r.salesLiters || r.salesQuantity) || 0;
              if (Number(r.ratePerLitre || r.rate) > 0) {
                summaries[key].ratePerLitre = Number(r.ratePerLitre || r.rate);
              }
              summaries[key].totalAmount += Number(r.totalAmount || r.netAmount) || 0;
            }
          });
        });
        setNozzleScopeSummaries(summaries);
      } catch (err) {
        console.error('Failed to load scope meter sales:', err);
      }
    };
    loadScopeMeterSales();
  }, [mpdName, mpd?.mpdName, mpd?.id, targetDate, scopeMode]);

  React.useEffect(() => {
    const loadBackendOpenings = async () => {
      if (mpd && mpd.nozzles && mpd.nozzles.length > 0 && selectedShift) {
        const openings: { [id: string]: number } = {};
        for (const n of mpd.nozzles) {
          try {
            // Exclude targetDate's selectedShift record so we get the PREVIOUS shift/day closing
            const latest = await fetchLatestMeterReading(n.id, targetDate, selectedShift);
            if (latest != null && !isNaN(latest)) {
              openings[n.id] = latest;
            }
          } catch (err) {
            console.error('Failed to fetch latest meter reading for nozzle:', n.id, err);
          }
        }
        setDynamicOpeningReadings(openings);
      }
    };
    loadBackendOpenings();
  }, [mpd, selectedShift, targetDate]);

  const [shiftReadings, setShiftReadings] = React.useState<{ [shift: string]: { [key: number]: string } }>({});

  const getOpeningForNozzle = React.useCallback((srNo: number, baseOpening: number, shift: string) => {
    const shiftIndex = activeShiftNames.indexOf(shift);
    if (shiftIndex <= 0) {
      return baseOpening;
    }
    for (let i = shiftIndex - 1; i >= 0; i--) {
      const prevShiftName = activeShiftNames[i];
      const prevClose = parseFloat(shiftReadings[prevShiftName]?.[srNo] || '');
      if (!isNaN(prevClose) && prevClose > 0) {
        return prevClose;
      }
    }
    return baseOpening;
  }, [shiftReadings, activeShiftNames]);

  const nozzleData = React.useMemo(() => {
    if (mpd && mpd.nozzles && mpd.nozzles.length > 0) {
      return mpd.nozzles.map((n: any, index: number) => {
        const srNo = index + 1;
        const savedOpening = savedOpeningReadings[selectedShift]?.[n.id];
        const inStatePrevClosing = getOpeningForNozzle(srNo, 0, selectedShift);
        const backendLatest = dynamicOpeningReadings[n.id];
        const mpdMasterInitial = (n.initialOpeningReading != null && !isNaN(n.initialOpeningReading)) ? n.initialOpeningReading : null;
        const fallbackDefault = getDefaultOpeningReading(n.nozzleName, n.fuelType, index);

        const openingReading = (inStatePrevClosing > 0 ? inStatePrevClosing : (backendLatest ?? (savedOpening ?? (mpdMasterInitial ?? fallbackDefault))));

        return {
          srNo,
          id: n.id,
          nozzleNumber: n.nozzleName,
          fuelType: n.fuelType || 'Petrol',
          openingReading,
          testing: 0.00
        };
      });
    }
    return [
      { srNo: 1, id: 'n1', nozzleNumber: 'N-001', fuelType: 'Petrol', openingReading: 12500.50, testing: 0.00 },
      { srNo: 2, id: 'n2', nozzleNumber: 'N-002', fuelType: 'Diesel', openingReading: 18750.25, testing: 0.00 },
      { srNo: 3, id: 'n3', nozzleNumber: 'N-003', fuelType: 'Petrol', openingReading: 9800.75, testing: 0.00 },
      { srNo: 4, id: 'n4', nozzleNumber: 'N-004', fuelType: 'Diesel', openingReading: 22300.00, testing: 0.00 },
    ];
  }, [mpd, dynamicOpeningReadings, savedOpeningReadings, selectedShift, getOpeningForNozzle]);

  const loadExistingReadingsForShift = React.useCallback(async (shiftName: string) => {
    if (!mpd || !mpd.nozzles || !shiftName) return;
    const newShiftReadings: { [key: number]: string } = {};
    const newTestingReadings: { [key: number]: string } = {};
    const newSavedOpenings: { [nozzleId: string]: number } = {};
    const newSavedRates: { [key: number]: number } = {};

    for (let idx = 0; idx < mpd.nozzles.length; idx++) {
      const n = mpd.nozzles[idx];
      const srNo = idx + 1;
      try {
        const existing = await fetchExistingMeterReading(String(n.id), targetDate, shiftName);
        if (existing && existing.closingReading != null) {
          newShiftReadings[srNo] = String(existing.closingReading);
          if (existing.testingQuantity != null && Number(existing.testingQuantity) > 0) {
            newTestingReadings[srNo] = String(existing.testingQuantity);
          }
          if (existing.openingReading != null && !isNaN(existing.openingReading)) {
            newSavedOpenings[n.id] = existing.openingReading;
          }
          if (existing.ratePerLitre != null && existing.ratePerLitre > 0) {
            newSavedRates[srNo] = existing.ratePerLitre;
          }
        } else {
          // Unsaved / Closed MPD shift: pre-fill closing reading with opening reading as default
          const fallbackReading = dynamicOpeningReadings[n.id] ?? (n.initialOpeningReading ?? 0);
          newShiftReadings[srNo] = fallbackReading > 0 ? String(fallbackReading) : '';
        }
      } catch (err) {
        console.error('Failed to fetch existing reading for nozzle:', n.id, err);
      }
    }

    setSavedOpeningReadings(prev => ({
      ...prev,
      [shiftName]: newSavedOpenings
    }));

    setSavedNozzleRates(prev => ({
      ...prev,
      [shiftName]: newSavedRates
    }));

    setTestingReadings(prev => ({
      ...prev,
      [shiftName]: newTestingReadings
    }));

    setShiftReadings(prev => ({
      ...prev,
      [shiftName]: newShiftReadings
    }));
  }, [mpd, targetDate]);

  React.useEffect(() => {
    if (selectedShift) {
      loadExistingReadingsForShift(selectedShift);
    }
  }, [selectedShift, loadExistingReadingsForShift]);

  const activeNozzleData = React.useMemo(() => {
    return nozzleData;
  }, [nozzleData]);

  const [testingReadings, setTestingReadings] = React.useState<{ [shift: string]: { [key: number]: string } }>({});

  const handleTestingReadingChange = (srNo: number, value: string) => {
    setTestingReadings(prev => ({
      ...prev,
      [selectedShift]: {
        ...(prev[selectedShift] || {}),
        [srNo]: value
      }
    }));
  };

  const getTestingForNozzle = React.useCallback((srNo: number) => {
    const val = parseFloat(testingReadings[selectedShift]?.[srNo] || '0');
    return !isNaN(val) && val >= 0 ? val : 0;
  }, [testingReadings, selectedShift]);

  const getEffectiveRateForNozzle = React.useCallback((srNo: number, fuelType: string) => {
    const saved = savedNozzleRates[selectedShift]?.[srNo];
    if (saved != null && saved > 0) return saved;
    return getFuelRate(fuelType, rateMaster);
  }, [savedNozzleRates, selectedShift, rateMaster]);

  const closingReadings = shiftReadings[selectedShift] || {};

  const handleClosingReadingChange = (srNo: number, value: string) => {
    setShiftReadings(prev => ({
      ...prev,
      [selectedShift]: {
        ...(prev[selectedShift] || {}),
        [srNo]: value
      }
    }));
  };

  const calculateSales = (srNo: number, openingReading: number) => {
    const rawClosing = closingReadings[srNo];
    if (rawClosing === undefined || rawClosing === null || String(rawClosing).trim() === '') {
      return '0.00';
    }
    const closingReading = parseFloat(rawClosing);
    if (isNaN(closingReading)) return '0.00';

    const testing = getTestingForNozzle(srNo);
    let sales = 0;
    if (closingReading < openingReading && closingReading > 0) {
      const maxLimit = 1000000.0;
      sales = (maxLimit - openingReading) + closingReading - testing;
    } else {
      sales = closingReading - openingReading - testing;
    }
    return sales > 0 ? sales.toFixed(2) : '0.00';
  };

  const calculateFuelWiseTotals = () => {
    const totals: { [key: string]: { units: number; amount: number; rate: number } } = {};

    activeNozzleData.forEach((nozzle) => {
      const keyId = String(nozzle.id).toLowerCase();
      const keyName = String(nozzle.nozzleNumber).toLowerCase();
      const scopeItem = scopeMode !== 'shift' ? (nozzleScopeSummaries[keyId] || nozzleScopeSummaries[keyName]) : null;

      let sales = 0;
      let rate = getEffectiveRateForNozzle(nozzle.srNo, nozzle.fuelType);
      let amount = 0;

      if (scopeMode !== 'shift' && scopeItem) {
        sales = scopeItem.salesLiters || 0;
        if (scopeItem.ratePerLitre > 0) rate = scopeItem.ratePerLitre;
        amount = scopeItem.totalAmount || (sales * rate);
      } else {
        const rawClosing = closingReadings[nozzle.srNo];
        const effectiveClosing = (rawClosing !== undefined && rawClosing !== null && String(rawClosing).trim() !== '')
          ? parseFloat(rawClosing)
          : nozzle.openingReading;
        const testingL = getTestingForNozzle(nozzle.srNo);
        const grossVal = !isNaN(effectiveClosing) && effectiveClosing > 0 ? effectiveClosing : nozzle.openingReading;
        sales = Math.max(0, grossVal - testingL);
        amount = sales * rate;
      }

      if (!totals[nozzle.fuelType]) {
        totals[nozzle.fuelType] = { units: 0, amount: 0, rate };
      }
      totals[nozzle.fuelType].units += sales;
      totals[nozzle.fuelType].amount += amount;
      totals[nozzle.fuelType].rate = rate;
    });

    return totals;
  };

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const fuelTotals = React.useMemo(() => {
    return calculateFuelWiseTotals();
  }, [activeNozzleData, scopeMode, nozzleScopeSummaries, shiftReadings, savedNozzleRates, rateMaster, selectedShift, testingReadings]);

  const grandTotal = React.useMemo(() => {
    let totalUnits = 0;
    let totalAmount = 0;
    Object.values(fuelTotals).forEach((data) => {
      totalUnits += data.units;
      totalAmount += data.amount;
    });
    return { totalUnits, totalAmount };
  }, [fuelTotals]);

  const fuelTotalsKey = React.useMemo(() => JSON.stringify(fuelTotals), [fuelTotals]);

  React.useEffect(() => {
    if (onTotalSalesChange) {
      onTotalSalesChange(grandTotal.totalAmount || 0);
    }
    if (onFuelSalesSummaryChange) {
      const shiftNetTotals: { [key: string]: { units: number; amount: number; rate: number } } = {};
      activeNozzleData.forEach((nozzle) => {
        const netSalesL = parseFloat(calculateSales(nozzle.srNo, nozzle.openingReading)) || 0;
        const rate = getEffectiveRateForNozzle(nozzle.srNo, nozzle.fuelType);
        const netAmt = netSalesL * rate;
        if (!shiftNetTotals[nozzle.fuelType]) {
          shiftNetTotals[nozzle.fuelType] = { units: 0, amount: 0, rate };
        }
        shiftNetTotals[nozzle.fuelType].units += netSalesL;
        shiftNetTotals[nozzle.fuelType].amount += netAmt;
      });

      const list = Object.entries(shiftNetTotals).map(([product, data]) => ({
        product,
        units: data.units,
        rate: data.rate || getFuelRate(product, rateMaster),
        amount: data.amount
      }));
      onFuelSalesSummaryChange(list);
    }
  }, [grandTotal.totalAmount, scopeMode, fuelTotalsKey, onTotalSalesChange, onFuelSalesSummaryChange, rateMaster]);

  const handleSaveShiftReadings = async () => {
    for (const n of activeNozzleData) {
      const closeStr = closingReadings[n.srNo];
      if (closeStr !== undefined && closeStr !== '') {
        const closeVal = parseFloat(closeStr);
        if (!isNaN(closeVal) && closeVal < n.openingReading) {
          toast.error(`Warning: Closing reading (${closeVal}) for ${n.nozzleNumber} is less than Opening Reading (${n.openingReading.toFixed(2)})!`);
          return;
        }
      }
    }

    try {
      setSavingReadings(true);
      const payload: MeterReading[] = activeNozzleData.map(n => {
        const closeVal = parseFloat(closingReadings[n.srNo] || '0') || n.openingReading;
        const testVal = getTestingForNozzle(n.srNo);
        const sales = parseFloat(calculateSales(n.srNo, n.openingReading));
        const rate = getEffectiveRateForNozzle(n.srNo, n.fuelType);
        return {
          date: targetDate,
          shiftName: selectedShift,
          mpdId: mpd?.id,
          mpdName: mpdName,
          nozzleId: String(n.id),
          nozzleName: n.nozzleNumber,
          fuelType: n.fuelType,
          openingReading: n.openingReading,
          closingReading: closeVal,
          testingQuantity: testVal,
          salesLiters: sales,
          ratePerLitre: rate,
          totalAmount: sales * rate,
          recordedBy: 'Shift Manager'
        };
      });

      await saveMeterReadingsBatchApi(payload);
      toast.success(`Successfully saved meter readings for ${selectedShift}!`);
      await loadExistingReadingsForShift(selectedShift);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save shift meter readings');
    } finally {
      setSavingReadings(false);
    }
  };

  return (
    <div>
      <MeterReadingHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        mpdId={mpd?.id}
        mpdName={mpdName}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Meter Readings - {mpdName}</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="gap-1.5 h-9 text-xs"
          >
            <History className="w-4 h-4 text-purple-600" /> View Reading Logs
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveShiftReadings}
            disabled={savingReadings}
            className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-9 text-xs font-semibold"
          >
            {savingReadings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Readings
          </Button>
        </div>
      </div>

      {/* Compact Meter Reading Table */}
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-left text-sm font-semibold">Sr.No</th>
                <th className="p-3 text-left text-sm font-semibold">Nozzle</th>
                <th className="p-3 text-left text-sm font-semibold">Fuel Type</th>
                <th className="p-3 text-left text-sm font-semibold">Opening Reading</th>
                <th className="p-3 text-left text-sm font-semibold">Testing (L)</th>
                <th className="p-3 text-left text-sm font-semibold">Closing Reading (L)</th>
                <th className="p-3 text-left text-sm font-semibold">Rate (₹/L)</th>
                <th className="p-3 text-right text-sm font-semibold">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {activeNozzleData.map((nozzle) => {
                const keyId = String(nozzle.id).toLowerCase();
                const keyName = String(nozzle.nozzleNumber).toLowerCase();
                const scopeItem = scopeMode !== 'shift' ? (nozzleScopeSummaries[keyId] || nozzleScopeSummaries[keyName]) : null;

                const displayOpening = scopeMode !== 'shift' && scopeItem && scopeItem.openingReading > 0
                  ? scopeItem.openingReading
                  : nozzle.openingReading;

                const rawClose = closingReadings[nozzle.srNo];
                const effectiveClose = (rawClose !== undefined && rawClose !== null && String(rawClose).trim() !== '') ? parseFloat(rawClose) : nozzle.openingReading;
                const totalizerVolume = !isNaN(effectiveClose) && effectiveClose > 0 ? effectiveClose : nozzle.openingReading;
                const testingVal = getTestingForNozzle(nozzle.srNo);
                const netVolume = Math.max(0, totalizerVolume - testingVal);

                const displaySales = scopeMode !== 'shift' && scopeItem
                  ? scopeItem.salesLiters
                  : totalizerVolume;

                const displayRate = scopeMode !== 'shift' && scopeItem && scopeItem.ratePerLitre > 0
                  ? scopeItem.ratePerLitre
                  : getEffectiveRateForNozzle(nozzle.srNo, nozzle.fuelType);

                const displayAmount = scopeMode !== 'shift' && scopeItem && scopeItem.totalAmount > 0
                  ? scopeItem.totalAmount
                  : (netVolume * displayRate);

                const displayTesting = scopeMode !== 'shift' && scopeItem
                  ? scopeItem.testingQuantity
                  : getTestingForNozzle(nozzle.srNo);

                return (
                  <tr key={nozzle.srNo} className="border-b hover:bg-muted/30">
                    <td className="p-3 text-sm">{nozzle.srNo}</td>
                    <td className="p-3 text-sm font-medium">{nozzle.nozzleNumber}</td>
                    <td className="p-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nozzle.fuelType?.toLowerCase().includes('diesel')
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {nozzle.fuelType}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      <span className="text-muted-foreground font-mono">{displayOpening.toFixed(2)}</span>
                    </td>
                    <td className="p-3">
                      {scopeMode === 'shift' ? (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={testingReadings[selectedShift]?.[nozzle.srNo] ?? ''}
                          onChange={(e) => handleTestingReadingChange(nozzle.srNo, e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-9 text-sm w-24 font-mono text-amber-700 dark:text-amber-300 font-semibold"
                        />
                      ) : (
                        <span className="font-mono text-amber-700 dark:text-amber-300 font-semibold text-sm">
                          {displayTesting.toFixed(2)} L
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={displayOpening.toFixed(2)}
                        value={closingReadings[nozzle.srNo] || ''}
                        onChange={(e) => handleClosingReadingChange(nozzle.srNo, e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-9 text-sm w-36 font-mono border-input"
                      />
                    </td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">
                      ₹{displayRate.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm font-mono font-semibold text-right text-emerald-600 dark:text-emerald-400">
                      {formatIndianCurrency(displayAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fuel-wise Total Sales Summary */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="font-semibold mb-3">Fuel-wise Total Sales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(fuelTotals).map(([fuelType, data]) => (
            <div key={fuelType} className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">{fuelType}</p>
                <p className="text-lg font-semibold">{data.units.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Units</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">{formatIndianCurrency(data.amount)}</p>
                <p className="text-xs text-muted-foreground">@ ₹{(data.rate || getFuelRate(fuelType, rateMaster)).toFixed(2)}/L</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="mt-4 p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{grandTotal.totalUnits.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Sales (All Fuels)</p>
              <p className="text-xl font-bold text-primary">{formatIndianCurrency(grandTotal.totalAmount)}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

interface CreditSalesRecord {
  id: string;
  date: string;
  customer: string;
  slipNo: string;
  productType: string;
  quantity: number;
  saleTime: string;
  totalAmount: number;
  mpd: string;
  nozzle: string;
}

function CreditSalesTab({
  mpdName,
  selectedDate,
  selectedShift,
  scopeMode,
  onTotalChange
}: {
  mpdName: string;
  selectedDate?: string;
  selectedShift?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
  onTotalChange?: (total: number) => void;
}) {
  return (
    <CreditSales
      isEmbedded={true}
      prefilledMpdName={mpdName}
      selectedDate={selectedDate}
      selectedShift={selectedShift}
      scopeMode={scopeMode}
      onTotalChange={onTotalChange}
    />
  );
}

function OwnUseTab({
  mpdName,
  selectedDate,
  selectedShift,
  scopeMode,
  onTotalChange
}: {
  mpdName: string;
  selectedDate?: string;
  selectedShift?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
  onTotalChange?: (total: number) => void;
}) {
  return (
    <OwnUsage
      isEmbedded={true}
      prefilledMpdName={mpdName}
      selectedDate={selectedDate}
      selectedShift={selectedShift}
      scopeMode={scopeMode}
      onTotalChange={onTotalChange}
    />
  );
}

interface SettlementRecord {
  id: string;
  paymentMethod: string;
  amount: number;
  referenceNo: string;
  date: string;
  time: string;
  remarks?: string;
}

function SettlementsTab({
  mpdName,
  selectedDate,
  selectedShift,
  scopeMode = 'overall',
  onTotalChange
}: {
  mpdName: string;
  selectedDate?: string;
  selectedShift?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
  onTotalChange?: (total: number) => void;
}) {
  const [settlementRecords, setSettlementRecords] = React.useState<ShiftSettlementRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [viewSettlementRecord, setViewSettlementRecord] = React.useState<ShiftSettlementRecord | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<ShiftSettlementRecord | null>(null);

  const [formData, setFormData] = React.useState({
    paymentMethod: '',
    amount: '',
    referenceNo: '',
    date: '',
    time: '',
    remarks: ''
  });

  const paymentMethods = [
    'PhonePe',
    'Swipe Machine',
    'RTGS',
    'BPCL Card',
    'ULP',
    'Cheque'
  ];

  const loadSettlements = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSettlementsByMpd(mpdName);
      let filtered = data;
      if (selectedDate) {
        if (scopeMode === 'shift') {
          // Filter by date AND shift for shift-wise balance accuracy
          filtered = data.filter(r => r.date === selectedDate && (!selectedShift || !r.shiftName || r.shiftName === selectedShift));
        } else if (scopeMode === 'day') {
          filtered = data.filter(r => r.date === selectedDate);
        }
        // scopeMode === 'overall': return all (no date filter)
      }

      // Fallback: If strict date/shift filter yields 0 records but data for MPD exists, display all MPD settlements
      if (filtered.length === 0 && data && data.length > 0) {
        filtered = data;
      }

      setSettlementRecords(filtered);
      const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);
      if (onTotalChange) onTotalChange(total);
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
      toast.error('Failed to load settlements data from server');
    } finally {
      setLoading(false);
    }
  }, [mpdName, selectedDate, selectedShift, scopeMode, onTotalChange]);

  React.useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const handleEditSettlement = (record: ShiftSettlementRecord) => {
    setEditingRecord(record);
    setFormData({
      paymentMethod: record.paymentMethod,
      amount: String(record.amount),
      referenceNo: record.referenceNo,
      date: record.date || new Date().toISOString().split('T')[0],
      time: record.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      remarks: record.remarks || ''
    });
    setShowAddForm(true);
  };

  const handleDeleteSettlement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this settlement record?')) return;
    try {
      await deleteSettlementApi(id);
      toast.success('Settlement record deleted successfully');
      loadSettlements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete settlement record');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date) return '-';
    try {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${formattedDate}${time ? `, ${time}` : ''}`;
    } catch {
      return date;
    }
  };

  const calculateMethodWiseTotals = () => {
    const totals: { [key: string]: number } = {};
    settlementRecords.forEach(record => {
      if (!totals[record.paymentMethod]) {
        totals[record.paymentMethod] = 0;
      }
      totals[record.paymentMethod] += record.amount;
    });
    return totals;
  };

  const calculateGrandTotal = () => {
    return settlementRecords.reduce((sum, record) => sum + record.amount, 0);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'PhonePe':
        return <IndianRupee className="w-4 h-4 text-purple-700" />;
      case 'Swipe Machine':
        return <CreditCard className="w-4 h-4 text-blue-700" />;
      case 'RTGS':
        return <IndianRupee className="w-4 h-4 text-green-700" />;
      case 'BPCL Card':
        return <CreditCard className="w-4 h-4 text-orange-700" />;
      case 'ULP':
        return <Package className="w-4 h-4 text-cyan-700" />;
      case 'Cheque':
        return <Clock className="w-4 h-4 text-amber-700" />;
      default:
        return <IndianRupee className="w-4 h-4 text-gray-700" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'PhonePe':
        return 'bg-purple-100 text-purple-800';
      case 'Swipe Machine':
        return 'bg-blue-100 text-blue-800';
      case 'RTGS':
        return 'bg-green-100 text-green-800';
      case 'BPCL Card':
        return 'bg-orange-100 text-orange-800';
      case 'ULP':
        return 'bg-cyan-100 text-cyan-800';
      case 'Cheque':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  React.useEffect(() => {
    if (showAddForm && !editingRecord) {
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }));
    }
  }, [showAddForm, editingRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentMethod) { toast.warning('Please select a payment method'); return; }
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) { toast.warning('Please enter a valid positive amount'); return; }

    try {
      const payload = {
        mpdName,
        paymentMethod: formData.paymentMethod,
        amount: amt,
        referenceNo: formData.referenceNo.trim(),
        date: formData.date || new Date().toISOString().split('T')[0],
        time: formData.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        remarks: formData.remarks.trim(),
        shiftName: selectedShift || undefined
      };

      if (editingRecord) {
        await updateSettlementApi(editingRecord.id, payload);
        toast.success('Settlement record updated successfully');
      } else {
        await createSettlementApi(payload);
        toast.success('Settlement record saved successfully');
      }

      setShowAddForm(false);
      setEditingRecord(null);
      setFormData({
        paymentMethod: '',
        amount: '',
        referenceNo: '',
        date: '',
        time: '',
        remarks: ''
      });
      loadSettlements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settlement record');
    }
  };

  const methodWiseTotals = calculateMethodWiseTotals();
  const grandTotal = calculateGrandTotal();

  return (
    <div>
      {/* Header with Add New button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Settlements - {mpdName}</h3>
        <Button
          onClick={() => { setEditingRecord(null); setFormData({ paymentMethod: '', amount: '', referenceNo: '', date: '', time: '', remarks: '' }); setShowAddForm(true); }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Settlement
        </Button>
      </div>

      {/* Settlements Table */}
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              Loading settlements data...
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-3 text-left text-sm font-semibold">S.No</th>
                  <th className="p-3 text-left text-sm font-semibold">Payment Method</th>
                  <th className="p-3 text-left text-sm font-semibold">Reference No.</th>
                  <th className="p-3 text-left text-sm font-semibold">Date & Time</th>
                  <th className="p-3 text-right text-sm font-semibold">Amount</th>
                  <th className="p-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {settlementRecords.map((record, index) => (
                  <tr key={record.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 text-sm">{index + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          {getPaymentMethodIcon(record.paymentMethod)}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(record.paymentMethod)}`}>
                          {record.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm font-medium">{record.referenceNo || '-'}</td>
                    <td className="p-3 text-sm">{formatDateTime(record.date, record.time)}</td>
                    <td className="p-3 text-sm font-semibold text-green-600 text-right">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                          title="View Record"
                          onClick={() => setViewSettlementRecord(record)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                          title="Edit Record"
                          onClick={() => handleEditSettlement(record)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                          onClick={() => handleDeleteSettlement(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t-2 font-bold text-xs">
                <tr>
                  <td className="p-3 text-left" colSpan={4}>
                    Overall Settlements Total ({settlementRecords.length} Transactions)
                  </td>
                  <td className="p-3 text-right text-green-700 text-base font-bold">
                    {formatCurrency(calculateGrandTotal())}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          )}

          {!loading && settlementRecords.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No settlements recorded for {mpdName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Settlement" to record a payment
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method-wise Totals */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <h3 className="font-semibold mb-3">Payment Method-wise Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paymentMethods.map(method => (
            <div key={method} className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  {getPaymentMethodIcon(method)}
                </div>
                <span className="text-sm font-medium">{method}</span>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(methodWiseTotals[method] || 0)}
              </span>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Settlements</p>
              <p className="text-xs text-muted-foreground mt-0.5">All payment methods</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Settlement Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Settlement' : 'Add Settlement'} - {mpdName}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update payment settlement details.' : 'Record a new payment settlement for this MPD.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settlement-date">Date</Label>
                  <Input
                    id="settlement-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settlement-time">Time</Label>
                  <Input
                    id="settlement-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger id="paymentMethod" className="border border-green-200 focus:border-green-400">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount and Reference Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settlement-amount">Amount (₹) <span className="text-red-500">*</span></Label>
                  <Input
                    id="settlement-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border border-green-200 focus:border-green-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNo">Reference Number</Label>
                  <Input
                    id="referenceNo"
                    placeholder="Transaction/Reference ID"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="border border-green-200 focus:border-green-400"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="settlement-remarks">Remarks</Label>
                <Textarea
                  id="settlement-remarks"
                  placeholder="Additional notes..."
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="border border-green-200 focus:border-green-400"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingRecord ? 'Update Settlement' : 'Save Settlement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Settlement Dialog - matches Add/Edit Settlement dialog layout */}
      {viewSettlementRecord && (
        <Dialog open={!!viewSettlementRecord} onOpenChange={() => setViewSettlementRecord(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Settlement Details - {mpdName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    disabled
                    value={viewSettlementRecord.date}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    disabled
                    value={viewSettlementRecord.time}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Input
                  disabled
                  value={viewSettlementRecord.paymentMethod}
                  className="bg-background"
                />
              </div>

              {/* Amount and Reference Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    disabled
                    value={formatCurrency(viewSettlementRecord.amount)}
                    className="bg-background font-semibold text-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    disabled
                    value={viewSettlementRecord.referenceNo || '—'}
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  disabled
                  value={viewSettlementRecord.remarks || 'No remarks provided.'}
                  rows={3}
                  className="bg-background resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewSettlementRecord(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


function EmployeeDepositsTab({
  mpdName,
  selectedDate,
  selectedShift,
  scopeMode,
  onTotalChange
}: {
  mpdName: string;
  selectedDate?: string;
  selectedShift?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
  onTotalChange?: (total: number) => void;
}) {
  return (
    <CashCollection
      isEmbedded={true}
      prefilledMpdName={mpdName}
      selectedDate={selectedDate}
      selectedShift={selectedShift}
      scopeMode={scopeMode}
      onTotalChange={onTotalChange}
    />
  );
}


function MPDTabContent({
  mpdName,
  mpd,
  mpds = [],
  selectedDate,
  activeSubTab = subTabs[0],
  onSubTabChange,
  rateMaster = {},
  activeShiftName = 'Shift 1'
}: {
  mpdName: string;
  mpd?: MPD;
  mpds?: MPD[];
  selectedDate?: string;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
  rateMaster?: Record<string, number>;
  activeShiftName?: string;
}) {
  const [resolvedMpdName, setResolvedMpdName] = React.useState(() => {
    if (mpd?.mpdName) return mpd.mpdName;
    return resolveMpdNameFromList(mpdName, mpds);
  });
  const [scopeMode, setScopeMode] = React.useState<'shift' | 'day' | 'overall'>('shift');
  const [meterReadingTotalSales, setMeterReadingTotalSales] = React.useState(0);
  const [creditSalesTotalAmount, setCreditSalesTotalAmount] = React.useState<number | undefined>(undefined);
  const [ownUseTotalAmount, setOwnUseTotalAmount] = React.useState<number | undefined>(undefined);
  const [settlementTotalAmount, setSettlementTotalAmount] = React.useState<number | undefined>(undefined);
  const [employeeDepositsTotalAmount, setEmployeeDepositsTotalAmount] = React.useState<number | undefined>(undefined);
  const [fuelSalesSummary, setFuelSalesSummary] = React.useState<Array<{ product: string; units: number; rate: number; amount: number }>>([]);
  const [currentShift, setCurrentShift] = React.useState(activeShiftName);

  // NOTE: No reset effect here — MPDTabContent is fully unmounted/remounted on MPD
  // tab switch (outer TabsContent has no forceMount), so stale data cannot leak
  // between MPDs. Resetting via effect created a race condition where the effect
  // fired AFTER children reported correct totals, zeroing the tab header values.

  React.useEffect(() => {
    if (activeShiftName) {
      setCurrentShift(activeShiftName);
    }
  }, [activeShiftName]);

  const [activeTab, setActiveTab] = React.useState(activeSubTab);

  React.useEffect(() => {
    setActiveTab(activeSubTab);
  }, [activeSubTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (onSubTabChange) {
      onSubTabChange(newTab);
    }
  };

  React.useEffect(() => {
    if (mpd?.mpdName) {
      setResolvedMpdName(mpd.mpdName);
      return;
    }
    if (mpdName && mpds.length > 0) {
      setResolvedMpdName(resolveMpdNameFromList(mpdName, mpds));
      return;
    }
    const loadMpdName = async () => {
      try {
        const fetchedMpds = await fetchMpdsAll();
        if (mpdName && fetchedMpds.length > 0) {
          setResolvedMpdName(resolveMpdNameFromList(mpdName, fetchedMpds));
        }
      } catch (err) {
        console.error('Failed to load MPDs in MPDTabContent:', err);
      }
    };
    loadMpdName();
  }, [mpdName, mpd, mpds]);

  // ── Overall cumulative totals (Day 1 → now) ─────────────────────────────────
  // Loaded directly from backend for each category. Used as the tab header
  // baseline when the shift-entry child hasn't reported a live total yet (0).
  const [overallMeterTotal, setOverallMeterTotal] = React.useState(0);
  const [overallCreditTotal, setOverallCreditTotal] = React.useState(0);
  const [overallOwnUseTotal, setOverallOwnUseTotal] = React.useState(0);
  const [overallSettlementsTotal, setOverallSettlementsTotal] = React.useState(0);
  const [overallDepositsTotal, setOverallDepositsTotal] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const loadOverallTotals = async () => {
      if (!resolvedMpdName && !mpd?.id) return;
      const cleanMpdId = mpd?.id ? String(mpd.id).replaceAll(/\D+/g, '') : undefined;
      const mpdNameForFilter = resolvedMpdName || mpdName;

      const isLocalMpdMatch = (rec?: any, tgt?: string) => {
        if (!tgt || !rec) return false;
        const recStr = typeof rec === 'object' ? (rec.mpdName || rec.mpd || rec.mpdId || rec.dispenser || '') : String(rec);
        if (!recStr || !recStr.trim()) return false;
        const rNorm = recStr.trim().toLowerCase();
        const tNorm = tgt.trim().toLowerCase();
        if (rNorm === tNorm || rNorm.includes(tNorm) || tNorm.includes(rNorm)) return true;
        const rNum = recStr.match(/(?:dispenser|mpd)\s*(\d+)/i)?.[1] || recStr.match(/\d+/)?.[0];
        const tNum = tgt.match(/(?:dispenser|mpd)\s*(\d+)/i)?.[1] || tgt.match(/\d+/)?.[0];
        return Boolean(rNum && tNum && rNum === tNum);
      };

      const isUpToSelectedDate = (recDate?: string) => {
        if (!recDate || !selectedDate) return true;
        return recDate <= selectedDate;
      };

      try {
        // ── Cumulative Meter Readings total (Day 1 -> Selected Date) ──────────
        const meterParams: any = { size: 100000 };
        if (cleanMpdId) meterParams.mpdId = cleanMpdId;
        if (selectedDate) {
          meterParams.toDate = selectedDate;
        }

        const meterRes = await fetchMeterReadingsHistory(meterParams);
        if (!cancelled) {
          let filteredMeter = (meterRes.content || []).filter((r: any) =>
            isLocalMpdMatch(r, mpdNameForFilter) && isUpToSelectedDate(r.date)
          );
          const meterTotal = filteredMeter.reduce((sum: number, r: any) =>
            sum + (Number(r.totalAmount) || Number(r.netAmount) || 0), 0);
          setOverallMeterTotal(meterTotal);
        }
      } catch (err) {
        console.error('Failed to load overall meter total:', err);
      }

      try {
        // ── Cumulative Credit Sales overall total (Day 1 -> Selected Date) ────
        const creditResData = await fetchCreditSales({ size: 100000, mpd: mpdNameForFilter || undefined });
        if (!cancelled) {
          let filteredCredit = (creditResData.content || []).filter((r: any) =>
            isLocalMpdMatch(r, mpdNameForFilter) && isUpToSelectedDate(r.date)
          );
          const creditTotal = filteredCredit.reduce((sum: number, r: any) =>
            sum + (Number(r.totalAmount) || Number(r.amount) || 0), 0);
          setOverallCreditTotal(creditTotal);
        }
      } catch (err) {
        console.error('Failed to load overall credit total:', err);
      }

      try {
        // ── Cumulative Own Use overall total (Day 1 -> Selected Date) ─────────
        const ownUseResData = await fetchOwnUsages({ size: 100000, mpd: mpdNameForFilter || undefined });
        if (!cancelled) {
          let filteredOwnUse = (ownUseResData.content || []).filter((r: any) =>
            isLocalMpdMatch(r, mpdNameForFilter) && isUpToSelectedDate(r.date)
          );
          const ownUseTotal = filteredOwnUse.reduce((sum: number, r: any) =>
            sum + (Number(r.totalAmount) || Number(r.amount) || 0), 0);
          setOverallOwnUseTotal(ownUseTotal);
        }
      } catch (err) {
        console.error('Failed to load overall own use total:', err);
      }

      try {
        // ── Cumulative Settlements overall total (Day 1 -> Selected Date) ─────
        if (mpdNameForFilter) {
          const settleRes = await fetchSettlementsByMpd(mpdNameForFilter);
          if (!cancelled) {
            let filteredSettle = (settleRes || []).filter((r: any) =>
              isLocalMpdMatch(r, mpdNameForFilter) && isUpToSelectedDate(r.date)
            );
            const settleTotal = filteredSettle.reduce((sum: number, r: any) =>
              sum + (Number(r.amount) || 0), 0);
            setOverallSettlementsTotal(settleTotal);
          }
        }
      } catch (err) {
        console.error('Failed to load overall settlements total:', err);
      }

      try {
        // ── Cumulative Employee Deposits overall total (Day 1 -> Selected Date)
        const depositsRes = await fetchCashCollections({ size: 100000 });
        if (!cancelled && depositsRes.content) {
          let filteredDeposits = depositsRes.content.filter((r: any) =>
            isLocalMpdMatch(r, mpdNameForFilter) && isUpToSelectedDate(r.date)
          );
          const depositsTotal = filteredDeposits.reduce((sum: number, r: any) =>
            sum + (Number(r.depositAmount) || Number(r.amount) || 0), 0);
          setOverallDepositsTotal(depositsTotal);
        }
      } catch (err) {
        console.error('Failed to load overall deposits total:', err);
      }
    };

    loadOverallTotals();
    return () => { cancelled = true; };
  }, [resolvedMpdName, mpd?.id, mpdName]);

  // Cumulative up-to-date total meter sales: Live active shift sales or saved historical sales fallback
  const getMeterReadingTotal = () => meterReadingTotalSales > 0 ? meterReadingTotalSales : overallMeterTotal;
  const getCreditSalesTotal = () => (creditSalesTotalAmount !== undefined && creditSalesTotalAmount > 0) ? creditSalesTotalAmount : overallCreditTotal;
  const getOwnUseTotal = () => (ownUseTotalAmount !== undefined && ownUseTotalAmount > 0) ? ownUseTotalAmount : overallOwnUseTotal;
  const getSettlementsTotal = () => (settlementTotalAmount !== undefined && settlementTotalAmount > 0) ? settlementTotalAmount : overallSettlementsTotal;
  const getEmployeeDepositsTotal = () => (employeeDepositsTotalAmount !== undefined && employeeDepositsTotalAmount > 0) ? employeeDepositsTotalAmount : overallDepositsTotal;

  const formatIndianCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTotalLabel = (tab: string) => {
    switch (tab) {
      case 'Meter Reading':
        return 'Total Sale Amount';
      case 'Credit Sales':
        return 'Total Credit Sales';
      case 'Own Use':
        return 'Total Own Use';
      case 'Settlements':
        return 'Total Settlements';
      case 'Employee Deposits':
        return 'Total Employee Deposits';
      case 'Summary':
        return 'Grand Total';
      default:
        return 'Total';
    }
  };

  const getTotalAmount = (tab: string) => {
    switch (tab) {
      case 'Meter Reading':
        return getMeterReadingTotal();
      case 'Credit Sales':
        return getCreditSalesTotal();
      case 'Own Use':
        return getOwnUseTotal();
      case 'Settlements':
        return getSettlementsTotal();
      case 'Employee Deposits':
        return getEmployeeDepositsTotal();
      default:
        return 0;
    }
  };

  const getTotalColor = (tab: string) => {
    switch (tab) {
      case 'Meter Reading':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Credit Sales':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'Own Use':
        return 'bg-cyan-50 border-cyan-200 text-cyan-700';
      case 'Settlements':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'Employee Deposits':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
      {/* Subtabs - Underline Style */}
      <TabsList className="w-full justify-start bg-transparent h-auto p-0 border-b rounded-none gap-6 px-2">
        {subTabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="relative pb-3 pt-2 px-1 bg-transparent border-0 rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary data-[state=active]:after:rounded-full"
          >
            <div className="flex flex-col items-start gap-1">
              <span>{tab}</span>
              {tab !== 'Summary' && (
                <span className={`text-xs font-normal ${activeTab === tab ? 'text-primary/80' : 'text-muted-foreground/70'
                  }`}>
                  {formatIndianCurrency(getTotalAmount(tab))}
                </span>
              )}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="Meter Reading" className="mt-6" forceMount hidden={activeTab !== 'Meter Reading'}>
        <MeterReadingTable
          mpdName={resolvedMpdName}
          mpd={mpd}
          selectedDate={selectedDate}
          scopeMode={scopeMode}
          rateMaster={rateMaster}
          onTotalSalesChange={setMeterReadingTotalSales}
          onFuelSalesSummaryChange={setFuelSalesSummary}
          onShiftChange={setCurrentShift}
        />
      </TabsContent>

      <TabsContent value="Credit Sales" className="mt-6" forceMount hidden={activeTab !== 'Credit Sales'}>
        <CreditSalesTab
          mpdName={resolvedMpdName}
          selectedDate={selectedDate}
          selectedShift={currentShift || activeShiftName}
          scopeMode={scopeMode}
          onTotalChange={setCreditSalesTotalAmount}
        />
      </TabsContent>

      <TabsContent value="Own Use" className="mt-6" forceMount hidden={activeTab !== 'Own Use'}>
        <OwnUseTab
          mpdName={resolvedMpdName}
          selectedDate={selectedDate}
          selectedShift={currentShift || activeShiftName}
          scopeMode={scopeMode}
          onTotalChange={setOwnUseTotalAmount}
        />
      </TabsContent>

      <TabsContent value="Settlements" className="mt-6" forceMount hidden={activeTab !== 'Settlements'}>
        <SettlementsTab
          mpdName={resolvedMpdName}
          selectedDate={selectedDate}
          selectedShift={currentShift || activeShiftName}
          scopeMode={scopeMode}
          onTotalChange={setSettlementTotalAmount}
        />
      </TabsContent>

      <TabsContent value="Employee Deposits" className="mt-6" forceMount hidden={activeTab !== 'Employee Deposits'}>
        <EmployeeDepositsTab
          mpdName={resolvedMpdName}
          selectedDate={selectedDate}
          selectedShift={currentShift || activeShiftName}
          scopeMode={scopeMode}
          onTotalChange={setEmployeeDepositsTotalAmount}
        />
      </TabsContent>

      <TabsContent value="Summary" className="mt-6" forceMount hidden={activeTab !== 'Summary'}>
        <MPDSummaryTab
          resolvedMpdName={resolvedMpdName}
          mpd={mpd}
          selectedDate={selectedDate}
          selectedShift={currentShift || activeShiftName}
          productWiseSales={fuelSalesSummary}
          rateMaster={rateMaster}
          meterReadingTotal={getMeterReadingTotal()}
          creditSalesTotal={getCreditSalesTotal()}
          ownUseTotal={getOwnUseTotal()}
          settlementsTotal={getSettlementsTotal()}
          employeeDepositsTotal={getEmployeeDepositsTotal()}
        />
      </TabsContent>
    </Tabs>
  );
}

interface MPDSummaryTabProps {
  resolvedMpdName: string;
  mpd?: MPD;
  selectedDate?: string;
  selectedShift?: string;
  meterReadingTotal: number;
  creditSalesTotal: number;
  ownUseTotal: number;
  settlementsTotal: number;
  employeeDepositsTotal: number;
  productWiseSales?: Array<{ product: string; units: number; rate: number; amount: number }>;
  rateMaster?: Record<string, number>;
}

function MPDSummaryTab({
  resolvedMpdName,
  mpd,
  selectedDate,
  selectedShift,
  meterReadingTotal,
  creditSalesTotal,
  ownUseTotal,
  settlementsTotal,
  employeeDepositsTotal,
  productWiseSales = [],
  rateMaster = {}
}: MPDSummaryTabProps) {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loadingEmps, setLoadingEmps] = React.useState(false);
  const [assignedDutyStaff, setAssignedDutyStaff] = React.useState<Array<{ id: string; name: string; nozzleName?: string }>>([]);
  const [summaryViewMode, setSummaryViewMode] = React.useState<'shift' | 'cumulative'>('shift');

  const [employeeShortage, setEmployeeShortage] = React.useState('0');
  const [shortageItems, setShortageItems] = React.useState<Array<{
    employeeId: string;
    employeeName: string;
    shortageAction: 'Salary Deduction' | 'Station Expense' | 'Cash Recovery';
    shortageReason: string;
    amount: string;
  }>>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState('');
  const [shortageAction, setShortageAction] = React.useState<'Salary Deduction' | 'Station Expense' | 'Cash Recovery'>('Salary Deduction');
  const [shortageReason, setShortageReason] = React.useState('');
  const [roundUp, setRoundUp] = React.useState('0.00');
  const [savingReconciliation, setSavingReconciliation] = React.useState(false);
  const [showShortageModal, setShowShortageModal] = React.useState(false);

  const targetDate = selectedDate || new Date().toISOString().slice(0, 10);
  const targetShift = selectedShift || 'Shift 1';

  // Load all active employees
  React.useEffect(() => {
    let isMounted = true;
    setLoadingEmps(true);
    fetchEmployees({ size: 1000, status: 'Active' })
      .then((res) => {
        if (isMounted && res.content) {
          setEmployees(res.content);
        }
      })
      .catch((err) => console.error('Failed to load active employees for shortage link:', err))
      .finally(() => {
        if (isMounted) setLoadingEmps(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Fetch Duty Assignments for targetDate + targetShift + MPD
  React.useEffect(() => {
    let isMounted = true;
    if (targetDate && targetShift) {
      const derivedShiftId = (() => {
        const match = targetShift.match(/\b([1-9])\b/);
        if (match) return match[1];
        const norm = targetShift.toLowerCase();
        if (norm.includes('morning')) return '1';
        if (norm.includes('evening') || norm.includes('afternoon')) return '2';
        if (norm.includes('night')) return '3';
        return '1';
      })();

      fetchEmployeeAssignments(targetDate, derivedShiftId)
        .then(assignments => {
          if (isMounted && assignments && assignments.length > 0) {
            const mpdStaffList: Array<{ id: string; name: string; nozzleName?: string }> = [];
            assignments.forEach(a => {
              const matchedMpd = a.nozzle?.mpd?.name || (mpd ? mpd.name : '');
              if (matchedMpd === resolvedMpdName && a.employee) {
                if (!mpdStaffList.some(s => s.id === String(a.employee?.id))) {
                  mpdStaffList.push({
                    id: String(a.employee.id),
                    name: a.employee.name,
                    nozzleName: a.nozzle?.nozzleName
                  });
                }
              }
            });
            setAssignedDutyStaff(mpdStaffList);
          } else if (isMounted) {
            setAssignedDutyStaff([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch employee assignments for MPD summary duty link:', err);
          if (isMounted) setAssignedDutyStaff([]);
        });
    }
    return () => { isMounted = false; };
  }, [targetDate, targetShift, resolvedMpdName, mpd]);

  // Fetch existing saved reconciliation summary from backend for Date + Shift + MPD
  React.useEffect(() => {
    let isMounted = true;
    if (targetDate && targetShift && resolvedMpdName) {
      fetchExistingMpdReconciliation(targetDate, targetShift, resolvedMpdName)
        .then(rec => {
          if (isMounted) {
            if (rec) {
              setEmployeeShortage(rec.employeeShortage != null ? String(rec.employeeShortage) : '0');
              setSelectedEmployeeId(rec.employeeId != null ? String(rec.employeeId) : '');
              setShortageAction((rec.shortageAction as any) || 'Salary Deduction');
              setShortageReason(rec.shortageReason || '');
              setRoundUp(rec.roundUp != null ? parseFloat(String(rec.roundUp)).toFixed(2) : '0.00');

              if (rec.items && rec.items.length > 0) {
                setShortageItems(rec.items.map(item => ({
                  employeeId: item.employeeId != null ? String(item.employeeId) : '',
                  employeeName: item.employeeName || '',
                  shortageAction: (item.shortageAction as any) || 'Salary Deduction',
                  shortageReason: item.shortageReason || '',
                  amount: item.amount != null ? String(item.amount) : '0'
                })));
              } else if (rec.employeeShortage && rec.employeeShortage > 0 && rec.employeeId) {
                setShortageItems([{
                  employeeId: String(rec.employeeId),
                  employeeName: rec.employeeName || '',
                  shortageAction: (rec.shortageAction as any) || 'Salary Deduction',
                  shortageReason: rec.shortageReason || '',
                  amount: String(rec.employeeShortage)
                }]);
              } else {
                setShortageItems([]);
              }
            } else {
              setEmployeeShortage('0');
              setSelectedEmployeeId('');
              setShortageAction('Salary Deduction');
              setShortageReason('');
              setRoundUp('0.00');
              setShortageItems([]);
            }
          }
        })
        .catch(err => console.error('Failed to load existing MPD reconciliation:', err));
    }
    return () => { isMounted = false; };
  }, [targetDate, targetShift, resolvedMpdName]);

  // ── Shortage items modal state & pagination ──
  const [shortageCurrentPage, setShortageCurrentPage] = React.useState(0);
  const SHORTAGE_PAGE_SIZE = 5;

  // Sum of ALL shortage items (Paid + Pending) for summary modal
  const totalShortageAmount = React.useMemo(() => {
    return shortageItems.reduce((sum, item) => sum + (parseFloat(item.amount || '0') || 0), 0);
  }, [shortageItems]);

  // Sum of ONLY Paid / Recovered shortage items (contributes to live shift cash balance)
  const paidShortageSum = React.useMemo(() => {
    return shortageItems.reduce((sum, item) => {
      const st = item.status || 'Paid';
      if (st === 'Paid') {
        return sum + (parseFloat(item.amount || '0') || 0);
      }
      return sum;
    }, 0);
  }, [shortageItems]);

  const shortageVal = shortageItems.length > 0 ? paidShortageSum : (parseFloat(employeeShortage || '0') || 0);
  const roundUpVal = parseFloat(roundUp || '0') || 0;
  const balance = meterReadingTotal - creditSalesTotal - ownUseTotal - settlementsTotal - employeeDepositsTotal + shortageVal + roundUpVal;

  const handleAddShortageItem = () => {
    const defaultEmp = assignedDutyStaff.length > 0 ? assignedDutyStaff[0] : (employees.length > 0 ? employees[0] : null);
    const deficit = balance < 0 ? Math.abs(balance) : 0;
    const initialAmt = shortageItems.length === 0 && deficit > 0 ? String(deficit.toFixed(2)).replace(/\.00$/, '') : '';

    setShortageItems(prev => [
      ...prev,
      {
        employeeId: defaultEmp ? String(defaultEmp.id) : '',
        employeeName: defaultEmp ? defaultEmp.name : '',
        shortageAction: 'Salary Deduction',
        shortageReason: '',
        status: 'Paid',
        amount: initialAmt
      }
    ]);
  };

  const handleRemoveShortageItem = (index: number) => {
    setShortageItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setEmployeeShortage('0');
        setSelectedEmployeeId('');
        setShortageReason('');
      }
      return updated;
    });
  };

  const handleUpdateShortageItem = (index: number, field: string, value: any) => {
    setShortageItems(prev => {
      const copy = [...prev];
      const target = { ...copy[index] };
      if (field === 'employeeId') {
        target.employeeId = value;
        const matchedEmp = employees.find(e => String(e.id) === String(value));
        const matchedDuty = assignedDutyStaff.find(s => String(s.id) === String(value));
        target.employeeName = matchedDuty ? matchedDuty.name : (matchedEmp ? matchedEmp.name : '');
      } else {
        (target as any)[field] = value;
      }
      copy[index] = target;
      return copy;
    });
  };

  // Dynamically map fuel products connected to this specific MPD only (Fuel only)
  const displayProductWise = React.useMemo(() => {
    const connectedProducts: string[] = [];
    if (mpd && mpd.nozzles && mpd.nozzles.length > 0) {
      mpd.nozzles.forEach((n: any) => {
        const ft = n.fuelType || 'Petrol';
        if (!connectedProducts.includes(ft)) {
          connectedProducts.push(ft);
        }
      });
    } else {
      connectedProducts.push('Petrol', 'Diesel');
    }

    const result: Array<{ product: string; units: number; rate: number; amount: number }> = [];

    connectedProducts.forEach(prod => {
      const match = productWiseSales.find(p => p.product.toLowerCase() === prod.toLowerCase());
      if (match) {
        result.push(match);
      } else {
        const r = getFuelRate(prod, rateMaster);
        result.push({
          product: prod,
          units: 0.00,
          rate: r,
          amount: 0.00
        });
      }
    });

    return result;
  }, [mpd, productWiseSales, rateMaster]);

  const handleSaveAttribution = async () => {
    if (shortageVal > 0 && shortageItems.length === 0 && !selectedEmployeeId) {
      toast.error('Please select the employee responsible for the shortage.');
      return;
    }

    try {
      setSavingReconciliation(true);

      const itemsPayload: MpdReconciliationItem[] = shortageItems.map(item => ({
        employeeId: item.employeeId ? parseInt(item.employeeId, 10) : undefined,
        employeeName: item.employeeName || employees.find(e => String(e.id) === item.employeeId)?.name,
        shortageAction: item.shortageAction,
        shortageReason: item.shortageReason,
        amount: parseFloat(item.amount || '0') || 0
      }));

      const primaryEmp = shortageItems.length > 0
        ? employees.find(e => String(e.id) === shortageItems[0]?.employeeId)
        : (selectedEmployeeId ? employees.find(e => String(e.id) === selectedEmployeeId) : undefined);

      const payload: MpdReconciliationRecord = {
        date: targetDate,
        shiftName: targetShift,
        mpdName: resolvedMpdName,
        employeeShortage: shortageItems.length > 0 ? shortageVal : (parseFloat(employeeShortage || '0') || 0),
        employeeId: primaryEmp ? parseInt(String(primaryEmp.id), 10) : undefined,
        employeeName: primaryEmp?.name || undefined,
        shortageAction: shortageItems.length > 0 ? shortageItems[0]?.shortageAction : shortageAction,
        shortageReason: shortageItems.length > 0 ? shortageItems[0]?.shortageReason : shortageReason,
        items: itemsPayload,
        roundUp: roundUpVal
      };

      await saveMpdReconciliationApi(payload);

      toast.success(`Reconciliation summary saved for ${resolvedMpdName} (${targetShift})!`);
    } catch (err: any) {
      console.error('Failed to save reconciliation summary:', err);
      toast.error(err?.message || 'Failed to save reconciliation summary');
    } finally {
      setSavingReconciliation(false);
    }
  };

  const getProductBadgeStyle = (prodName: string) => {
    const norm = prodName.toLowerCase();
    if (norm.includes('diesel')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (norm.includes('petrol') || norm.includes('power') || norm.includes('ms') || norm.includes('speed')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-sky-100 text-sky-800 border-sky-200';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            Summary - {resolvedMpdName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Shift closing balance and employee shortage attribution.
          </p>
        </div>
      </div>

      {/* Meter Reading - Product Wise */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b flex items-center justify-between">
          <h3 className="font-semibold text-blue-800">Meter Reading Sales</h3>
          <span className="text-sm font-semibold text-blue-700">{formatIndianCurrency(meterReadingTotal)}</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-right">Quantity (L)</th>
              <th className="px-4 py-2 text-right">Rate (₹/L)</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayProductWise.map((row) => (
              <tr key={row.product} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-sm font-medium">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getProductBadgeStyle(row.product)}`}>
                    {row.product}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-right font-mono">{row.units.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-sm text-right font-mono">₹{row.rate.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium font-mono">{formatIndianCurrency(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deductions */}
      {(() => {
        const totalDeductions = creditSalesTotal + ownUseTotal + settlementsTotal + employeeDepositsTotal;
        return (
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
              <h3 className="font-semibold text-muted-foreground">Deductions & Cash Collections</h3>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                Total Deductions: {formatIndianCurrency(totalDeductions)}
              </span>
            </div>
            <div className="divide-y">
              {[
                { label: 'Credit Sales', amount: creditSalesTotal, color: 'text-indigo-600' },
                { label: 'Own Use', amount: ownUseTotal, color: 'text-cyan-600' },
                { label: 'Settlements', amount: settlementsTotal, color: 'text-green-600' },
                { label: 'Employee Deposits', amount: employeeDepositsTotal, color: 'text-purple-600' },
              ].map(({ label, amount, color }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Less: {label}</span>
                  <span className={`text-sm font-medium ${color}`}>− {formatIndianCurrency(amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/60 font-semibold border-t">
                <span className="text-sm text-foreground font-semibold">Total Deductions &amp; Handover</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                  − {formatIndianCurrency(totalDeductions)}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Employee Shortages & Shift Adjustments Section */}
      <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-card space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b">
          <h4 className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 tracking-wide flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            Employee Shortages &amp; Adjustments
          </h4>
        </div>

        {/* Compact Action Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 dark:bg-slate-900/40 border rounded-lg">
          {/* Employee Shortage Box */}
          <div className="flex items-center justify-between p-2.5 bg-background border border-amber-200/80 rounded-md">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Employee Shortage</p>
              <p className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                {formatIndianCurrency(shortageVal)}
                {shortageItems.length > 0 && (
                  <span className="text-[10px] font-normal text-muted-foreground ml-1.5">
                    ({shortageItems.length} {shortageItems.length === 1 ? 'entry' : 'entries'})
                  </span>
                )}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowShortageModal(true)}
              className="h-8 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-medium gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              {shortageVal > 0 ? 'Edit Shortages' : 'Add Shortage'}
            </Button>
          </div>

          {/* Shift Round Off Box with Inline Input */}
          <div className="flex items-center justify-between p-2.5 bg-background border border-blue-200/80 rounded-md gap-3">
            <div>
              <Label htmlFor="mpd-round-up-inline" className="text-[11px] font-semibold text-muted-foreground uppercase cursor-pointer">
                Shift Round Off (₹)
              </Label>
              <p className="text-xs text-muted-foreground hidden sm:block">Adjustment for net balance</p>
            </div>
            <Input
              id="mpd-round-up-inline"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={roundUp}
              onChange={(e) => setRoundUp(e.target.value)}
              onBlur={() => {
                const num = parseFloat(roundUp);
                setRoundUp(isNaN(num) ? '0.00' : num.toFixed(2));
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className="h-8 w-28 text-xs font-semibold font-mono text-right border-blue-300 focus:border-blue-500 shrink-0"
            />
          </div>
        </div>
      </div>

      {/* ── Employee Shortages Modal ── */}
      <Dialog open={showShortageModal} onOpenChange={setShowShortageModal}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <SlidersHorizontal className="w-5 h-5 text-amber-600 shrink-0" />
              Employee Shortages Management
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record shift shortage entries, assign responsible duty staff, and specify recovery methods.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Total Summary Header Card */}
            <div className="flex items-center justify-between p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Total Employee Shortage Amount</span>
                <p className="text-muted-foreground text-[11px]">
                  Sum: <span className="font-semibold text-amber-900">{formatIndianCurrency(totalShortageAmount)}</span>
                  {shortageItems.length > 0 && (
                    <span className="ml-2 text-emerald-700 font-semibold">
                      (Paid/Added to Cash Bal: {formatIndianCurrency(paidShortageSum)})
                    </span>
                  )}
                </p>
              </div>
              <span className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300">
                {formatIndianCurrency(totalShortageAmount)}
              </span>
            </div>

            {/* Itemized Entries List with Pagination */}
            {shortageItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
                <User className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium mb-3">No employee shortage entries added yet.</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddShortageItem}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Shortage Entry
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {shortageItems
                  .slice(shortageCurrentPage * SHORTAGE_PAGE_SIZE, (shortageCurrentPage + 1) * SHORTAGE_PAGE_SIZE)
                  .map((item, pageIdx) => {
                    const idx = shortageCurrentPage * SHORTAGE_PAGE_SIZE + pageIdx;
                    return (
                      <div key={idx} className="p-3 bg-card border rounded-lg space-y-3 text-xs shadow-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          {/* Staff Select (3 cols) */}
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground">Staff Name</Label>
                            <Select
                              value={item.employeeId}
                              onValueChange={(val) => handleUpdateShortageItem(idx, 'employeeId', val)}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select Staff" />
                              </SelectTrigger>
                              <SelectContent>
                                {assignedDutyStaff.length > 0 && (
                                  <div className="px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border-b uppercase">
                                    Assigned Shift Staff
                                  </div>
                                )}
                                {assignedDutyStaff.map(s => (
                                  <SelectItem key={`assigned-${s.id}`} value={s.id} className="font-semibold text-indigo-900">
                                    ⭐ {s.name} {s.nozzleName ? `(${s.nozzleName})` : ''}
                                  </SelectItem>
                                ))}
                                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground bg-muted border-b border-t uppercase">
                                  All Active Employees
                                </div>
                                {employees.map(emp => (
                                  <SelectItem key={emp.id} value={String(emp.id)}>
                                    {emp.name} ({emp.employeeCode || `EMP-${emp.id}`})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Recovery Action (3 cols) */}
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground">Recovery Method</Label>
                            <Select
                              value={item.shortageAction || 'Salary Deduction'}
                              onValueChange={(val: any) => handleUpdateShortageItem(idx, 'shortageAction', val)}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Salary Deduction">Salary Deduction (Payroll)</SelectItem>
                                <SelectItem value="Station Expense">Station Expense (Write-off)</SelectItem>
                                <SelectItem value="Cash Recovery">Immediate Cash Recovery</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Status Field: Paid / Pending (2 cols) */}
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                              Status
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                (item.status || 'Paid') === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {(item.status || 'Paid') === 'Paid' ? 'Add Bal' : 'No Bal'}
                              </span>
                            </Label>
                            <Select
                              value={item.status || 'Paid'}
                              onValueChange={(val: any) => handleUpdateShortageItem(idx, 'status', val)}
                            >
                              <SelectTrigger className="h-9 text-xs font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Paid" className="text-emerald-700 font-semibold">Paid (Add to Bal)</SelectItem>
                                <SelectItem value="Pending" className="text-amber-700 font-semibold">Pending (Hold Bal)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Reason (2 cols) */}
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground">Remarks</Label>
                            <Input
                              placeholder="Reason..."
                              value={item.shortageReason || ''}
                              onChange={(e) => handleUpdateShortageItem(idx, 'shortageReason', e.target.value)}
                              className="h-9 text-xs"
                            />
                          </div>

                          {/* Amount & Delete (2 cols) */}
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] font-semibold text-foreground">Amount (₹)</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.amount === '0' ? '' : item.amount}
                                onChange={(e) => handleUpdateShortageItem(idx, 'amount', e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="h-9 text-xs font-semibold font-mono text-right border-amber-300 focus-visible:ring-amber-500 bg-amber-50/50"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveShortageItem(idx)}
                                title="Remove Entry"
                                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Modal Pagination Controls */}
                {shortageItems.length > SHORTAGE_PAGE_SIZE && (
                  <div className="flex items-center justify-between px-2 py-2 border-t text-xs">
                    <span className="text-muted-foreground font-medium">
                      Showing {shortageCurrentPage * SHORTAGE_PAGE_SIZE + 1} to {Math.min((shortageCurrentPage + 1) * SHORTAGE_PAGE_SIZE, shortageItems.length)} of {shortageItems.length} entries
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={shortageCurrentPage === 0}
                        onClick={() => setShortageCurrentPage(p => Math.max(0, p - 1))}
                        className="h-7 text-xs px-2.5"
                      >
                        Previous
                      </Button>
                      <span className="text-xs font-semibold px-2">
                        Page {shortageCurrentPage + 1} of {Math.ceil(shortageItems.length / SHORTAGE_PAGE_SIZE)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={shortageCurrentPage >= Math.ceil(shortageItems.length / SHORTAGE_PAGE_SIZE) - 1}
                        onClick={() => setShortageCurrentPage(p => p + 1)}
                        className="h-7 text-xs px-2.5"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddShortageItem}
                  className="w-full h-9 text-xs bg-amber-50/50 hover:bg-amber-100/80 text-amber-900 border-amber-200 font-semibold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" /> Add Another Shortage Entry
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              onClick={() => setShowShortageModal(false)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-5 h-9"
            >
              Done / Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Save Reconciliation Summary Bar (Clean Light Theme) */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg gap-3 text-xs">
        <span className="text-muted-foreground">
          Save reconciliation for <span className="font-semibold text-slate-700 dark:text-slate-300">{resolvedMpdName} ({targetShift})</span>
        </span>
        <Button
          type="button"
          disabled={savingReconciliation}
          onClick={handleSaveAttribution}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 h-8 text-xs shrink-0 rounded-md shadow-xs"
        >
          {savingReconciliation ? 'Saving Records...' : 'Save Records'}
        </Button>
      </div>

      {/* Balance */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-lg border-2 ${balance >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
        <span className="font-semibold text-base">Balance Amount - {resolvedMpdName}</span>
        <span className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          {formatIndianCurrency(balance)}
        </span>
      </div>
    </div>
  );
}

interface OilSaleItem {
  description: string;
  hsnCode: string;
  unit: string;
  quantity: number;
  rate: number;
  discountPct: number;
  discountRs: number;
  subtotal: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalValue: number;
}

interface OilSaleRecord {
  id: string;
  voucherNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  billingAddress: string;
  shippingAddress: string;
  customerGSTIN: string;
  taxpayerGSTIN: string;
  taxpayerName: string;
  taxpayerAddress: string;
  placeOfSupply: string;
  isInterState: boolean;
  items: OilSaleItem[];
  totalSubtotal: number;
  totalDiscount: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  grandTotal: number;
  paymentMode: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  dueDate: string;
  termsAndConditions: string;
  notes: string;
}

const emptyOilItem = (): OilSaleItem => ({
  description: '',
  hsnCode: '',
  unit: 'Nos',
  quantity: 0,
  rate: 0,
  discountPct: 0,
  discountRs: 0,
  subtotal: 0,
  taxableValue: 0,
  gstRate: 18,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalValue: 0,
});

const DEFAULT_TERMS = `1. Goods once sold will not be taken back or exchanged.
2. Interest @ 18% p.a. will be charged on overdue payments.
3. All disputes are subject to local jurisdiction only.
4. E. & O.E. (Errors and Omissions Excepted).
5. This is a computer-generated invoice and does not require a signature.`;

const mockOilSaleRecords: OilSaleRecord[] = [
  {
    id: 'OIL-2024-001',
    voucherNumber: 'VCH/OIL/2024/001',
    invoiceNumber: 'INV/OIL/2024/001',
    invoiceDate: '2024-03-20',
    customerName: 'Sharma Transport Pvt. Ltd.',
    billingAddress: '12, Industrial Area, Pune, Maharashtra - 411001',
    shippingAddress: '12, Industrial Area, Pune, Maharashtra - 411001',
    customerGSTIN: '27AABCS1234A1Z5',
    taxpayerGSTIN: '27XYZFS9876B1Z1',
    taxpayerName: 'Fuel Pro Petroleum Pvt. Ltd.',
    taxpayerAddress: 'Plot No. 5, Highway Road, Pune, Maharashtra - 411002',
    placeOfSupply: 'Maharashtra',
    isInterState: false,
    items: [
      { description: 'Engine Oil 20W-50 (5L)', hsnCode: '27101980', unit: 'Nos', quantity: 10, rate: 850, discountPct: 0, discountRs: 0, subtotal: 8500, taxableValue: 8500, gstRate: 18, cgst: 765, sgst: 765, igst: 0, totalValue: 10030 },
      { description: 'Gear Oil EP-90 (1L)', hsnCode: '27101980', unit: 'Nos', quantity: 5, rate: 320, discountPct: 0, discountRs: 0, subtotal: 1600, taxableValue: 1600, gstRate: 18, cgst: 144, sgst: 144, igst: 0, totalValue: 1888 },
    ],
    totalSubtotal: 10100, totalDiscount: 0, totalTaxableValue: 10100, totalCGST: 909, totalSGST: 909, totalIGST: 0, grandTotal: 11918,
    paymentMode: 'NEFT', bankName: 'State Bank of India', accountNo: '1234567890', ifscCode: 'SBIN0001234', branch: 'Pune Main', dueDate: '2024-04-20',
    termsAndConditions: DEFAULT_TERMS, notes: '',
  },
  {
    id: 'OIL-2024-002',
    voucherNumber: 'VCH/OIL/2024/002',
    invoiceNumber: 'INV/OIL/2024/002',
    invoiceDate: '2024-03-21',
    customerName: 'Patel Industries',
    billingAddress: '45, MIDC, Nashik, Maharashtra - 422010',
    shippingAddress: '45, MIDC, Nashik, Maharashtra - 422010',
    customerGSTIN: '',
    taxpayerGSTIN: '27XYZFS9876B1Z1',
    taxpayerName: 'Fuel Pro Petroleum Pvt. Ltd.',
    taxpayerAddress: 'Plot No. 5, Highway Road, Pune, Maharashtra - 411002',
    placeOfSupply: 'Maharashtra',
    isInterState: false,
    items: [
      { description: 'Brake Fluid DOT 4 (500ml)', hsnCode: '38199000', unit: 'Nos', quantity: 20, rate: 180, discountPct: 5, discountRs: 180, subtotal: 3600, taxableValue: 3420, gstRate: 28, cgst: 478.80, sgst: 478.80, igst: 0, totalValue: 4377.60 },
    ],
    totalSubtotal: 3600, totalDiscount: 180, totalTaxableValue: 3420, totalCGST: 478.80, totalSGST: 478.80, totalIGST: 0, grandTotal: 4377.60,
    paymentMode: 'Cash', bankName: '', accountNo: '', ifscCode: '', branch: '', dueDate: '2024-03-21',
    termsAndConditions: DEFAULT_TERMS, notes: 'Cash payment received in full.',
  },
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const unitOptions = ['Nos', 'Litre', 'Kg', 'Gram', 'Metre', 'Box', 'Piece', 'Set', 'Dozen', 'Pack'];
const gstRateOptions = [0, 5, 12, 18, 28];
const paymentModeOptions = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Credit'];

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const numToWords = (n: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const toWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + toWords(num % 100);
    if (num < 100000) return toWords(Math.floor(num / 1000)) + 'Thousand ' + toWords(num % 1000);
    if (num < 10000000) return toWords(Math.floor(num / 100000)) + 'Lakh ' + toWords(num % 100000);
    return toWords(Math.floor(num / 10000000)) + 'Crore ' + toWords(num % 10000000);
  };
  const integer = Math.floor(n);
  const decimal = Math.round((n - integer) * 100);
  let result = toWords(integer).trim() + ' Rupees';
  if (decimal > 0) result += ' and ' + toWords(decimal).trim() + ' Paise';
  return result + ' Only';
};

function computeOilItem(item: OilSaleItem, isInterState: boolean): OilSaleItem {
  const subtotal = item.quantity * item.rate;
  const discountRs = (subtotal * item.discountPct) / 100;
  const taxableValue = subtotal - discountRs;
  const gstAmt = (taxableValue * item.gstRate) / 100;
  const cgst = isInterState ? 0 : gstAmt / 2;
  const sgst = isInterState ? 0 : gstAmt / 2;
  const igst = isInterState ? gstAmt : 0;
  return { ...item, subtotal, discountRs, taxableValue, cgst, sgst, igst, totalValue: taxableValue + gstAmt };
}

function buildGSTBifurcation(items: OilSaleItem[], isInterState: boolean) {
  const map: Record<number, { taxable: number; cgst: number; sgst: number; igst: number }> = {};
  items.forEach(item => {
    if (!map[item.gstRate]) map[item.gstRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    map[item.gstRate].taxable += item.taxableValue;
    map[item.gstRate].cgst += item.cgst;
    map[item.gstRate].sgst += item.sgst;
    map[item.gstRate].igst += item.igst;
  });
  return Object.entries(map).map(([rate, vals]) => ({ rate: Number(rate), ...vals, isInterState }));
}

function printOilInvoice(rec: OilSaleRecord) {
  const bifurcation = buildGSTBifurcation(rec.items, rec.isInterState);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${rec.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; }
  .invoice { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #1a56db; padding-bottom: 8px; }
  .company-name { font-size: 18px; font-weight: 700; color: #1a56db; }
  .company-sub { font-size: 10px; color: #555; margin-top: 2px; }
  .invoice-title { text-align: right; }
  .invoice-title h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a56db; }
  .invoice-title p { font-size: 10px; color: #555; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #ddd; margin-bottom: 8px; }
  .meta-cell { padding: 6px 10px; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd; }
  .meta-cell:nth-child(even) { border-right: none; }
  .meta-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-value { font-size: 11px; font-weight: 600; margin-top: 1px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .party-box { border: 1px solid #ddd; padding: 8px; }
  .party-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 4px; font-weight: 600; }
  .party-name { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
  .party-detail { font-size: 10px; color: #444; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
  th { background: #1a56db; color: #fff; padding: 5px 6px; text-align: right; font-weight: 600; font-size: 9px; text-transform: uppercase; }
  th:first-child, th:nth-child(2), th:nth-child(3) { text-align: left; }
  td { padding: 5px 6px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; }
  td:first-child, td:nth-child(2), td:nth-child(3) { text-align: left; }
  tr:nth-child(even) td { background: #f9fafb; }
  .tfoot-row td { border-top: 2px solid #1a56db; font-weight: 700; background: #eff6ff; }
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .bifurcation table th { background: #374151; }
  .totals-table { width: 100%; }
  .totals-table td { padding: 3px 8px; font-size: 11px; }
  .totals-table .label { text-align: left; color: #555; }
  .totals-table .value { text-align: right; font-weight: 600; }
  .grand-total td { border-top: 2px solid #1a56db; font-size: 13px; font-weight: 700; color: #1a56db; background: #eff6ff; }
  .amount-words { font-style: italic; font-size: 10px; color: #444; padding: 6px 8px; background: #f3f4f6; border: 1px solid #e5e7eb; margin-bottom: 8px; }
  .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #1a56db; margin-bottom: 4px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  .terms { font-size: 9px; color: #555; line-height: 1.6; white-space: pre-line; }
  .payment-box { font-size: 10px; }
  .payment-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid #f0f0f0; }
  .payment-label { color: #666; }
  .signature-area { margin-top: 12px; text-align: right; }
  .signature-line { border-top: 1px solid #999; width: 160px; margin-left: auto; margin-bottom: 4px; }
  .signature-text { font-size: 10px; color: #555; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style></head><body><div class="invoice">
  <div class="header">
    <div>
      <div class="company-name">${rec.taxpayerName}</div>
      <div class="company-sub">${rec.taxpayerAddress}</div>
      <div class="company-sub">GSTIN: ${rec.taxpayerGSTIN}</div>
    </div>
    <div class="invoice-title">
      <h2>Tax Invoice</h2>
      <p>Oil & Lubricant Sale</p>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-cell"><div class="meta-label">Voucher No.</div><div class="meta-value">${rec.voucherNumber}</div></div>
    <div class="meta-cell"><div class="meta-label">Invoice No.</div><div class="meta-value">${rec.invoiceNumber}</div></div>
    <div class="meta-cell"><div class="meta-label">Invoice Date</div><div class="meta-value">${new Date(rec.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
    <div class="meta-cell"><div class="meta-label">Place of Supply</div><div class="meta-value">${rec.placeOfSupply}</div></div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">Bill To</div>
      <div class="party-name">${rec.customerName}</div>
      <div class="party-detail">${rec.billingAddress}</div>
      <div class="party-detail" style="margin-top:4px;">GSTIN: ${rec.customerGSTIN || 'Unregistered'}</div>
    </div>
    <div class="party-box">
      <div class="party-label">Ship To</div>
      <div class="party-name">${rec.customerName}</div>
      <div class="party-detail">${rec.shippingAddress}</div>
    </div>
  </div>

  <table>
    <thead><tr>
      <th style="width:30px">#</th>
      <th style="width:160px">Description</th>
      <th>HSN/SAC</th>
      <th>Unit</th>
      <th>Qty</th>
      <th>Rate (₹)</th>
      <th>Disc%</th>
      <th>Disc (₹)</th>
      <th>Subtotal</th>
      <th>GST%</th>
      ${rec.isInterState ? '<th>IGST (₹)</th>' : '<th>CGST (₹)</th><th>SGST (₹)</th>'}
      <th>Total (₹)</th>
    </tr></thead>
    <tbody>
      ${rec.items.map((item, i) => `<tr>
        <td>${i + 1}</td>
        <td>${item.description}</td>
        <td>${item.hsnCode}</td>
        <td>${item.unit}</td>
        <td>${item.quantity}</td>
        <td>${item.rate.toFixed(2)}</td>
        <td>${item.discountPct}%</td>
        <td>${item.discountRs.toFixed(2)}</td>
        <td>${item.taxableValue.toFixed(2)}</td>
        <td>${item.gstRate}%</td>
        ${rec.isInterState ? `<td>${item.igst.toFixed(2)}</td>` : `<td>${item.cgst.toFixed(2)}</td><td>${item.sgst.toFixed(2)}</td>`}
        <td>${item.totalValue.toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
    <tfoot><tr class="tfoot-row">
      <td colspan="8" style="text-align:left;font-size:10px;">Total</td>
      <td>${rec.totalTaxableValue.toFixed(2)}</td>
      <td></td>
      ${rec.isInterState ? `<td>${rec.totalIGST.toFixed(2)}</td>` : `<td>${rec.totalCGST.toFixed(2)}</td><td>${rec.totalSGST.toFixed(2)}</td>`}
      <td>${rec.grandTotal.toFixed(2)}</td>
    </tr></tfoot>
  </table>

  <div class="summary-grid">
    <div class="bifurcation">
      <div class="section-title">GST Bifurcation</div>
      <table>
        <thead><tr>
          <th style="text-align:left">GST Rate</th>
          <th>Taxable (₹)</th>
          ${rec.isInterState ? '<th>IGST (₹)</th>' : '<th>CGST (₹)</th><th>SGST (₹)</th>'}
          <th>Total Tax (₹)</th>
        </tr></thead>
        <tbody>
          ${bifurcation.map(b => `<tr>
            <td style="text-align:left">${b.rate}%</td>
            <td>${b.taxable.toFixed(2)}</td>
            ${rec.isInterState ? `<td>${b.igst.toFixed(2)}</td>` : `<td>${b.cgst.toFixed(2)}</td><td>${b.sgst.toFixed(2)}</td>`}
            <td>${(rec.isInterState ? b.igst : b.cgst + b.sgst).toFixed(2)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Amount Summary</div>
      <table class="totals-table">
        <tr><td class="label">Subtotal</td><td class="value">${fmtINR(rec.totalSubtotal)}</td></tr>
        <tr><td class="label">Total Discount</td><td class="value" style="color:#dc2626">- ${fmtINR(rec.totalDiscount)}</td></tr>
        <tr><td class="label">Taxable Value</td><td class="value">${fmtINR(rec.totalTaxableValue)}</td></tr>
        ${rec.isInterState
      ? `<tr><td class="label">IGST</td><td class="value">${fmtINR(rec.totalIGST)}</td></tr>`
      : `<tr><td class="label">CGST</td><td class="value">${fmtINR(rec.totalCGST)}</td></tr><tr><td class="label">SGST</td><td class="value">${fmtINR(rec.totalSGST)}</td></tr>`}
        <tr class="grand-total"><td class="label">Grand Total</td><td class="value">${fmtINR(rec.grandTotal)}</td></tr>
      </table>
    </div>
  </div>

  <div class="amount-words">Amount in Words: <strong>${numToWords(rec.grandTotal)}</strong></div>

  <div class="footer-grid">
    <div>
      <div class="section-title">Payment Details</div>
      <div class="payment-box">
        <div class="payment-row"><span class="payment-label">Mode</span><span>${rec.paymentMode}</span></div>
        ${rec.bankName ? `<div class="payment-row"><span class="payment-label">Bank</span><span>${rec.bankName}</span></div>` : ''}
        ${rec.accountNo ? `<div class="payment-row"><span class="payment-label">Account No.</span><span>${rec.accountNo}</span></div>` : ''}
        ${rec.ifscCode ? `<div class="payment-row"><span class="payment-label">IFSC</span><span>${rec.ifscCode}</span></div>` : ''}
        ${rec.branch ? `<div class="payment-row"><span class="payment-label">Branch</span><span>${rec.branch}</span></div>` : ''}
        ${rec.dueDate ? `<div class="payment-row"><span class="payment-label">Due Date</span><span>${new Date(rec.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
      </div>
    </div>
    <div>
      <div class="section-title">Terms & Conditions</div>
      <div class="terms">${rec.termsAndConditions}</div>
    </div>
  </div>

  ${rec.notes ? `<div style="font-size:10px;color:#555;margin-bottom:8px;"><strong>Notes:</strong> ${rec.notes}</div>` : ''}

  <div class="signature-area">
    <div class="signature-line"></div>
    <div class="signature-text">Authorised Signatory</div>
    <div class="signature-text">${rec.taxpayerName}</div>
  </div>
</div></body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

function exportOilInvoiceCSV(rec: OilSaleRecord) {
  const rows = [
    ['INVOICE DETAILS'],
    ['Voucher No.', rec.voucherNumber, 'Invoice No.', rec.invoiceNumber],
    ['Invoice Date', rec.invoiceDate, 'Place of Supply', rec.placeOfSupply],
    ['Customer', rec.customerName, 'Customer GSTIN', rec.customerGSTIN || 'Unregistered'],
    ['Taxpayer GSTIN', rec.taxpayerGSTIN],
    [],
    ['#', 'Description', 'HSN/SAC', 'Unit', 'Qty', 'Rate', 'Disc%', 'Disc Rs', 'Subtotal', 'GST%', 'CGST', 'SGST', 'IGST', 'Total'],
    ...rec.items.map((item, i) => [i + 1, item.description, item.hsnCode, item.unit, item.quantity, item.rate, item.discountPct, item.discountRs.toFixed(2), item.taxableValue.toFixed(2), item.gstRate, item.cgst.toFixed(2), item.sgst.toFixed(2), item.igst.toFixed(2), item.totalValue.toFixed(2)]),
    [],
    ['', '', '', '', '', '', '', '', 'Subtotal', '', '', '', '', rec.totalSubtotal.toFixed(2)],
    ['', '', '', '', '', '', '', '', 'Total Discount', '', '', '', '', rec.totalDiscount.toFixed(2)],
    ['', '', '', '', '', '', '', '', 'Taxable Value', '', '', '', '', rec.totalTaxableValue.toFixed(2)],
    ['', '', '', '', '', '', '', '', 'CGST', '', rec.totalCGST.toFixed(2), '', '', ''],
    ['', '', '', '', '', '', '', '', 'SGST', '', '', rec.totalSGST.toFixed(2), '', ''],
    ['', '', '', '', '', '', '', '', 'IGST', '', '', '', rec.totalIGST.toFixed(2), ''],
    ['', '', '', '', '', '', '', '', 'Grand Total', '', '', '', '', rec.grandTotal.toFixed(2)],
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${rec.invoiceNumber.replace(/\//g, '-')}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function OilSaleTab() {
  const [records, setRecords] = React.useState<OilSaleRecord[]>(mockOilSaleRecords);
  const [showForm, setShowForm] = React.useState(false);
  const [viewRecord, setViewRecord] = React.useState<OilSaleRecord | null>(null);

  const [form, setForm] = React.useState({
    voucherNumber: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    customerName: '',
    billingAddress: '',
    shippingAddress: '',
    customerGSTIN: '',
    taxpayerGSTIN: '27XYZFS9876B1Z1',
    taxpayerName: 'Fuel Pro Petroleum Pvt. Ltd.',
    taxpayerAddress: 'Plot No. 5, Highway Road, Pune, Maharashtra - 411002',
    placeOfSupply: 'Maharashtra',
    isInterState: false,
    sameAddress: true,
    paymentMode: 'Cash',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    dueDate: '',
    termsAndConditions: DEFAULT_TERMS,
    notes: '',
  });
  const [items, setItems] = React.useState<OilSaleItem[]>([emptyOilItem()]);

  const totals = React.useMemo(() => ({
    subtotal: items.reduce((s, i) => s + i.subtotal, 0),
    discount: items.reduce((s, i) => s + i.discountRs, 0),
    taxable: items.reduce((s, i) => s + i.taxableValue, 0),
    cgst: items.reduce((s, i) => s + i.cgst, 0),
    sgst: items.reduce((s, i) => s + i.sgst, 0),
    igst: items.reduce((s, i) => s + i.igst, 0),
    grand: items.reduce((s, i) => s + i.totalValue, 0),
  }), [items]);

  const bifurcation = React.useMemo(() => buildGSTBifurcation(items, form.isInterState), [items, form.isInterState]);

  const nextSeq = (prefix: string) => {
    const last = records.length + 1;
    return `${prefix}/2024/${String(last).padStart(3, '0')}`;
  };

  const openForm = () => {
    setForm(p => ({ ...p, voucherNumber: nextSeq('VCH/OIL'), invoiceNumber: nextSeq('INV/OIL'), dueDate: '' }));
    setItems([emptyOilItem()]);
    setShowForm(true);
  };

  const updateItem = (idx: number, field: keyof OilSaleItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = computeOilItem({ ...updated[idx], [field]: value }, form.isInterState);
      return updated;
    });
  };

  const handleSave = () => {
    const rec: OilSaleRecord = {
      id: `OIL-2024-${String(records.length + 1).padStart(3, '0')}`,
      ...form,
      shippingAddress: form.sameAddress ? form.billingAddress : form.shippingAddress,
      items,
      totalSubtotal: totals.subtotal,
      totalDiscount: totals.discount,
      totalTaxableValue: totals.taxable,
      totalCGST: totals.cgst,
      totalSGST: totals.sgst,
      totalIGST: totals.igst,
      grandTotal: totals.grand,
    };
    setRecords(prev => [rec, ...prev]);
    setShowForm(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold">Oil & Lubricant Sales</h3>
          <p className="text-sm text-muted-foreground">GST tax invoices for oil and lubricant products</p>
        </div>
        <Button onClick={openForm} className="gap-2"><Plus className="h-4 w-4" />New Invoice</Button>
      </div>

      {/* Records List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Voucher No.</th>
                <th className="px-4 py-3 text-left">Invoice No.</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">GSTIN</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{rec.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">{rec.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">{new Date(rec.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-sm">{rec.customerName}</td>
                  <td className="px-4 py-3 text-xs font-mono">{rec.customerGSTIN || <span className="italic text-muted-foreground">Unregistered</span>}</td>
                  <td className="px-4 py-3 text-sm text-right">{fmtINR(rec.totalSubtotal)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-500">{rec.totalDiscount > 0 ? `- ${fmtINR(rec.totalDiscount)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600">{fmtINR(rec.totalCGST + rec.totalSGST + rec.totalIGST)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{fmtINR(rec.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewRecord(rec)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => printOilInvoice(rec)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600" title="Print / PDF">
                        <Package className="h-4 w-4" />
                      </button>
                      <button onClick={() => exportOilInvoiceCSV(rec)} className="p-1.5 rounded hover:bg-green-50 text-muted-foreground hover:text-green-600" title="Export Excel/CSV">
                        <IndianRupee className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>New Oil & Lubricant Invoice</DialogTitle>
            <DialogDescription>Create a GST-compliant tax invoice as per Indian government norms.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-1 px-1">
            {/* Invoice Header */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Voucher Number</Label>
                <Input value={form.voucherNumber} onChange={e => setForm(p => ({ ...p, voucherNumber: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Number</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Date</Label>
                <Input type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Taxpayer GSTIN</Label>
                <Input value={form.taxpayerGSTIN} onChange={e => setForm(p => ({ ...p, taxpayerGSTIN: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Place of Supply</Label>
                <Select value={form.placeOfSupply} onValueChange={v => setForm(p => ({ ...p, placeOfSupply: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Transaction Type</Label>
                <Select value={form.isInterState ? 'inter' : 'intra'} onValueChange={v => setForm(p => ({ ...p, isInterState: v === 'inter' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intra">Intra-State (CGST + SGST)</SelectItem>
                    <SelectItem value="inter">Inter-State (IGST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Supplier (From)</h4>
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input value={form.taxpayerName} onChange={e => setForm(p => ({ ...p, taxpayerName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Textarea value={form.taxpayerAddress} onChange={e => setForm(p => ({ ...p, taxpayerAddress: e.target.value }))} rows={2} />
                </div>
              </div>
              {/* Customer */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer (To)</h4>
                <div className="space-y-1.5">
                  <Label>Customer Name</Label>
                  <Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Enter customer name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer GSTIN <span className="font-normal text-muted-foreground">(if registered)</span></Label>
                  <Input value={form.customerGSTIN} onChange={e => setForm(p => ({ ...p, customerGSTIN: e.target.value }))} placeholder="e.g. 27AABCS1234A1Z5" className="font-mono text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label>Billing Address</Label>
                  <Textarea value={form.billingAddress} onChange={e => setForm(p => ({ ...p, billingAddress: e.target.value }))} rows={2} placeholder="Billing address" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sameAddrOil" checked={form.sameAddress} onChange={e => setForm(p => ({ ...p, sameAddress: e.target.checked }))} className="h-4 w-4" />
                  <label htmlFor="sameAddrOil" className="text-sm">Shipping address same as billing</label>
                </div>
                {!form.sameAddress && (
                  <div className="space-y-1.5">
                    <Label>Shipping Address</Label>
                    <Textarea value={form.shippingAddress} onChange={e => setForm(p => ({ ...p, shippingAddress: e.target.value }))} rows={2} />
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between">
                <h4 className="font-semibold text-sm">Item Details</h4>
                <Button variant="outline" size="sm" onClick={() => setItems(p => [...p, emptyOilItem()])} className="gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" />Add Item
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b text-muted-foreground">
                      <th className="px-2 py-2 text-left">Description</th>
                      <th className="px-2 py-2 text-left">HSN/SAC</th>
                      <th className="px-2 py-2 text-left">Unit</th>
                      <th className="px-2 py-2 text-right">Qty</th>
                      <th className="px-2 py-2 text-right">Rate (₹)</th>
                      <th className="px-2 py-2 text-right">Disc %</th>
                      <th className="px-2 py-2 text-right">Disc (₹)</th>
                      <th className="px-2 py-2 text-right">Subtotal</th>
                      <th className="px-2 py-2 text-right">GST %</th>
                      {form.isInterState
                        ? <th className="px-2 py-2 text-right">IGST</th>
                        : <><th className="px-2 py-2 text-right">CGST</th><th className="px-2 py-2 text-right">SGST</th></>}
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-1.5 py-1"><Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="h-7 text-xs min-w-[140px]" placeholder="Product name" /></td>
                        <td className="px-1.5 py-1"><Input value={item.hsnCode} onChange={e => updateItem(idx, 'hsnCode', e.target.value)} className="h-7 text-xs font-mono w-24" placeholder="HSN/SAC" /></td>
                        <td className="px-1.5 py-1">
                          <Select value={item.unit} onValueChange={v => updateItem(idx, 'unit', v)}>
                            <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-1.5 py-1"><Input type="number" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} onWheel={(e) => e.currentTarget.blur()} className="h-7 text-xs text-right w-16" /></td>
                        <td className="px-1.5 py-1"><Input type="number" value={item.rate || ''} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} onWheel={(e) => e.currentTarget.blur()} className="h-7 text-xs text-right w-20" /></td>
                        <td className="px-1.5 py-1"><Input type="number" value={item.discountPct || ''} onChange={e => updateItem(idx, 'discountPct', parseFloat(e.target.value) || 0)} onWheel={(e) => e.currentTarget.blur()} className="h-7 text-xs text-right w-16" /></td>
                        <td className="px-2 py-1 text-right font-medium text-red-500">{item.discountRs > 0 ? item.discountRs.toFixed(2) : '—'}</td>
                        <td className="px-2 py-1 text-right font-medium">{item.taxableValue.toFixed(2)}</td>
                        <td className="px-1.5 py-1">
                          <Select value={String(item.gstRate)} onValueChange={v => updateItem(idx, 'gstRate', parseFloat(v))}>
                            <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
                            <SelectContent>{gstRateOptions.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        {form.isInterState
                          ? <td className="px-2 py-1 text-right">{item.igst.toFixed(2)}</td>
                          : <><td className="px-2 py-1 text-right">{item.cgst.toFixed(2)}</td><td className="px-2 py-1 text-right">{item.sgst.toFixed(2)}</td></>}
                        <td className="px-2 py-1 text-right font-semibold">{item.totalValue.toFixed(2)}</td>
                        <td className="px-1.5 py-1">
                          {items.length > 1 && (
                            <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GST Bifurcation + Totals */}
            <div className="grid grid-cols-2 gap-4">
              {/* GST Bifurcation */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b">
                  <h4 className="font-semibold text-sm">GST Bifurcation</h4>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 text-xs text-muted-foreground border-b">
                      <th className="px-3 py-2 text-left">GST Rate</th>
                      <th className="px-3 py-2 text-right">Taxable (₹)</th>
                      {form.isInterState
                        ? <th className="px-3 py-2 text-right">IGST (₹)</th>
                        : <><th className="px-3 py-2 text-right">CGST (₹)</th><th className="px-3 py-2 text-right">SGST (₹)</th></>}
                      <th className="px-3 py-2 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bifurcation.map(b => (
                      <tr key={b.rate} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{b.rate}%</td>
                        <td className="px-3 py-2 text-right">{fmtINR(b.taxable)}</td>
                        {form.isInterState
                          ? <td className="px-3 py-2 text-right">{fmtINR(b.igst)}</td>
                          : <><td className="px-3 py-2 text-right">{fmtINR(b.cgst)}</td><td className="px-3 py-2 text-right">{fmtINR(b.sgst)}</td></>}
                        <td className="px-3 py-2 text-right font-medium text-orange-600">{fmtINR(form.isInterState ? b.igst : b.cgst + b.sgst)}</td>
                      </tr>
                    ))}
                    {bifurcation.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">Add items to see GST breakdown</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Amount Summary */}
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b">
                  <h4 className="font-semibold text-sm">Amount Summary</h4>
                </div>
                <div className="p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmtINR(totals.subtotal)}</span></div>
                  <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Total Discount</span><span className="font-medium text-red-500">− {fmtINR(totals.discount)}</span></div>
                  <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Taxable Value</span><span className="font-medium">{fmtINR(totals.taxable)}</span></div>
                  {form.isInterState
                    ? <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">IGST</span><span>{fmtINR(totals.igst)}</span></div>
                    : <>
                      <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">CGST</span><span>{fmtINR(totals.cgst)}</span></div>
                      <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">SGST</span><span>{fmtINR(totals.sgst)}</span></div>
                    </>}
                  <div className="flex justify-between py-2 mt-1 bg-primary/10 px-3 rounded-lg border border-primary/20">
                    <span className="font-bold">Grand Total</span>
                    <span className="font-bold text-primary text-base">{fmtINR(totals.grand)}</span>
                  </div>
                  <p className="text-xs italic text-muted-foreground pt-1">{numToWords(totals.grand)}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Payment Mode</Label>
                  <Select value={form.paymentMode} onValueChange={v => setForm(p => ({ ...p, paymentMode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{paymentModeOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. State Bank of India" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account No.</Label>
                  <Input value={form.accountNo} onChange={e => setForm(p => ({ ...p, accountNo: e.target.value }))} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifscCode} onChange={e => setForm(p => ({ ...p, ifscCode: e.target.value }))} className="font-mono" placeholder="e.g. SBIN0001234" />
                </div>
                <div className="space-y-1.5">
                  <Label>Branch</Label>
                  <Input value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Terms & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Terms & Conditions</Label>
                <Textarea value={form.termsAndConditions} onChange={e => setForm(p => ({ ...p, termsAndConditions: e.target.value }))} rows={5} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes / Remarks</Label>
                <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={5} placeholder="Additional notes for this invoice..." className="text-xs" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-4 mt-2 shrink-0">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}><Check className="h-4 w-4 mr-1" />Save Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none overflow-y-auto flex flex-col">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-lg">Tax Invoice — {viewRecord.invoiceNumber}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">Voucher: {viewRecord.voucherNumber}</p>
                </div>
                <div className="flex gap-2 mr-6">
                  <Button size="sm" variant="outline" onClick={() => printOilInvoice(viewRecord)} className="gap-1.5">
                    <Package className="h-3.5 w-3.5" />Print / PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportOilInvoiceCSV(viewRecord)} className="gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" />Excel
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
              {/* Meta */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                {[
                  { label: 'Invoice Date', value: new Date(viewRecord.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { label: 'Place of Supply', value: viewRecord.placeOfSupply },
                  { label: 'Taxpayer GSTIN', value: viewRecord.taxpayerGSTIN },
                  { label: 'Payment Mode', value: viewRecord.paymentMode },
                ].map(({ label, value }) => (
                  <div key={label} className="border rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-sm mt-0.5 font-mono">{value}</p>
                  </div>
                ))}
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Supplier</p>
                  <p className="font-semibold">{viewRecord.taxpayerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{viewRecord.taxpayerAddress}</p>
                  <p className="text-xs font-mono mt-1">GSTIN: {viewRecord.taxpayerGSTIN}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Customer</p>
                  <p className="font-semibold">{viewRecord.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{viewRecord.billingAddress}</p>
                  {viewRecord.customerGSTIN
                    ? <p className="text-xs font-mono mt-1">GSTIN: {viewRecord.customerGSTIN}</p>
                    : <p className="text-xs italic text-muted-foreground mt-1">Unregistered customer</p>}
                </div>
              </div>

              {/* Items */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b text-muted-foreground uppercase">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-left">HSN/SAC</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-left">Unit</th>
                        <th className="px-3 py-2 text-right">Rate</th>
                        <th className="px-3 py-2 text-right">Disc%</th>
                        <th className="px-3 py-2 text-right">Disc (₹)</th>
                        <th className="px-3 py-2 text-right">Taxable</th>
                        <th className="px-3 py-2 text-right">GST%</th>
                        <th className="px-3 py-2 text-right">CGST</th>
                        <th className="px-3 py-2 text-right">SGST</th>
                        <th className="px-3 py-2 text-right">IGST</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewRecord.items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{item.description}</td>
                          <td className="px-3 py-2 font-mono">{item.hsnCode}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2">{item.unit}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(item.rate)}</td>
                          <td className="px-3 py-2 text-right">{item.discountPct}%</td>
                          <td className="px-3 py-2 text-right text-red-500">{item.discountRs > 0 ? fmtINR(item.discountRs) : '—'}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(item.taxableValue)}</td>
                          <td className="px-3 py-2 text-right">{item.gstRate}%</td>
                          <td className="px-3 py-2 text-right">{fmtINR(item.cgst)}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(item.sgst)}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(item.igst)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{fmtINR(item.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GST Bifurcation + Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold uppercase text-muted-foreground">GST Bifurcation</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30 border-b text-muted-foreground">
                        <th className="px-3 py-2 text-left">GST Rate</th>
                        <th className="px-3 py-2 text-right">Taxable</th>
                        <th className="px-3 py-2 text-right">CGST</th>
                        <th className="px-3 py-2 text-right">SGST</th>
                        <th className="px-3 py-2 text-right">IGST</th>
                        <th className="px-3 py-2 text-right">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildGSTBifurcation(viewRecord.items, viewRecord.isInterState).map(b => (
                        <tr key={b.rate} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{b.rate}%</td>
                          <td className="px-3 py-2 text-right">{fmtINR(b.taxable)}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(b.cgst)}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(b.sgst)}</td>
                          <td className="px-3 py-2 text-right">{fmtINR(b.igst)}</td>
                          <td className="px-3 py-2 text-right font-medium text-orange-600">{fmtINR(b.cgst + b.sgst + b.igst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg p-3 space-y-1.5 text-sm">
                  {[
                    { label: 'Subtotal', value: fmtINR(viewRecord.totalSubtotal), cls: '' },
                    { label: 'Total Discount', value: `− ${fmtINR(viewRecord.totalDiscount)}`, cls: 'text-red-500' },
                    { label: 'Taxable Value', value: fmtINR(viewRecord.totalTaxableValue), cls: '' },
                    { label: 'CGST', value: fmtINR(viewRecord.totalCGST), cls: '' },
                    { label: 'SGST', value: fmtINR(viewRecord.totalSGST), cls: '' },
                    { label: 'IGST', value: fmtINR(viewRecord.totalIGST), cls: '' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`font-medium ${cls}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 bg-primary/10 px-3 rounded-lg border border-primary/20 mt-1">
                    <span className="font-bold">Grand Total</span>
                    <span className="font-bold text-primary">{fmtINR(viewRecord.grandTotal)}</span>
                  </div>
                  <p className="text-xs italic text-muted-foreground">{numToWords(viewRecord.grandTotal)}</p>
                </div>
              </div>

              {/* Payment + Terms */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Payment Details</p>
                  {[
                    { label: 'Mode', value: viewRecord.paymentMode },
                    { label: 'Bank', value: viewRecord.bankName },
                    { label: 'Account No.', value: viewRecord.accountNo },
                    { label: 'IFSC', value: viewRecord.ifscCode },
                    { label: 'Branch', value: viewRecord.branch },
                    { label: 'Due Date', value: viewRecord.dueDate ? new Date(viewRecord.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '' },
                  ].filter(r => r.value).map(({ label, value }) => (
                    <div key={label} className="flex justify-between border-b py-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium font-mono text-xs">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Terms & Conditions</p>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{viewRecord.termsAndConditions}</p>
                  {viewRecord.notes && (
                    <div className="mt-3 pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground">{viewRecord.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function FuelSaleForm({ defaultTab = 'MPD_1' }: { defaultTab?: string }) {
  const [mpds, setMpds] = React.useState<MPD[]>([]);
  const [masterShifts, setMasterShifts] = React.useState<ShiftMaster[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [rateMaster, setRateMaster] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [mpdData, shiftData] = await Promise.all([
          fetchMpdsAll(),
          fetchShiftsAll().catch(() => [])
        ]);
        setMpds(mpdData);
        if (shiftData && shiftData.length > 0) {
          setMasterShifts(shiftData);
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  React.useEffect(() => {
    const loadRates = async () => {
      try {
        const [ratesData, productsRes] = await Promise.all([
          fetchLatestOrDateRates(selectedDate).catch(() => ({})),
          fetchProducts({ category: 'Fuel', size: 1000 }).catch(() => ({ content: [] }))
        ]);

        const map: Record<string, number> = {};
        const products = productsRes.content || [];

        Object.entries(ratesData || {}).forEach(([prodId, val]) => {
          map[prodId] = val;
          const matchedProd = products.find(p => String(p.id) === String(prodId));
          if (matchedProd && matchedProd.name) {
            map[matchedProd.name] = val;
            map[matchedProd.name.toLowerCase()] = val;
          }
        });

        products.forEach(p => {
          if (map[p.name] === undefined || map[p.name] === 0) {
            const norm = (p.name || '').toLowerCase();
            let r = 104.50;
            if (norm.includes('diesel') || norm.includes('hsd')) r = 89.75;
            else if (norm.includes('lpg') || norm.includes('cng') || norm.includes('gas') || norm.includes('auto lpg')) r = 65.00;
            else if (norm.includes('petrol') || norm.includes('power') || norm.includes('speed') || norm.includes('ms') || norm.includes('gasoline')) r = 104.50;

            map[p.name] = r;
            map[p.name.toLowerCase()] = r;
            map[String(p.id)] = r;
          }
        });

        setRateMaster(map);
      } catch (err) {
        console.error('Failed to load rates for date:', selectedDate, err);
      }
    };
    loadRates();
  }, [selectedDate]);

  const [activeSubTab, setActiveSubTab] = React.useState(() => {
    return localStorage.getItem('fuel_sale_active_subtab') || 'Meter Reading';
  });

  const handleSubTabChange = (tab: string) => {
    setActiveSubTab(tab);
    localStorage.setItem('fuel_sale_active_subtab', tab);
  };

  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const activeShiftName = React.useMemo(() => {
    return getActiveShiftNameFromMaster(masterShifts, now);
  }, [masterShifts, now]);

  const mainTabs = React.useMemo(() => {
    const tabs = [];
    for (let i = 0; i < mpds.length; i++) {
      tabs.push(`MPD_${i + 1}`);
    }
    if (tabs.length === 0) {
      tabs.push('MPD_1', 'MPD_2', 'MPD_3', 'MPD_4');
    }
    tabs.push('Oil Sale', 'Summary');
    return tabs;
  }, [mpds]);

  const [globalShortage, setGlobalShortage] = React.useState('0');
  const [globalRoundUp, setGlobalRoundUp] = React.useState('0');

  const shortageNum = parseFloat(globalShortage || '0') || 0;
  const roundUpNum = parseFloat(globalRoundUp || '0') || 0;
  const expectedCashInHand = 85950.00 - shortageNum + roundUpNum;

  const formatINR = (amt: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  const tabsScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      tabsScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="mb-2">Fuel Sales Management</h1>
          <p className="text-muted-foreground">
            Record shift-wise nozzle meter readings, credit sales, own usage, settlements, and shift reconciliations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-secondary/80 border rounded-lg shadow-sm h-9">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Sales Date:</span>
            <span className="text-xs font-semibold text-foreground">{formatDateToDMY(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-secondary/80 border rounded-lg shadow-sm h-9">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Active Shift:</span>
            <span className="text-xs font-semibold text-foreground">{activeShiftName}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Card */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <Tabs defaultValue={defaultTab} className="w-full">
          {/* Main MPD Tabs Header Bar - Vertically Centered Segmented Control */}
          <div className="border-b bg-muted/20 px-4 py-3 flex items-center justify-between gap-4">
            <div
              ref={tabsScrollRef}
              className="overflow-x-auto no-scrollbar scroll-smooth flex-1 flex items-center"
            >
              <TabsList className="bg-muted/60 p-1.5 rounded-xl h-auto flex items-center gap-1.5 border border-border/50">
                {mainTabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg px-4 py-2 text-xs md:text-sm font-semibold transition-all border border-transparent data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {tab.replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Prev / Next Scroll Control Buttons */}
            <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-border/60">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => scrollTabs('left')}
                title="Previous MPD Tabs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => scrollTabs('right')}
                title="Next MPD Tabs"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {mainTabs.filter(tab => tab.startsWith('MPD_')).map((tab) => {
            const match = tab.match(/^MPD_?(\d+)$/i);
            const idx = match ? parseInt(match[1]) - 1 : -1;
            const mpd = idx >= 0 && idx < mpds.length ? mpds[idx] : undefined;
            return (
              <TabsContent key={tab} value={tab} className="p-6 mt-0">
                <MPDTabContent
                  key={tab}
                  mpdName={tab}
                  mpd={mpd}
                  mpds={mpds}
                  selectedDate={selectedDate}
                  activeSubTab={activeSubTab}
                  onSubTabChange={handleSubTabChange}
                  rateMaster={rateMaster}
                  activeShiftName={activeShiftName}
                />
              </TabsContent>
            );
          })}

          <TabsContent value="Oil Sale" className="p-6 mt-0">
            <OilSaleTab />
          </TabsContent>

          <TabsContent value="Summary" className="p-6 mt-0">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Consolidated Summary - All MPDs</h2>
                <p className="text-sm text-muted-foreground mb-6">Combined overview of all transactions across all MPDs</p>
              </div>

              {/* Sales Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Droplet className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-900">Total Meter Sales</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">₹3,85,450.00</p>
                  <p className="text-sm text-blue-600 mt-1">4,290 Litres</p>
                </div>

                <div className="p-5 border rounded-lg bg-indigo-50 border-indigo-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-indigo-900">Credit Sales</h3>
                  </div>
                  <p className="text-3xl font-bold text-indigo-700">₹3,00,000.00</p>
                  <p className="text-sm text-indigo-600 mt-1">8 Transactions</p>
                </div>

                <div className="p-5 border rounded-lg bg-cyan-50 border-cyan-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-cyan-500 rounded-lg">
                      <Car className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-900">Own Use</h3>
                  </div>
                  <p className="text-3xl font-bold text-cyan-700">₹26,500.00</p>
                  <p className="text-sm text-cyan-600 mt-1">12 Refills</p>
                </div>
              </div>

              {/* Fuel-wise Sales Breakdown */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h3 className="font-semibold">Fuel-wise Sales Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold">Fuel Type</th>
                        <th className="p-3 text-right text-sm font-semibold">Total Units (L)</th>
                        <th className="p-3 text-right text-sm font-semibold">Rate per Litre</th>
                        <th className="p-3 text-right text-sm font-semibold">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            Petrol
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">2,150.50</td>
                        <td className="p-3 text-right">₹102.50</td>
                        <td className="p-3 text-right font-semibold">₹2,20,426.25</td>
                      </tr>
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                            Diesel
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">2,139.50</td>
                        <td className="p-3 text-right">₹89.75</td>
                        <td className="p-3 text-right font-semibold">₹1,92,023.75</td>
                      </tr>
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <td className="p-3 font-bold text-blue-900" colSpan={2}>Grand Total (All Fuels)</td>
                        <td className="p-3 text-right font-bold text-blue-700">4,290.00 L</td>
                        <td className="p-3 text-right font-bold text-blue-700 text-lg">₹4,12,450.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlements Breakdown */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h3 className="font-semibold">Settlements Summary (All MPDs)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold">Payment Method</th>
                        <th className="p-3 text-right text-sm font-semibold">Number of Transactions</th>
                        <th className="p-3 text-right text-sm font-semibold">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-purple-700" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              PhonePe
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">8</td>
                        <td className="p-3 text-right font-semibold">₹60,000.00</td>
                      </tr>
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-700" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Swipe Machine
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">12</td>
                        <td className="p-3 text-right font-semibold">₹1,00,000.00</td>
                      </tr>
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-green-700" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              RTGS
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">4</td>
                        <td className="p-3 text-right font-semibold">₹2,00,000.00</td>
                      </tr>
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-orange-700" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              BPCL Card
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">6</td>
                        <td className="p-3 text-right font-semibold">₹32,000.00</td>
                      </tr>
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-cyan-700" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                              ULP
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">5</td>
                        <td className="p-3 text-right font-semibold">₹48,000.00</td>
                      </tr>
                      <tr className="hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-700" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Cheque
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">3</td>
                        <td className="p-3 text-right font-semibold">₹1,40,000.00</td>
                      </tr>
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="p-3 font-bold text-green-900" colSpan={2}>Total Settlements</td>
                        <td className="p-3 text-right font-bold text-green-700 text-lg">₹5,80,000.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employee Deposits */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h3 className="font-semibold">Employee Deposits Summary</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600">Total Employee Deposits</p>
                        <p className="text-xs text-purple-500 mt-0.5">From all shift employees across all MPDs</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">₹60,000.00</p>
                  </div>
                </div>
              </div>

              {/* Final Summary */}
              <div className="border-2 border-primary rounded-lg overflow-hidden bg-primary/5">
                <div className="bg-primary/10 px-4 py-3 border-b border-primary/20">
                  <h3 className="font-bold text-lg text-primary">Final Reconciliation</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Meter Sales:</span>
                        <span className="font-semibold">₹4,12,450.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Less: Credit Sales:</span>
                        <span className="font-semibold text-red-600">- ₹3,00,000.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Less: Own Use:</span>
                        <span className="font-semibold text-red-600">- ₹26,500.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-primary/30 bg-blue-50 px-3 -mx-3 rounded">
                        <span className="font-semibold text-blue-900">Cash Sales:</span>
                        <span className="font-bold text-blue-700">₹85,950.00</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total Settlements:</span>
                        <span className="font-semibold">₹5,80,000.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Employee Deposits:</span>
                        <span className="font-semibold">₹60,000.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-primary/30 bg-green-50 px-3 -mx-3 rounded">
                        <span className="font-semibold text-green-900">Total Collections:</span>
                        <span className="font-bold text-green-700">₹6,40,000.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-primary/30 space-y-4">
                    {/* Manual Shortage & Round Up */}
                    <div className="p-4 border rounded-lg bg-background space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                        Manual Adjustments Before Balance
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="global-shortage" className="text-xs text-muted-foreground font-medium">
                            Employee Shortage (₹)
                          </Label>
                          <Input
                            id="global-shortage"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={globalShortage}
                            onChange={(e) => setGlobalShortage(e.target.value)}
                            className="h-9 text-sm font-medium border-amber-200 focus:border-amber-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="global-roundup" className="text-xs text-muted-foreground font-medium">
                            Round Up (manually) (₹)
                          </Label>
                          <Input
                            id="global-roundup"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={globalRoundUp}
                            onChange={(e) => setGlobalRoundUp(e.target.value)}
                            className="h-9 text-sm font-medium border-blue-200 focus:border-blue-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-lg font-bold text-primary">Expected Cash in Hand / Bal. Amount:</span>
                      <span className="text-2xl font-bold text-primary">{formatINR(expectedCashInHand)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-sm text-amber-700">
                        <span className="font-semibold">Note:</span> Variance analysis and cash reconciliation should be done at shift end
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}