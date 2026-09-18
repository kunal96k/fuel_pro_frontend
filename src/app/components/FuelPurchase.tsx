import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Fuel,
  Plus,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Pencil,
  Trash2,
  Download,
  FileDown,
  CheckSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  Receipt,
  Building2,
  TrendingUp,
  Tag,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Printer,
  Droplet,
  Check,
  X,
  CalendarDays,
  CreditCard,
  Hash,
  Package,
  User,
  Percent,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
  Database,
  FlaskConical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchProducts,
  fetchTanks,
  formatDateToDMY,
  Product,
  Tank,
  fetchFuelPurchases,
  fetchNextFuelPurchaseVoucher,
  checkFuelPurchaseInvoiceExists,
  createFuelPurchaseApi,
  updateFuelPurchaseApi,
  deleteFuelPurchaseApi,
  FuelPurchaseRecord,
} from '../services/api';

export type { FuelPurchaseRecord };

const VENDOR_LIST = [
  'BPCL Mumbai Depot',
  'HPCL Pune Supply',
  'Indian Oil Corporation',
  'Nayara Energy',
  'Shell India Markets',
  'Reliance Petroleum Ltd.'
];

const PAYMENT_MODES = [
  'RTGS',
  'NEFT',
  'Cheque',
  'Cash',
  'Credit/Bill',
  'UPI',
  'DD'
];

// Helper to format currency INR
function formatCurrency(amount: number | undefined | null): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// Format numbers with commas
function fmtQty(val: number | undefined | null): string {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
}

// Current IST Date
function getISTDateString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

export function FuelPurchase() {
  // ── State for records & API ──
  const [records, setRecords] = useState<FuelPurchaseRecord[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  const hasActiveFilters = Boolean(
    searchTerm ||
    productFilter !== 'ALL' ||
    vendorFilter !== 'ALL' ||
    paymentModeFilter !== 'ALL' ||
    fromDateFilter ||
    toDateFilter
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setProductFilter('ALL');
    setVendorFilter('ALL');
    setPaymentModeFilter('ALL');
    setFromDateFilter('');
    setToDateFilter('');
    setCurrentPage(0);
  };

  // Table Selection & Sorting
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof FuelPurchaseRecord>('invoiceDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Unified Modal (Add / Edit / View)
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // Duplicate Invoice Validation State
  const [invoiceChecking, setInvoiceChecking] = useState(false);
  const [invoiceExistsError, setInvoiceExistsError] = useState('');
  const invoiceCheckTimeoutRef = React.useRef<any>(null);

  // Delete Confirmation Dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FuelPurchaseRecord | null>(null);

  // ── Form State ──
  const emptyForm = (): Omit<FuelPurchaseRecord, 'id'> => ({
    voucherNo: `VCH/FP/${new Date().getFullYear()}/001`,
    invoiceNo: '',
    invoiceDate: getISTDateString(),
    vendorName: '',
    supplyPlant: '',
    vehicleNo: '',
    tankId: '',
    tankName: '',
    density: '',
    ewayBillNo: '',
    productId: '',
    productName: '',
    quantity: 0,
    unit: 'Litre',
    rate: 0,
    totalValue: 0,
    taxableCharges: 0,
    vatAmount: 0,
    cessAmount: 0,
    otherCharges: 0,
    roundingOff: 0,
    totalAmount: 0,
    paymentMode: 'RTGS',
    remarks: ''
  });

  const [form, setForm] = useState<Omit<FuelPurchaseRecord, 'id'>>(emptyForm());

  // Load Records from Backend API
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFuelPurchases({
        search: searchTerm.trim() || undefined,
        product: productFilter !== 'ALL' ? productFilter : undefined,
        vendor: vendorFilter !== 'ALL' ? vendorFilter : undefined,
        paymentMode: paymentModeFilter !== 'ALL' ? paymentModeFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        page: currentPage,
        size: pageSize,
        sortBy: String(sortBy),
        sortDir: sortDir
      });
      setRecords(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load fuel purchases:', err);
      toast.error('Failed to load fuel purchases from server');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, productFilter, vendorFilter, paymentModeFilter, fromDateFilter, toDateFilter, currentPage, pageSize, sortBy, sortDir]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Load Master Products and Tanks
  useEffect(() => {
    async function loadMasters() {
      try {
        const [prodRes, tankRes] = await Promise.all([
          fetchProducts({ size: 100 }).catch(() => ({ content: [] })),
          fetchTanks({ size: 100 }).catch(() => ({ content: [] }))
        ]);
        setProducts(prodRes?.content || []);
        setTanks(tankRes?.content || []);
      } catch (err) {
        console.error('Failed to load master products/tanks:', err);
      }
    }
    loadMasters();
  }, []);

  const fuelProducts = useMemo(() => {
    if (products.length > 0) {
      return products.filter(p => !p.category || p.category === 'Fuel');
    }
    return [
      { id: '1', name: 'Petrol', category: 'Fuel' as const, unit: 'Litre', hsnCode: '27101241' },
      { id: '2', name: 'Diesel', category: 'Fuel' as const, unit: 'Litre', hsnCode: '27101930' },
      { id: '3', name: 'Speed / XP95', category: 'Fuel' as const, unit: 'Litre', hsnCode: '27101242' }
    ];
  }, [products]);

  const availableTanks = useMemo(() => {
    if (tanks.length > 0) return tanks;
    return [
      { id: '1', tankName: 'Tank 1 (Petrol 20KL)', fuelType: 'Petrol', capacity: 20000, currentStock: 12000 },
      { id: '2', tankName: 'Tank 2 (Diesel 25KL)', fuelType: 'Diesel', capacity: 25000, currentStock: 16500 },
      { id: '3', tankName: 'Tank 3 (Speed 15KL)', fuelType: 'Speed', capacity: 15000, currentStock: 8000 }
    ];
  }, [tanks]);

  // Recalculate totals
  const handleRecalculate = useCallback((data: typeof form) => {
    const qty = Number(data.quantity) || 0;
    const rate = Number(data.rate) || 0;
    const baseVal = Math.round(qty * rate * 100) / 100;

    const taxableChg = Number(data.taxableCharges) || 0;
    const vat = Number(data.vatAmount) || 0;
    const cess = Number(data.cessAmount) || 0;
    const other = Number(data.otherCharges) || 0;
    const rounding = Number(data.roundingOff) || 0;

    const netTotal = Math.round((baseVal + taxableChg + vat + cess + other + rounding) * 100) / 100;

    return {
      ...data,
      totalValue: baseVal,
      totalAmount: netTotal
    };
  }, []);

  const handleFieldChange = (field: keyof typeof form, value: any) => {
    setForm(prev => {
      let updated = { ...prev, [field]: value };

      if (field === 'productId') {
        const matchedProd = fuelProducts.find(p => p.id === value);
        if (matchedProd) {
          updated.productName = matchedProd.name;
          updated.unit = matchedProd.unit || 'Litre';
        }
      }

      if (field === 'tankId') {
        if (!value || value === 'NONE') {
          updated.tankId = '';
          updated.tankName = '';
        } else {
          const matchedTank = availableTanks.find(t => String(t.id) === String(value));
          if (matchedTank) {
            updated.tankName = matchedTank.tankName;
          }
        }
      }

      if (['quantity', 'rate', 'taxableCharges', 'vatAmount', 'cessAmount', 'otherCharges', 'roundingOff'].includes(field)) {
        updated = handleRecalculate(updated);
      }

      return updated;
    });
  };

  // ── Debounced Invoice Duplication Check ──
  const handleInvoiceChange = (val: string) => {
    handleFieldChange('invoiceNo', val);
    const trimmed = val.trim();
    if (!trimmed) {
      setInvoiceExistsError('');
      return;
    }
    if (invoiceCheckTimeoutRef.current) {
      clearTimeout(invoiceCheckTimeoutRef.current);
    }
    setInvoiceChecking(true);
    invoiceCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await checkFuelPurchaseInvoiceExists(
          trimmed,
          modalMode === 'edit' && activeRecordId ? activeRecordId : undefined
        );
        if (res.exists) {
          setInvoiceExistsError(`Invoice number "${trimmed}" already exists in the system!`);
        } else {
          setInvoiceExistsError('');
        }
      } catch {
        setInvoiceExistsError('');
      } finally {
        setInvoiceChecking(false);
      }
    }, 400);
  };

  // ── Open Add Modal (Auto-fetch Next Voucher) ──
  const handleAddNew = async () => {
    setModalMode('add');
    setActiveRecordId(null);
    setInvoiceExistsError('');
    let autoVoucher = `VCH/FP/${new Date().getFullYear()}/001`;
    try {
      autoVoucher = await fetchNextFuelPurchaseVoucher();
    } catch {
      autoVoucher = `VCH/FP/${new Date().getFullYear()}/${String(totalElements + 1).padStart(3, '0')}`;
    }
    const initial = emptyForm();
    initial.voucherNo = autoVoucher;
    if (fuelProducts.length > 0) {
      initial.productId = fuelProducts[0].id;
      initial.productName = fuelProducts[0].name;
      initial.unit = fuelProducts[0].unit || 'Litre';
    }
    if (VENDOR_LIST.length > 0) {
      initial.vendorName = VENDOR_LIST[0];
    }
    setForm(initial);
    setShowModal(true);
  };

  // ── Open Edit Modal ──
  const handleEdit = (rec: FuelPurchaseRecord) => {
    setModalMode('edit');
    setActiveRecordId(rec.id);
    setInvoiceExistsError('');
    const { id, createdAt, updatedAt, ...rest } = rec;
    setForm(rest);
    setShowModal(true);
  };

  // ── Open View Modal ──
  const handleView = (rec: FuelPurchaseRecord) => {
    setModalMode('view');
    setActiveRecordId(rec.id);
    setInvoiceExistsError('');
    const { id, createdAt, updatedAt, ...rest } = rec;
    setForm(rest);
    setShowModal(true);
  };

  // ── Open Delete Confirm ──
  const handleDeleteClick = (rec: FuelPurchaseRecord) => {
    setRecordToDelete(rec);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await deleteFuelPurchaseApi(recordToDelete.id);
      toast.success(`Purchase voucher ${recordToDelete.voucherNo} deleted successfully.`);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      loadRecords();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete fuel purchase.');
    }
  };

  // ── Form Submit ──
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.invoiceNo.trim()) {
      toast.error('Invoice Number is required.');
      return;
    }
    if (invoiceExistsError) {
      toast.error(invoiceExistsError);
      return;
    }
    if (!form.vendorName.trim()) {
      toast.error('Please select or specify the Vendor Name.');
      return;
    }
    if (!form.productName) {
      toast.error('Please select a Product.');
      return;
    }
    if (form.quantity <= 0) {
      toast.error('Quantity must be greater than 0.');
      return;
    }
    if (form.rate <= 0) {
      toast.error('Rate per Litre must be greater than 0.');
      return;
    }

    const calculated = handleRecalculate(form);
    setIsSubmitting(true);

    try {
      if (modalMode === 'add') {
        const saved = await createFuelPurchaseApi(calculated);
        toast.success(`Fuel purchase ${saved.voucherNo} recorded successfully!`);
        setShowModal(false);
        loadRecords();
      } else if (activeRecordId) {
        const updated = await updateFuelPurchaseApi(activeRecordId, calculated);
        toast.success(`Fuel purchase ${updated.voucherNo} updated successfully!`);
        setShowModal(false);
        loadRecords();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save fuel purchase.');
      if (err.message && err.message.toLowerCase().includes('already exists')) {
        setInvoiceExistsError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginated = records;

  const handleSortToggle = (col: keyof FuelPurchaseRecord) => {
    if (sortBy === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const SortIcon = ({ field }: { field: keyof FuelPurchaseRecord }) => {
    if (sortBy !== field) return <ArrowUpDown className="inline w-3 h-3 ml-1 text-muted-foreground/40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="inline w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="inline w-3 h-3 ml-1 text-primary" />;
  };

  // Selection
  const handleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(r => r.id)));
    }
  };

  const handleSelectRecord = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Export handlers
  const handleExportAll = (format: 'csv' | 'excel' | 'pdf') => {
    const dataToExport = records;
    if (dataToExport.length === 0) {
      toast.warning('No records to export.');
      return;
    }

    if (format === 'csv') {
      const headers = ['Voucher No', 'Invoice No', 'Date', 'Vendor', 'Product', 'Qty (L)', 'Rate', 'Base Value', 'VAT', 'Cess', 'Total Amount', 'Payment Mode'];
      const rows = dataToExport.map(r => [
        `"${r.voucherNo}"`,
        `"${r.invoiceNo}"`,
        `"${r.invoiceDate}"`,
        `"${r.vendorName}"`,
        `"${r.productName}"`,
        r.quantity,
        r.rate,
        r.totalValue,
        r.vatAmount,
        r.cessAmount,
        r.totalAmount,
        `"${r.paymentMode}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csvContent);
      link.download = `fuel_purchases_${getISTDateString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${dataToExport.length} records to CSV!`);
    } else if (format === 'excel') {
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/></head><body><h2>Fuel Purchase Report</h2><table border="1"><tr style="background:#f1f5f9;font-weight:bold;"><th>Voucher No</th><th>Invoice No</th><th>Date</th><th>Vendor</th><th>Product</th><th>Qty (L)</th><th>Rate</th><th>Base Value</th><th>VAT</th><th>Cess</th><th>Total Amount</th></tr>${dataToExport.map(r => `<tr><td>${r.voucherNo}</td><td>${r.invoiceNo}</td><td>${r.invoiceDate}</td><td>${r.vendorName}</td><td>${r.productName}</td><td>${r.quantity}</td><td>${r.rate}</td><td>${r.totalValue}</td><td>${r.vatAmount}</td><td>${r.cessAmount}</td><td>${r.totalAmount}</td></tr>`).join('')}</table></body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fuel_purchases_${getISTDateString()}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${dataToExport.length} records to Excel!`);
    } else if (format === 'pdf') {
      handlePrintPDF(dataToExport);
    }
  };

  const handleExportSelected = (format: 'csv' | 'excel' | 'pdf') => {
    if (selectedIds.size === 0) {
      toast.warning('Please select at least one record to export.');
      return;
    }
    const dataToExport = records.filter(r => selectedIds.has(r.id));
    if (format === 'csv') {
      const headers = ['Voucher No', 'Invoice No', 'Date', 'Vendor', 'Product', 'Qty (L)', 'Rate', 'Base Value', 'VAT', 'Cess', 'Total Amount'];
      const rows = dataToExport.map(r => [
        `"${r.voucherNo}"`, `"${r.invoiceNo}"`, `"${r.invoiceDate}"`, `"${r.vendorName}"`, `"${r.productName}"`, r.quantity, r.rate, r.totalValue, r.vatAmount, r.cessAmount, r.totalAmount
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const link = document.createElement('a');
      link.href = encodeURI(csvContent);
      link.download = `fuel_purchases_selected_${getISTDateString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${dataToExport.length} selected records to CSV!`);
    } else if (format === 'excel') {
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"/></head><body><h2>Selected Fuel Purchases</h2><table border="1"><tr><th>Voucher No</th><th>Invoice No</th><th>Date</th><th>Vendor</th><th>Product</th><th>Qty</th><th>Total Amount</th></tr>${dataToExport.map(r => `<tr><td>${r.voucherNo}</td><td>${r.invoiceNo}</td><td>${r.invoiceDate}</td><td>${r.vendorName}</td><td>${r.productName}</td><td>${r.quantity}</td><td>${r.totalAmount}</td></tr>`).join('')}</table></body></html>`;
      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fuel_purchases_selected_${getISTDateString()}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${dataToExport.length} selected records to Excel!`);
    } else if (format === 'pdf') {
      handlePrintPDF(dataToExport);
    }
  };

  const handlePrintPDF = (data: FuelPurchaseRecord[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow popups to print/export PDF.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fuel Purchase Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
          .meta { font-size: 11px; text-align: right; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-weight: 600; }
          td { border: 1px solid #e2e8f0; padding: 6px 8px; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>FUEL PURCHASE REPORT</h1>
            <p>Fuel Station Operations</p>
          </div>
          <div class="meta">
            <p><strong>Report Date:</strong> ${formatDateToDMY(getISTDateString())}</p>
            <p><strong>Total Records:</strong> ${data.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Voucher No</th><th>Invoice No</th><th>Date</th><th>Vendor</th><th>Product</th>
              <th class="text-right">Qty (L)</th><th class="text-right">Rate</th><th class="text-right">Base Value</th>
              <th class="text-right">VAT</th><th class="text-right">Cess</th><th class="text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr>
                <td class="font-mono">${r.voucherNo}</td>
                <td class="font-mono">${r.invoiceNo}</td>
                <td>${formatDateToDMY(r.invoiceDate)}</td>
                <td>${r.vendorName}</td>
                <td>${r.productName}</td>
                <td class="text-right font-mono">${fmtQty(r.quantity)} L</td>
                <td class="text-right font-mono">₹${r.rate.toFixed(2)}</td>
                <td class="text-right font-mono">₹${r.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="text-right font-mono">₹${r.vatAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="text-right font-mono">₹${r.cessAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="text-right font-mono" style="font-weight:bold;color:#1d4ed8">₹${r.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const isView = modalMode === 'view';

  return (
    <div className="p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Fuel Purchase</h1>
          <p className="text-sm text-muted-foreground">Records of petrol, diesel and other fuel purchases from vendors</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          New Purchase
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
            <p className="text-2xl font-bold mt-1 font-mono">
              {fmtQty(records.reduce((s, r) => s + (Number(r.quantity) || 0), 0))} L
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Value (before charges)</p>
            <p className="text-2xl font-bold mt-1 font-mono">
              {formatCurrency(records.reduce((s, r) => s + (Number(r.totalValue) || 0), 0))}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Amount Paid</p>
            <p className="text-2xl font-bold mt-1 font-mono">
              {formatCurrency(records.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-card p-4 rounded-lg border border-border flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendor, invoice, voucher…"
              className="pl-9"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">From</label>
            <Input
              type="date"
              value={fromDateFilter}
              onChange={e => { setFromDateFilter(e.target.value); setCurrentPage(0); }}
              className="h-9 w-36 text-xs bg-background"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">To</label>
            <Input
              type="date"
              value={toDateFilter}
              onChange={e => { setToDateFilter(e.target.value); setCurrentPage(0); }}
              className="h-9 w-36 text-xs bg-background"
            />
          </div>

          {/* Product Filter */}
          <div className="w-36">
            <Select value={productFilter} onValueChange={v => { setProductFilter(v); setCurrentPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Products</SelectItem>
                {fuelProducts.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor Filter */}
          <div className="w-40">
            <Select value={vendorFilter} onValueChange={v => { setVendorFilter(v); setCurrentPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Vendors</SelectItem>
                {VENDOR_LIST.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Mode Filter */}
          <div className="w-36">
            <Select value={paymentModeFilter} onValueChange={v => { setPaymentModeFilter(v); setCurrentPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modes</SelectItem>
                {PAYMENT_MODES.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground h-9 px-2 gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                Export All Matching
              </div>
              <DropdownMenuItem onClick={() => handleExportAll('csv')} className="cursor-pointer text-xs">
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export All to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll('excel')} className="cursor-pointer text-xs">
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export All to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll('pdf')} className="cursor-pointer text-xs">
                <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
                Export All to PDF
              </DropdownMenuItem>
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider border-t border-border mt-1">
                Export Selected ({selectedIds.size})
              </div>
              <DropdownMenuItem onClick={() => handleExportSelected('csv')} className="cursor-pointer text-xs" disabled={selectedIds.size === 0}>
                <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />
                Export Selected to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportSelected('excel')} className="cursor-pointer text-xs" disabled={selectedIds.size === 0}>
                <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />
                Export Selected to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportSelected('pdf')} className="cursor-pointer text-xs" disabled={selectedIds.size === 0}>
                <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />
                Export Selected to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Main Table ── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading fuel purchases...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Fuel className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No fuel purchase records found</p>
              <p className="text-xs">
                {(searchTerm || productFilter !== 'ALL' || vendorFilter !== 'ALL' || fromDateFilter || toDateFilter)
                  ? 'Try relaxing your search or filter inputs.'
                  : 'Click "New Purchase" to create the first record.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="w-10 text-center p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer align-middle rounded border-border"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('voucherNo')}>
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" /> Voucher No.<SortIcon field="voucherNo" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('invoiceNo')}>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground" /> Invoice No.<SortIcon field="invoiceNo" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('invoiceDate')}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date<SortIcon field="invoiceDate" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('vendorName')}>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Vendor<SortIcon field="vendorName" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('productName')}>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-muted-foreground" /> Product<SortIcon field="productName" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('quantity')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Droplet className="w-3.5 h-3.5 text-muted-foreground" /> Qty (L)<SortIcon field="quantity" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('rate')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /> Rate/L<SortIcon field="rate" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('totalValue')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /> Total Value<SortIcon field="totalValue" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('vatAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" /> VAT<SortIcon field="vatAmount" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('cessAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" /> Cess<SortIcon field="cessAmount" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('totalAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /> Total Amount<SortIcon field="totalAmount" />
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                    <td className="w-10 text-center p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="w-4 h-4 cursor-pointer align-middle rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{record.voucherNo}</td>
                    <td className="px-4 py-3 text-sm font-semibold font-mono text-primary">{record.invoiceNo}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDateToDMY(record.invoiceDate)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-foreground">{record.vendorName}</div>
                      {record.vehicleNo && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground font-mono">
                          <Truck className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{record.vehicleNo}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                          record.productName.toLowerCase().includes('petrol')
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                        }`}>
                          {record.productName}
                        </span>
                        {record.tankName && (
                          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                            <Database className="w-2.5 h-2.5 shrink-0" />
                            {record.tankName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {fmtQty(record.quantity)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      ₹{record.rate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(record.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      {formatCurrency(record.vatAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      {formatCurrency(record.cessAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {formatCurrency(record.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(record)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t font-semibold text-sm">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-muted-foreground">
                    Total ({paginated.length} records)
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fmtQty(paginated.reduce((s, r) => s + r.quantity, 0))} L
                  </td>
                  <td></td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(paginated.reduce((s, r) => s + r.totalValue, 0))}
                  </td>
                  <td></td>
                  <td></td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(paginated.reduce((s, r) => s + r.totalAmount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalElements > 0 && (
          <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
              >
                Previous
              </Button>
              <div className="text-sm font-medium px-2 text-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          NEW / EDIT / VIEW FUEL PURCHASE MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0 max-w-5xl sm:max-w-5xl"
          style={{ maxWidth: '1100px', width: '95vw', maxHeight: '92vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-5 py-3.5 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Fuel className="w-5 h-5 text-primary" />
                {modalMode === 'add'
                  ? 'New Fuel Purchase'
                  : modalMode === 'edit'
                    ? 'Edit Fuel Purchase'
                    : `Purchase Record — ${form.voucherNo}`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-xs mt-0.5">
              Record a fuel purchase invoice with all charges and tax details.
            </DialogDescription>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-4 space-y-3.5">
              
              {/* ─────────────────────────────────
                  SECTION 1: VOUCHER & INVOICE INFORMATION
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  1. Voucher &amp; Invoice Information
                </h3>

                {/* Top Row: Voucher, Invoice, Date, Payment Mode */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Hash className="w-3 h-3 text-muted-foreground" /> Voucher Number
                    </Label>
                    <Input
                      value={form.voucherNo}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs font-mono bg-muted/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-muted-foreground" /> Invoice Number <span className="text-red-500 font-bold">*</span>
                      </Label>
                      {invoiceChecking && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-primary" /> Checking...
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder="e.g. 4582662732 or INV-2024-8841"
                      value={form.invoiceNo}
                      onChange={e => handleInvoiceChange(e.target.value)}
                      disabled={isView || isSubmitting}
                      className={`h-9 text-xs font-mono ${invoiceExistsError ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/30 dark:bg-red-950/20' : ''} ${isView ? 'bg-muted/60' : 'bg-background'}`}
                      required={!isView}
                    />
                    {invoiceExistsError && (
                      <div className="text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded border border-red-200 dark:border-red-900/50">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                        <span>{invoiceExistsError}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" /> Invoice Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.invoiceDate}
                      onChange={e => handleFieldChange('invoiceDate', e.target.value)}
                      disabled={isView}
                      className={`h-9 text-xs ${isView ? 'bg-muted/60' : 'bg-background'}`}
                      required={!isView}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-muted-foreground" /> Payment Mode
                    </Label>
                    <Select
                      value={form.paymentMode}
                      onValueChange={v => handleFieldChange('paymentMode', v)}
                      disabled={isView}
                    >
                      <SelectTrigger className={`h-9 text-xs w-full ${isView ? 'bg-muted/60' : 'bg-background'}`}>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vendor, Depot, Tank Lorry Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-muted-foreground" /> Name of Vendor <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.vendorName}
                      onValueChange={v => handleFieldChange('vendorName', v)}
                      disabled={isView}
                    >
                      <SelectTrigger className={`h-9 text-xs w-full ${isView ? 'bg-muted/60' : 'bg-background'}`}>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_LIST.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-muted-foreground" /> Supply Depot / Plant <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. 5430 - BPCL Manmad Depot"
                      value={form.supplyPlant || ''}
                      onChange={e => handleFieldChange('supplyPlant', e.target.value)}
                      disabled={isView}
                      className={`h-9 text-xs ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Truck className="w-3 h-3 text-muted-foreground" /> Tank Lorry / Vehicle No. <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. MH-12-RN-4819"
                      value={form.vehicleNo || ''}
                      onChange={e => handleFieldChange('vehicleNo', e.target.value.toUpperCase())}
                      disabled={isView}
                      className={`h-9 text-xs font-mono uppercase ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 2: PRODUCT, TANK & QUANTITY DETAILS
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  2. Product, Tank &amp; Quantity Details
                </h3>

                {/* Row 1: Product, Target Tank, Density, E-Way Bill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-muted-foreground" /> Product <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.productId}
                      onValueChange={v => handleFieldChange('productId', v)}
                      disabled={isView}
                    >
                      <SelectTrigger className={`h-9 text-xs w-full ${isView ? 'bg-muted/60' : 'bg-background'}`}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelProducts.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Database className="w-3 h-3 text-muted-foreground" /> Storage Tank <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Select
                      value={form.tankId || 'NONE'}
                      onValueChange={v => handleFieldChange('tankId', v)}
                      disabled={isView}
                    >
                      <SelectTrigger className={`h-9 text-xs w-full ${isView ? 'bg-muted/60' : 'bg-background'}`}>
                        <SelectValue placeholder="Select tank (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None / Direct Dispatch</SelectItem>
                        {availableTanks.map(t => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.tankName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <FlaskConical className="w-3 h-3 text-muted-foreground" /> Density @ 15°C <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 745.2 (kg/m³)"
                      value={form.density || ''}
                      onChange={e => handleFieldChange('density', e.target.value ? Number(e.target.value) : '')}
                      disabled={isView}
                      className={`h-9 text-xs font-mono text-right ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-muted-foreground" /> E-Way Bill No. <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. 231581914374"
                      value={form.ewayBillNo || ''}
                      onChange={e => handleFieldChange('ewayBillNo', e.target.value)}
                      disabled={isView}
                      className={`h-9 text-xs font-mono ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>
                </div>

                {/* Row 2: Qty, Unit, Rate, Total Value */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">
                      Quantity (L) <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 4000, 12000, 20000"
                      value={form.quantity || ''}
                      onChange={e => handleFieldChange('quantity', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-medium ${isView ? 'bg-muted/60' : 'bg-background'}`}
                      required={!isView}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Unit</Label>
                    <Select
                      value={form.unit}
                      onValueChange={v => handleFieldChange('unit', v)}
                      disabled={isView}
                    >
                      <SelectTrigger className={`h-9 text-xs w-full ${isView ? 'bg-muted/60' : 'bg-background'}`}>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Litre">Litre</SelectItem>
                        <SelectItem value="KL">KL</SelectItem>
                        <SelectItem value="Kg">Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">
                      Rate Per Unit (₹) <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 91.17"
                      value={form.rate || ''}
                      onChange={e => handleFieldChange('rate', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-medium ${isView ? 'bg-muted/60' : 'bg-background'}`}
                      required={!isView}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Total Value (₹)</Label>
                    <Input
                      value={formatCurrency(form.totalValue)}
                      readOnly
                      tabIndex={-1}
                      className="h-9 text-xs text-right font-semibold font-mono bg-muted/60"
                    />
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 3: CHARGES & TAXES
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  3. Charges &amp; Taxes (VAT / Non-GST)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Taxable Charges (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.taxableCharges || ''}
                      onChange={e => handleFieldChange('taxableCharges', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-mono ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">VAT (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.vatAmount || ''}
                      onChange={e => handleFieldChange('vatAmount', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-mono text-orange-600 font-medium ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Cess (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.cessAmount || ''}
                      onChange={e => handleFieldChange('cessAmount', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-mono text-orange-600 font-medium ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Other Charges (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.otherCharges || ''}
                      onChange={e => handleFieldChange('otherCharges', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-mono ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Rounding Off (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. -0.50"
                      value={form.roundingOff || ''}
                      onChange={e => handleFieldChange('roundingOff', Number(e.target.value))}
                      disabled={isView}
                      className={`h-9 text-xs text-right font-mono ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>
                </div>

                {/* Summary Calculation Box */}
                <div className="flex justify-end pt-2">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 text-right min-w-[280px]">
                    <div className="space-y-1 text-xs mb-2 text-muted-foreground">
                      <div className="flex justify-between gap-6">
                        <span>Total Value</span>
                        <span className="font-mono">{formatCurrency(form.totalValue)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>Taxable Charges</span>
                        <span className="font-mono">+{formatCurrency(form.taxableCharges)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>VAT</span>
                        <span className="font-mono text-orange-600">+{formatCurrency(form.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>Cess</span>
                        <span className="font-mono text-orange-600">+{formatCurrency(form.cessAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>Other Charges</span>
                        <span className="font-mono">+{formatCurrency(form.otherCharges)}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>Rounding Off</span>
                        <span className="font-mono">
                          {form.roundingOff >= 0 ? `+${formatCurrency(form.roundingOff)}` : formatCurrency(form.roundingOff)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between gap-6 items-center">
                      <span className="font-bold text-sm">Total Amount</span>
                      <span className="font-bold text-primary text-base font-mono">
                        {formatCurrency(form.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 4: REMARKS
              ───────────────────────────────── */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Remarks</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Unloaded into Tank-1; Chamber seals and density verified OK"
                  value={form.remarks || ''}
                  onChange={e => handleFieldChange('remarks', e.target.value)}
                  disabled={isView}
                  className={`resize-none text-xs ${isView ? 'bg-muted/60' : 'bg-background'}`}
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-border shrink-0 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                {isView ? 'Close' : 'Cancel'}
              </Button>
              {!isView && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || Boolean(invoiceExistsError)}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {modalMode === 'add' ? 'Save Purchase' : 'Save Changes'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          DELETE CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Are you sure you want to delete purchase voucher{' '}
                  <strong className="text-foreground font-mono">{recordToDelete?.voucherNo}</strong> (Invoice: {recordToDelete?.invoiceNo})?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
