import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  FileDown,
  Printer,
  Fuel,
  IndianRupee,
  CreditCard,
  RefreshCw,
  Loader2,
  Building2,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  Gauge,
  ArrowUpRight,
  ExternalLink,
  X,
  Check,
  Phone,
  User,
  Truck
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchCustomers,
  Customer,
  CustomerLedgerSummaryDto,
  CustomerLedgerGlobalKpiDto,
  LedgerTransactionDto,
  fetchCustomerLedgerOverviewApi,
  fetchCustomerLedgerStatementApi
} from '../services/api';
import {
  exportCustomerLedgerToExcel,
  exportCustomerLedgerToCsv,
  printCustomerLedgerStatement,
  CustomerLedgerPrintEntry
} from '../utils/customerLedgerPrintUtils';

interface CustomerLedgerProps {
  onBack?: () => void;
}

const FISCAL_YEARS = ['2026-2027', '2025-2026', '2024-2025', '2023-2024'];

const MONTHS = [
  { value: 'ALL', label: 'All Months' },
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

export function CustomerLedger({ onBack }: CustomerLedgerProps) {
  // ── Master Customer List for Quick Search & Dropdown ──
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // ── Server-Side Overview State ──
  const [overviewList, setOverviewList] = useState<CustomerLedgerSummaryDto[]>([]);
  const [overviewTotalPages, setOverviewTotalPages] = useState<number>(1);
  const [overviewTotalElements, setOverviewTotalElements] = useState<number>(0);
  const [globalKpis, setGlobalKpis] = useState<CustomerLedgerGlobalKpiDto>({
    totalOpeningBalance: 0,
    totalSales: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalLitres: 0,
    limitExceededCount: 0,
    totalCustomers: 0
  });

  // ── Server-Side Statement State (Specific Customer) ──
  const [statementTransactions, setStatementTransactions] = useState<LedgerTransactionDto[]>([]);
  const [statementTotalPages, setStatementTotalPages] = useState<number>(1);
  const [statementTotalElements, setStatementTotalElements] = useState<number>(0);
  const [statementOpeningBal, setStatementOpeningBal] = useState<number>(0);
  const [statementPeriodDebit, setStatementPeriodDebit] = useState<number>(0);
  const [statementPeriodCredit, setStatementPeriodCredit] = useState<number>(0);
  const [statementPeriodLitres, setStatementPeriodLitres] = useState<number>(0);
  const [statementClosingBal, setStatementClosingBal] = useState<number>(0);

  // ── Loading & UI State ──
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // ── Customer Search Modal State ──
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalFilterCategory, setModalFilterCategory] = useState<'ALL' | 'OUTSTANDING' | 'ADVANCE' | 'LIMIT_EXCEEDED' | 'NIL'>('ALL');

  // ── Customer & Vehicle Autocomplete Typeahead States (Clean & Simple as Add Own Usage Record) ──
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [vehicleSearch, setVehicleSearch] = useState<string>('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState<boolean>(false);
  const vehicleRef = useRef<HTMLDivElement>(null);


  // ── Server-Side Filter Params ──
  const [fiscalYear, setFiscalYear] = useState<string>('2025-2026');
  const [month, setMonth] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ── Server-Side Sorting & Pagination ──
  const [sortBy, setSortBy] = useState<string>('netBalance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(25);

  // ── Format Helpers ──
  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return '₹0.00';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatRawNumber = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatLitres = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L';
  };

  const formatDateDisplay = (dateStr: string) => {
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

  // ── 1. Load All Customers For Fast Selection Modal ──
  const loadMasterCustomers = async () => {
    try {
      const res = await fetchCustomers({ size: 1000 });
      if (res.content && res.content.length > 0) {
        setAllCustomers(res.content);
      }
    } catch (err) {
      console.warn('Failed to load master customers list:', err);
    }
  };

  useEffect(() => {
    loadMasterCustomers();
  }, []);

  // ── Calculate Effective Date Boundaries ──
  const { effectiveFrom, effectiveTo } = useMemo(() => {
    if (fromDate || toDate) {
      return { effectiveFrom: fromDate || undefined, effectiveTo: toDate || undefined };
    }
    const [startYearStr, endYearStr] = fiscalYear.split('-');
    const startYear = parseInt(startYearStr, 10) || 2025;
    const endYear = parseInt(endYearStr, 10) || (startYear + 1);

    if (month !== 'ALL') {
      const mNum = parseInt(month, 10);
      const y = mNum >= 4 ? startYear : endYear;
      const mFrom = `${y}-${month}-01`;
      const lastDay = new Date(y, mNum, 0).getDate();
      const mTo = `${y}-${month}-${String(lastDay).padStart(2, '0')}`;
      return { effectiveFrom: mFrom, effectiveTo: mTo };
    }
    // Default to full financial year
    const fyFrom = `${startYear}-04-01`;
    const fyTo = `${endYear}-03-31`;
    return { effectiveFrom: fyFrom, effectiveTo: fyTo };
  }, [fromDate, toDate, month, fiscalYear]);

  // ── 2. Fetch Server-Side Overview Data (When No Customer Selected) ──
  const loadServerOverview = useCallback(async () => {
    if (selectedCustomerId) return;
    setLoading(true);
    try {
      const res = await fetchCustomerLedgerOverviewApi({
        search: searchTerm || undefined,
        fromDate: effectiveFrom,
        toDate: effectiveTo,
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDir
      });

      if (res && res.page) {
        setOverviewList(res.page.content || []);
        setOverviewTotalPages(res.page.totalPages || 1);
        setOverviewTotalElements(res.page.totalElements || 0);
      }
      if (res && res.kpis) {
        setGlobalKpis(res.kpis);
      }
    } catch (err: any) {
      console.error('Failed to fetch customer ledger overview from server:', err);
      toast.error('Failed to fetch ledger overview from server');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, searchTerm, effectiveFrom, effectiveTo, currentPage, pageSize, sortBy, sortDir]);

  // ── 3. Fetch Server-Side Customer Statement (When Customer Selected) ──
  const loadServerStatement = useCallback(async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      const res = await fetchCustomerLedgerStatementApi(selectedCustomerId, {
        fromDate: effectiveFrom,
        toDate: effectiveTo,
        search: searchTerm || undefined,
        page: currentPage,
        size: pageSize,
        sortBy: sortBy === 'netBalance' ? 'date' : sortBy,
        sortDir: sortBy === 'netBalance' ? 'asc' : sortDir
      });

      if (res) {
        setActiveCustomer(res.customer || null);
        setStatementOpeningBal(res.openingBalance || 0);
        setStatementPeriodDebit(res.periodDebit || 0);
        setStatementPeriodCredit(res.periodCredit || 0);
        setStatementPeriodLitres(res.periodLitres || 0);
        setStatementClosingBal(res.closingBalance || 0);

        if (res.transactions) {
          setStatementTransactions(res.transactions.content || []);
          setStatementTotalPages(res.transactions.totalPages || 1);
          setStatementTotalElements(res.transactions.totalElements || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch customer statement from server:', err);
      toast.error('Failed to load customer statement');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, effectiveFrom, effectiveTo, searchTerm, currentPage, pageSize, sortBy, sortDir]);

  // Trigger server fetch whenever active state or filters change
  useEffect(() => {
    if (selectedCustomerId) {
      loadServerStatement();
    } else {
      loadServerOverview();
    }
  }, [selectedCustomerId, loadServerStatement, loadServerOverview]);

  // ── Sorting Toggle (Server Side) ──
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(0);
  };

  // ── Click outside to close Customer & Vehicle typeahead dropdowns (Same as Add Own Usage Record) ──
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (vehicleRef.current && !vehicleRef.current.contains(e.target as Node)) {
        setShowVehicleDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ── Sync Customer Search Input with activeCustomer ──
  useEffect(() => {
    if (activeCustomer) {
      setCustomerSearch(activeCustomer.customerName);
    } else if (!selectedCustomerId) {
      setCustomerSearch('');
    }
  }, [activeCustomer, selectedCustomerId]);

  // ── Customer Suggestions (Instant Autocomplete Typeahead) ──
  const customerSuggestions = useMemo(() => {
    if (!customerSearch.trim()) {
      return allCustomers;
    }
    const q = customerSearch.trim().toLowerCase();
    return allCustomers.filter(c =>
      c.customerName?.toLowerCase().includes(q) ||
      c.customerCode?.toLowerCase().includes(q) ||
      (c.mobileNo && c.mobileNo.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.gstNo && c.gstNo.toLowerCase().includes(q))
    );
  }, [customerSearch, allCustomers]);

  // ── Unique Vehicles for Active Customer (From Transactions & Master) ──
  const customerVehicles = useMemo(() => {
    const set = new Set<string>();
    statementTransactions.forEach(tx => {
      if (tx.vehicleNo && tx.vehicleNo !== '-' && tx.vehicleNo !== 'N/A') {
        set.add(tx.vehicleNo.trim());
      }
    });
    if (activeCustomer?.vehicles) {
      activeCustomer.vehicles.forEach(v => {
        if (v.vehicleNumber) set.add(v.vehicleNumber.trim());
      });
    }
    return Array.from(set).sort();
  }, [statementTransactions, activeCustomer]);

  // ── Vehicle / Equipment No. Suggestions (Instant Autocomplete Typeahead) ──
  const vehicleSuggestions = useMemo(() => {
    if (!vehicleSearch.trim()) {
      return customerVehicles;
    }
    const q = vehicleSearch.trim().toLowerCase();
    return customerVehicles.filter(v => v.toLowerCase().includes(q));
  }, [vehicleSearch, customerVehicles]);

  // ── Handlers for Typeahead Selection ──
  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      selectCustomer(String(customer.id));
      setCustomerSearch(customer.customerName);
    } else {
      selectCustomer('');
      setCustomerSearch('');
    }
    setShowCustomerDropdown(false);
    setVehicleSearch('');
  };

  const handleVehicleSelect = (veh: string) => {
    setVehicleSearch(veh);
    setSearchTerm(veh);
    setShowVehicleDropdown(false);
    setCurrentPage(0);
  };

  // ── Customer Select via Modal, Table Row or Typeahead ──
  const selectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentPage(0);
    setSearchTerm('');
    setVehicleSearch('');
    setShowCustomerModal(false);
    setModalSearchQuery('');
    if (customerId) {
      const found = allCustomers.find(c => String(c.id) === String(customerId));
      if (found) setCustomerSearch(found.customerName);
      setSortBy('date');
      setSortDir('asc');
    } else {
      setCustomerSearch('');
      setSortBy('netBalance');
      setSortDir('desc');
      setActiveCustomer(null);
    }
  };

  // ── Filtered Customers for Search Modal (Instant Typeahead) ──
  const modalFilteredCustomers = useMemo(() => {
    let list = allCustomers;

    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.trim().toLowerCase();
      list = list.filter(c =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.mobileNo && c.mobileNo.includes(q)) ||
        (c.gstNo && c.gstNo.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allCustomers, modalSearchQuery]);


  // ── Refresh Handler ──
  const handleRefresh = async () => {
    toast.info('Refreshing Customer Ledger from server...');
    if (selectedCustomerId) {
      await loadServerStatement();
    } else {
      await loadServerOverview();
    }
    await loadMasterCustomers();
    toast.success('Customer Ledger refreshed successfully!');
  };

  // ── Export Handlers ──
  const handleExport = (type: 'excel' | 'csv') => {
    if (!selectedCustomerId || !activeCustomer) {
      setExporting(true);
      try {
        const csvRows = [
          'Sr,Customer Code,Customer Name,Contact Person,Mobile,Credit Limit,Credit Period,Total Sales,Total Paid,Net Outstanding,Status'
        ];
        overviewList.forEach((cs, i) => {
          csvRows.push(
            `${i + 1},"${cs.customerCode}","${cs.customerName}","${cs.contactPerson || '-'}","${cs.mobileNo || '-'}",${cs.creditLimit},${cs.creditPeriod},${cs.totalSales.toFixed(2)},${cs.totalPaid.toFixed(2)},${cs.netBalance.toFixed(2)},"${cs.status}"`
          );
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Customer_Outstanding_Summary_${fiscalYear}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Customer Outstanding Summary CSV downloaded successfully!');
      } catch (err: any) {
        toast.error('Export failed: ' + err.message);
      } finally {
        setExporting(false);
      }
      return;
    }

    setExporting(true);
    try {
      const printEntries: CustomerLedgerPrintEntry[] = [
        {
          srNo: 1,
          date: effectiveFrom || '2025-04-01',
          particulars: 'Opening Balance',
          slipNo: '-',
          voucherNo: '-',
          vehicleNo: '-',
          productName: '-',
          debit: 0,
          credit: 0,
          runningBalance: statementOpeningBal,
          type: 'OPENING_BALANCE'
        },
        ...statementTransactions.map((tx, idx) => ({
          srNo: idx + 2,
          date: String(tx.date),
          time: tx.time,
          particulars: tx.particulars,
          slipNo: tx.slipNo,
          voucherNo: tx.voucherNo,
          vehicleNo: tx.vehicleNo,
          productName: tx.productName,
          quantity: tx.quantity,
          rate: tx.rate,
          debit: tx.debit,
          credit: tx.credit,
          runningBalance: tx.runningBalance,
          type: tx.type as any
        })),
        {
          srNo: statementTransactions.length + 2,
          date: effectiveTo || '2026-03-31',
          particulars: 'Closing Balance',
          slipNo: '-',
          voucherNo: '-',
          vehicleNo: '-',
          productName: '-',
          debit: 0,
          credit: 0,
          runningBalance: statementClosingBal,
          type: 'CLOSING_BALANCE'
        }
      ];

      const exportData = {
        customerName: activeCustomer.customerName,
        customerCode: activeCustomer.customerCode,
        contactPerson: activeCustomer.contactPerson,
        mobileNo: activeCustomer.mobileNo,
        city: activeCustomer.city,
        gstNo: activeCustomer.gstNo,
        panNo: activeCustomer.panNo,
        creditLimit: activeCustomer.creditLimit,
        fromDate: effectiveFrom ? formatDateDisplay(effectiveFrom) : `01 Apr ${fiscalYear.split('-')[0]}`,
        toDate: effectiveTo ? formatDateDisplay(effectiveTo) : `31 Mar ${fiscalYear.split('-')[1]}`,
        fiscalYear,
        openingBalance: statementOpeningBal,
        closingBalance: statementClosingBal,
        totalDebit: statementPeriodDebit,
        totalCredit: statementPeriodCredit,
        totalLitres: statementPeriodLitres,
        entries: printEntries
      };

      if (type === 'excel') {
        exportCustomerLedgerToExcel(exportData);
        toast.success(`Exported ${activeCustomer.customerName} Ledger Excel (.xls) successfully!`);
      } else {
        exportCustomerLedgerToCsv(exportData);
        toast.success(`Exported ${activeCustomer.customerName} Ledger CSV successfully!`);
      }
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Print Handler ──
  const handlePrint = () => {
    if (!selectedCustomerId || !activeCustomer) {
      toast.info('Select a specific customer to generate their printable statement.');
      return;
    }

    const printEntries: CustomerLedgerPrintEntry[] = [
      {
        srNo: 1,
        date: effectiveFrom || '2025-04-01',
        particulars: 'Opening Balance',
        slipNo: '-',
        voucherNo: '-',
        vehicleNo: '-',
        productName: '-',
        debit: 0,
        credit: 0,
        runningBalance: statementOpeningBal,
        type: 'OPENING_BALANCE'
      },
      ...statementTransactions.map((tx, idx) => ({
        srNo: idx + 2,
        date: String(tx.date),
        time: tx.time,
        particulars: tx.particulars,
        slipNo: tx.slipNo,
        voucherNo: tx.voucherNo,
        vehicleNo: tx.vehicleNo,
        productName: tx.productName,
        quantity: tx.quantity,
        rate: tx.rate,
        debit: tx.debit,
        credit: tx.credit,
        runningBalance: tx.runningBalance,
        type: tx.type as any
      })),
      {
        srNo: statementTransactions.length + 2,
        date: effectiveTo || '2026-03-31',
        particulars: 'Closing Balance',
        slipNo: '-',
        voucherNo: '-',
        vehicleNo: '-',
        productName: '-',
        debit: 0,
        credit: 0,
        runningBalance: statementClosingBal,
        type: 'CLOSING_BALANCE'
      }
    ];

    printCustomerLedgerStatement({
      customerName: activeCustomer.customerName,
      customerCode: activeCustomer.customerCode,
      contactPerson: activeCustomer.contactPerson,
      mobileNo: activeCustomer.mobileNo,
      city: activeCustomer.city,
      gstNo: activeCustomer.gstNo,
      panNo: activeCustomer.panNo,
      creditLimit: activeCustomer.creditLimit,
      fromDate: effectiveFrom ? formatDateDisplay(effectiveFrom) : `01 Apr ${fiscalYear.split('-')[0]}`,
      toDate: effectiveTo ? formatDateDisplay(effectiveTo) : `31 Mar ${fiscalYear.split('-')[1]}`,
      fiscalYear,
      openingBalance: statementOpeningBal,
      closingBalance: statementClosingBal,
      totalDebit: statementPeriodDebit,
      totalCredit: statementPeriodCredit,
      totalLitres: statementPeriodLitres,
      entries: printEntries
    });
  };

  // ── DSR Smart Page Window Helper (1, 2, 3, ... 5) ──
  const totalPages = selectedCustomerId ? statementTotalPages : overviewTotalPages;
  const totalRecords = selectedCustomerId ? statementTotalElements : overviewTotalElements;

  const getPageNumbers = (current0: number, total: number): (string | number)[] => {
    if (total <= 1) return [1];
    if (total <= 4) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const current = current0 + 1; // 1-indexed (1 to total)

    // Near beginning (e.g. page 1, 2, or 3) -> 1, 2, 3, ..., total
    if (current <= 3) {
      return [1, 2, 3, '...', total];
    }

    // Near end (e.g. page total, total-1, total-2) -> 1, ..., total-2, total-1, total
    if (current >= total - 2) {
      return [1, '...', total - 2, total - 1, total];
    }

    // In the middle -> 1, ..., current-1, current, current+1, ..., total
    return [1, '...', current - 1, current, current + 1, '...', total];
  };


  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* ── Page Header (Identical to DSR) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Reports Catalog
            </Button>
          )}
          <h1 className="text-2xl font-bold tracking-tight">Customer Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Party-wise credit fuel dispatches, payment collections, running balance & limit tracking register (FY {fiscalYear})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {activeCustomer && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectCustomer('')}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground border-border shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                All Customers Overview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 gap-1.5 border-border shadow-sm text-foreground hover:bg-muted"
              >
                <Printer className="w-4 h-4 text-primary" />
                Print Statement
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={exporting} className="h-9 gap-1.5 bg-primary text-primary-foreground shadow-sm">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting...' : 'Export Ledger'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer text-xs" disabled={exporting}>
                <FileDown className="w-4 h-4 mr-2 text-emerald-600" />
                Export to Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer text-xs" disabled={exporting}>
                <FileDown className="w-4 h-4 mr-2 text-blue-600" />
                Export to CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Filter / Search Bar (100% Identical to DSR Filter Bar) ── */}
      <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeCustomer ? "Search date, slip, vehicle, product..." : "Search customer code, name, mobile..."}
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>

          {/* Customer Autocomplete Typeahead Dropdown (Clean & Simple, same as Add Own Usage Record) */}
          <div ref={customerRef} className="relative min-w-[260px] max-w-[320px] flex-1">
            <div className="relative">
              <Input
                placeholder="Select or search customer..."
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="h-9 text-xs pl-8 pr-16 bg-background border-border hover:border-primary/50 focus:border-primary font-medium transition-colors"
                autoComplete="off"
              />
              <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {selectedCustomerId && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-muted-foreground hover:text-destructive p-0.5 rounded cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCustomerSelect(null);
                    }}
                    title="Clear selected customer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  onClick={() => setShowCustomerDropdown(prev => !prev)}
                  title="Toggle customer list"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {showCustomerDropdown && (
                <div className="absolute z-50 w-full min-w-[340px] mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto bg-white dark:bg-slate-900 divide-y divide-border/40">
                  {/* Option: View All Customers Overview */}
                  <div
                    className={`px-3 py-2.5 hover:bg-muted/80 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                      !selectedCustomerId ? 'bg-primary/10 font-bold text-primary' : ''
                    }`}
                    onClick={() => handleCustomerSelect(null)}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">★ All Customers Overview</span>
                        <p className="text-[10px] text-muted-foreground">Consolidated outstanding of all {allCustomers.length} parties</p>
                      </div>
                    </div>
                    {!selectedCustomerId && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Active</Badge>
                    )}
                  </div>

                  {/* Customer Items */}
                  {customerSuggestions.length > 0 ? (
                    customerSuggestions.slice(0, 80).map(c => {
                      const isSel = String(c.id) === String(selectedCustomerId);
                      return (
                        <div
                          key={c.id}
                          className={`px-3 py-2 hover:bg-muted/80 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                            isSel ? 'bg-primary/10 font-semibold' : ''
                          }`}
                          onClick={() => handleCustomerSelect(c)}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-foreground truncate">{c.customerName}</span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 shrink-0 border-border">
                                {c.customerCode}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {c.city ? `${c.city} • ` : ''}{c.mobileNo || c.contactPerson || 'Credit Customer'}
                            </p>
                          </div>
                          {c.creditLimit ? (
                            <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                              ₹{(c.creditLimit / 1000).toFixed(0)}k Lim
                            </Badge>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      No customers matching "{customerSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle / Equipment No. Autocomplete Typeahead Dropdown (Clean & Simple as Add Own Usage Record) */}
          {selectedCustomerId && (
            <div ref={vehicleRef} className="relative min-w-[200px] max-w-[260px]">
              <div className="relative">
                <Input
                  placeholder="Vehicle / Equip No..."
                  value={vehicleSearch}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setVehicleSearch(val);
                    setSearchTerm(val);
                    setShowVehicleDropdown(true);
                    setCurrentPage(0);
                  }}
                  onFocus={() => setShowVehicleDropdown(true)}
                  className="h-9 text-xs pl-8 pr-14 bg-background border-border hover:border-primary/50 focus:border-primary font-mono transition-colors"
                  autoComplete="off"
                />
                <Truck className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {vehicleSearch && (
                    <button
                      type="button"
                      tabIndex={-1}
                      className="text-muted-foreground hover:text-destructive p-0.5 rounded cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVehicleSearch('');
                        setSearchTerm('');
                        setCurrentPage(0);
                      }}
                      title="Clear vehicle filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                    onClick={() => setShowVehicleDropdown(prev => !prev)}
                    title="Toggle vehicle list"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showVehicleDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-56 overflow-y-auto bg-white dark:bg-slate-900 divide-y divide-border/40">
                    {vehicleSuggestions.length > 0 ? (
                      vehicleSuggestions.map((veh, i) => (
                        <div
                          key={veh || i}
                          className={`px-3 py-2 hover:bg-muted/80 cursor-pointer text-xs font-mono transition-colors flex items-center justify-between ${
                            vehicleSearch.toUpperCase() === veh.toUpperCase()
                              ? 'bg-primary/10 font-bold text-primary'
                              : 'text-foreground'
                          }`}
                          onClick={() => handleVehicleSelect(veh)}
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{veh}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-border">
                            Select
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        {customerVehicles.length === 0
                          ? 'No vehicles recorded for this party'
                          : `No vehicles matching "${vehicleSearch}"`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Year */}
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

          {/* Month */}
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

          {/* Date Range: From */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setMonth('ALL');
                setCurrentPage(0);
              }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Date Range: To */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setMonth('ALL');
                setCurrentPage(0);
              }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Reset Date Range Button */}
          {(fromDate || toDate || selectedCustomerId || searchTerm || month !== 'ALL') && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setMonth('ALL');
                setSearchTerm('');
                setVehicleSearch('');
                setCurrentPage(0);
              }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Data Table (100% Matching DSR Table Structure & Sticky Headers) ── */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Querying server-side database records...</p>
            </div>
          ) : (selectedCustomerId ? statementTransactions.length === 0 : overviewList.length === 0) ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-semibold text-base">No Customer Ledger records found</p>
              <p className="text-xs mt-1">Try adjusting the month, date filter, or search keywords.</p>
            </div>
          ) : activeCustomer ? (
            /* ─────────────────────────────────────────────────────────────
               VIEW 1: Detailed Customer Ledger Statement (DSR Theme)
               ───────────────────────────────────────────────────────────── */
            <table className="w-full text-xs text-left border-collapse">
              {/* Sticky Two-Tier Excel Sheet Header */}
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur text-foreground border-b border-border shadow-sm">
                {/* Header Row 1: Section Headings */}
                <tr className="border-b border-border/80">
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('date')}
                    className="px-3 py-2.5 font-bold border-r border-border text-center whitespace-nowrap bg-muted cursor-pointer hover:bg-muted/80 select-none w-28"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2.5 font-bold border-r border-border bg-muted select-none min-w-[200px]"
                  >
                    Particulars / Transaction Description
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 font-bold border-r border-border text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 uppercase tracking-wider text-[11px]"
                  >
                    Reference &amp; Dispatch Details
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 font-bold border-r border-border text-center bg-amber-500/10 text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px]"
                  >
                    Product &amp; Fuel Litres
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 font-bold text-center bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 uppercase tracking-wider text-[11px]"
                  >
                    Financial Accounting (₹)
                  </th>
                </tr>

                {/* Header Row 2: Exact Column Names */}
                <tr className="border-b border-border/80 text-[11px]">
                  <th
                    onClick={() => handleSort('slipNo')}
                    className="px-2 py-2 text-center border-r border-border bg-blue-500/5 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Slip No. {sortBy === 'slipNo' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-center border-r border-border bg-blue-500/5 font-semibold whitespace-nowrap">
                    Voucher No.
                  </th>
                  <th className="px-2 py-2 text-center border-r border-border bg-blue-500/5 font-semibold whitespace-nowrap">
                    Vehicle No.
                  </th>

                  <th className="px-2 py-2 text-left border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">
                    Product / Item
                  </th>
                  <th
                    onClick={() => handleSort('quantity')}
                    className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Qty (Litres) {sortBy === 'quantity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">
                    Rate (₹)
                  </th>

                  <th
                    onClick={() => handleSort('debit')}
                    className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold text-blue-700 dark:text-blue-400 cursor-pointer whitespace-nowrap"
                  >
                    Debit (₹) {sortBy === 'debit' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('credit')}
                    className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer whitespace-nowrap"
                  >
                    Credit (₹) {sortBy === 'credit' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-right bg-emerald-500/5 font-semibold whitespace-nowrap">
                    Running Balance (₹)
                  </th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="divide-y divide-border/60">
                {/* 1. Opening Balance Row */}
                {currentPage === 0 && (
                  <tr className="bg-amber-500/5 font-semibold border-b-2 border-border/60">
                    <td className="px-3 py-2 text-center font-medium border-r border-border/60 whitespace-nowrap text-foreground">
                      {effectiveFrom || '01-Apr-2025'}
                    </td>
                    <td className="px-3 py-2 font-bold text-foreground border-r border-border/60" colSpan={7}>
                      ★ OPENING BALANCE (As of {effectiveFrom || '01-Apr-2025'})
                    </td>
                    <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground">-</td>
                    <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground">-</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-foreground bg-primary/5 whitespace-nowrap">
                      {formatCurrency(statementOpeningBal)}
                      <span className="text-[10px] ml-1 text-muted-foreground">{statementOpeningBal >= 0 ? 'Dr' : 'Cr'}</span>
                    </td>
                  </tr>
                )}

                {/* 2. Transaction Rows */}
                {statementTransactions.map((tx, rowIndex) => {
                  const isCreditSale = tx.type === 'CREDIT_SALE';
                  const isDiesel = (tx.productName || '').toLowerCase().includes('diesel');

                  return (
                    <tr
                      key={tx.id || rowIndex}
                      className={`hover:bg-muted/40 transition-colors ${
                        rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/15'
                      }`}
                    >
                      {/* Date */}
                      <td className="px-3 py-2 text-center font-medium border-r border-border/60 whitespace-nowrap text-foreground">
                        <div>{formatDateDisplay(String(tx.date))}</div>
                        {tx.time && <div className="text-[10px] text-muted-foreground font-mono">{tx.time}</div>}
                      </td>

                      {/* Particulars */}
                      <td className="px-3 py-2 border-r border-border/60 text-foreground font-medium">
                        {tx.particulars}
                      </td>

                      {/* Slip No. */}
                      <td className="px-2 py-2 text-center font-mono border-r border-border/60 whitespace-nowrap">
                        {tx.slipNo && tx.slipNo !== '-' ? (
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-border">
                            {tx.slipNo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Voucher No. */}
                      <td className="px-2 py-2 text-center font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {tx.voucherNo && tx.voucherNo !== '-' ? tx.voucherNo : '—'}
                      </td>

                      {/* Vehicle No. */}
                      <td className="px-2 py-2 text-center font-mono border-r border-border/60 whitespace-nowrap">
                        {tx.vehicleNo && tx.vehicleNo !== '-' && tx.vehicleNo !== 'N/A' ? (
                          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                            {tx.vehicleNo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Product */}
                      <td className="px-2 py-2 border-r border-border/60 whitespace-nowrap">
                        {isCreditSale ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              isDiesel
                                ? 'border-emerald-500/40 text-emerald-700 bg-emerald-500/5'
                                : 'border-amber-500/40 text-amber-700 bg-amber-500/5'
                            }`}
                          >
                            {tx.productName}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700">
                            {tx.mode || 'Receipt'}
                          </Badge>
                        )}
                      </td>

                      {/* Qty Litres */}
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {formatLitres(tx.quantity)}
                      </td>

                      {/* Rate */}
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {tx.rate ? `₹${tx.rate.toFixed(2)}` : '—'}
                      </td>

                      {/* Debit */}
                      <td className="px-2 py-2 text-right font-mono font-bold border-r border-border/60 text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {tx.debit > 0 ? formatRawNumber(tx.debit) : '-'}
                      </td>

                      {/* Credit */}
                      <td className="px-2 py-2 text-right font-mono font-bold border-r border-border/60 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {tx.credit > 0 ? formatRawNumber(tx.credit) : '-'}
                      </td>

                      {/* Running Balance */}
                      <td className="px-2 py-2 text-right font-mono font-bold text-foreground bg-primary/5 whitespace-nowrap">
                        {formatCurrency(Math.abs(tx.runningBalance))}
                        <span className={`text-[10px] ml-1 font-semibold ${tx.runningBalance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {tx.runningBalance >= 0 ? 'Dr' : 'Cr'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand Total Sticky Footer Row (Matching DSR) */}
              <tfoot className="sticky bottom-0 z-10 bg-muted/95 backdrop-blur border-t-2 border-border font-semibold shadow-inner">
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold border-r border-border whitespace-nowrap uppercase tracking-wider text-foreground">
                    Grand Total
                  </td>
                  <td className="px-3 py-2 border-r border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground" colSpan={5}>
                    Period Summary &amp; Reconciled Net Closing
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold border-r border-border text-foreground">
                    {formatLitres(statementPeriodLitres)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono border-r border-border text-muted-foreground">-</td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-blue-700 dark:text-blue-400 border-r border-border">
                    {formatRawNumber(statementPeriodDebit)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-border">
                    {formatRawNumber(statementPeriodCredit)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-primary bg-primary/10 whitespace-nowrap">
                    {formatCurrency(Math.abs(statementClosingBal))}
                    <span className={`text-[10px] ml-1 ${statementClosingBal >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {statementClosingBal >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               VIEW 2: All Customers Summary List (DSR Theme)
               ───────────────────────────────────────────────────────────── */
            <table className="w-full text-xs text-left border-collapse">
              {/* Sticky Two-Tier Excel Sheet Header */}
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur text-foreground border-b border-border shadow-sm">
                <tr className="border-b border-border/80">
                  <th
                    rowSpan={2}
                    className="px-3 py-2.5 font-bold border-r border-border text-center whitespace-nowrap bg-muted w-12"
                  >
                    Sr.
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 font-bold border-r border-border text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 uppercase tracking-wider text-[11px]"
                  >
                    Party Master Identification
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-2 font-bold border-r border-border text-center bg-amber-500/10 text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px]"
                  >
                    Credit Terms &amp; Compliance
                  </th>
                  <th
                    colSpan={5}
                    className="px-3 py-2 font-bold text-center bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 uppercase tracking-wider text-[11px]"
                  >
                    Accounting Totals &amp; Outstanding (₹)
                  </th>
                </tr>

                <tr className="border-b border-border/80 text-[11px]">
                  <th className="px-2 py-2 text-center border-r border-border bg-blue-500/5 font-semibold whitespace-nowrap">
                    Code
                  </th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="px-2 py-2 text-left border-r border-border bg-blue-500/5 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Customer / Organization Name {sortBy === 'customerName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-left border-r border-border bg-blue-500/5 font-semibold whitespace-nowrap">
                    Contact &amp; Mobile
                  </th>

                  <th
                    onClick={() => handleSort('creditLimit')}
                    className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Credit Limit {sortBy === 'creditLimit' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-center border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">
                    Credit Period
                  </th>

                  <th
                    onClick={() => handleSort('openingBalance')}
                    className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold text-amber-800 dark:text-amber-300 cursor-pointer whitespace-nowrap"
                  >
                    Opening Bal (₹) {sortBy === 'openingBalance' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('totalSales')}
                    className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold text-blue-700 dark:text-blue-400 cursor-pointer whitespace-nowrap"
                  >
                    Total Sales (₹) {sortBy === 'totalSales' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('totalPaid')}
                    className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer whitespace-nowrap"
                  >
                    Total Paid (₹) {sortBy === 'totalPaid' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('netBalance')}
                    className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Net Outstanding (₹) {sortBy === 'netBalance' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-center bg-emerald-500/5 font-semibold whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="divide-y divide-border/60">
                {overviewList.map((cs, rowIndex) => {
                  const globalIdx = (currentPage * pageSize) + rowIndex + 1;
                  return (
                    <tr
                      key={cs.id || rowIndex}
                      onClick={() => selectCustomer(String(cs.id))}
                      className={`hover:bg-muted/40 transition-colors cursor-pointer group ${
                        rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/15'
                      }`}
                    >
                      <td className="px-3 py-2 text-center font-medium border-r border-border/60 whitespace-nowrap text-muted-foreground">
                        {globalIdx}
                      </td>
                      <td className="px-2 py-2 text-center font-mono border-r border-border/60 whitespace-nowrap font-medium text-foreground">
                        {cs.customerCode}
                      </td>
                      <td className="px-2 py-2 border-r border-border/60">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {cs.customerName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {cs.vehicleCount} vehicle(s) linked
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-border/60 whitespace-nowrap">
                        <div className="text-foreground">{cs.contactPerson || '—'}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{cs.mobileNo || '—'}</div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {cs.creditLimit > 0 ? formatCurrency(cs.creditLimit) : 'No Limit'}
                      </td>
                      <td className="px-2 py-2 text-center font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {cs.creditPeriod || 15} Days
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-amber-700 dark:text-amber-400 border-r border-border/60 whitespace-nowrap">
                        {formatRawNumber(cs.openingBalance)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-blue-700 dark:text-blue-400 border-r border-border/60 whitespace-nowrap">
                        {formatRawNumber(cs.totalSales)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-border/60 whitespace-nowrap">
                        {formatRawNumber(cs.totalPaid)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold border-r border-border/60 whitespace-nowrap">
                        <span className={cs.netBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {formatCurrency(Math.abs(cs.netBalance))}
                        </span>
                        <span className="text-[10px] ml-1 text-muted-foreground">{cs.netBalance >= 0 ? 'Dr' : 'Cr'}</span>
                      </td>
                      <td className="px-2 py-2 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => selectCustomer(String(cs.id))}
                          className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          View Ledger
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand Total Sticky Footer Row (Matching DSR) */}
              <tfoot className="sticky bottom-0 z-10 bg-muted/95 backdrop-blur border-t-2 border-border font-semibold shadow-inner">
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold border-r border-border whitespace-nowrap uppercase tracking-wider text-foreground">
                    Grand Total
                  </td>
                  <td className="px-3 py-2 border-r border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground" colSpan={5}>
                    Consolidated {globalKpis.totalCustomers} Credit Accounts
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-amber-700 dark:text-amber-400 border-r border-border">
                    {formatRawNumber(globalKpis.totalOpeningBalance || 0)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-blue-700 dark:text-blue-400 border-r border-border">
                    {formatRawNumber(globalKpis.totalSales)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-border">
                    {formatRawNumber(globalKpis.totalPaid)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-primary bg-primary/10 border-r border-border whitespace-nowrap">
                    {formatCurrency(Math.abs(globalKpis.totalOutstanding))}
                    <span className="text-[10px] ml-1 text-muted-foreground">{globalKpis.totalOutstanding >= 0 ? 'Dr' : 'Cr'}</span>
                  </td>
                  <td className="px-2 py-2 text-center text-muted-foreground">-</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Pagination Footer (100% Identical to DSR lines 1153-1225) ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Showing</span>
            <span className="font-semibold text-foreground">
              {totalRecords > 0 ? currentPage * pageSize + 1 : 0}
            </span>
            <span>to</span>
            <span className="font-semibold text-foreground">
              {Math.min((currentPage + 1) * pageSize, totalRecords)}
            </span>
            <span>of</span>
            <span className="font-semibold text-foreground">{totalRecords}</span>
            <span>records</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={v => {
                  setPageSize(Number(v));
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === '...' ? (
                  <span
                    key={`dots-${i}`}
                    className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground select-none font-bold"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={`page-${p}-${i}`}
                    variant={currentPage === Number(p) - 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(Number(p) - 1)}
                    className={`h-8 w-8 p-0 text-xs font-semibold ${
                      currentPage === Number(p) - 1
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Typeahead Credit Customer Search Modal (DSR Theme) ── */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden rounded-xl border border-border shadow-2xl">
          <DialogHeader className="p-4 bg-muted/40 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Select Credit Customer (Typeahead Search)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Search among {allCustomers.length} registered credit parties by Name, Code, Phone, or GSTIN
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-border">
                {modalFilteredCustomers.length} Parties Found
              </Badge>
            </div>
          </DialogHeader>

          {/* Search Input & Category Filters */}
          <div className="p-3 border-b border-border bg-background space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Type customer name, code (e.g. C001), mobile, or contact person..."
                value={modalSearchQuery}
                onChange={e => setModalSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 text-sm bg-muted/20 focus-visible:ring-primary/50"
              />
              {modalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setModalSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results List */}
          <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1 divide-y divide-border/40">
            {/* Option 0: Consolidated Overview (All Customers) */}
            <div
              onClick={() => selectCustomer('')}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                !selectedCustomerId
                  ? 'bg-primary/10 border-primary text-primary shadow-xs'
                  : 'bg-muted/30 border-dashed border-border hover:bg-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-2">
                    ★ View All Customers Overview &amp; Consolidated Outstanding
                    {!selectedCustomerId && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Displays table of all {allCustomers.length} credit parties ranked by outstanding balance
                  </p>
                </div>
              </div>
              <Button size="sm" variant={!selectedCustomerId ? 'default' : 'outline'} className="h-7 text-xs">
                {!selectedCustomerId ? 'Selected' : 'View All'}
              </Button>
            </div>

            {/* Matching Customer Items */}
            {modalFilteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="font-semibold text-sm">No customers matching "{modalSearchQuery}"</p>
                <p className="text-xs mt-1">Try another search keyword or clear filters.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setModalSearchQuery(''); setModalFilterCategory('ALL'); }}
                  className="mt-3 text-xs h-7"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              modalFilteredCustomers.map(c => {
                const isSelected = String(c.id) === String(selectedCustomerId);
                return (
                  <div
                    key={c.id}
                    onClick={() => selectCustomer(String(c.id))}
                    className={`p-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-primary/10 border border-primary ring-1 ring-primary/30'
                        : 'hover:bg-muted/50 border border-transparent hover:border-border'
                    }`}
                  >
                    {/* Left Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'
                        }`}
                      >
                        {c.customerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                            {c.customerName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 border-border">
                            {c.customerCode}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 truncate">
                          {c.contactPerson && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {c.contactPerson}
                            </span>
                          )}
                          {c.mobileNo && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3" /> {c.mobileNo}
                            </span>
                          )}
                          {(c.vehicles || []).length > 0 && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" /> {(c.vehicles || []).length} vehicle(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Financial Balance */}
                    <div className="flex items-center gap-3 shrink-0 ml-3 text-right">
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {c.creditLimit ? `Limit: ₹${Number(c.creditLimit).toLocaleString('en-IN')}` : 'No Limit'}
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        className={`h-7 px-2.5 text-xs ${isSelected ? 'bg-primary text-primary-foreground' : 'group-hover:border-primary group-hover:text-primary'}`}
                      >
                        {isSelected ? <Check className="w-3 h-3 mr-1" /> : null}
                        {isSelected ? 'Active' : 'Select'}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Tip: Click any party to view their chronological dispatch, payment &amp; running balance statement.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerModal(false)}
              className="h-7 text-xs px-3"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
