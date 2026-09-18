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
  Package,
  Plus,
  Calendar,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  FileDown,
  CheckSquare,
  FileText,
  AlertTriangle,
  IndianRupee,
  Receipt,
  Building2,
  Truck,
  Layers,
  Sparkles,
  Printer,
  Droplet,
  Check,
  X,
  CreditCard,
  Hash,
  Boxes,
  Percent,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchProducts,
  formatDateToDMY,
  Product,
  fetchOilPurchases,
  createOilPurchaseApi,
  updateOilPurchaseApi,
  deleteOilPurchaseApi,
  fetchNextOilPurchaseVoucher,
  checkOilPurchaseInvoiceExists,
  OilPurchaseRecord,
  OilPurchaseItem,
} from '../services/api';

// ─────────────────────────────────────────────────────────────
// Master Data Catalog for Lubricants, DEF & Coolants
// ─────────────────────────────────────────────────────────────

const DEFAULT_LUBE_CATALOG: Array<{
  id: string;
  name: string;
  hsnCode: string;
  defaultPackType: 'PAI' | 'CS' | 'CAN' | 'BOT' | 'PCS';
  defaultVol: number;
  defaultRate: number;
  gstRate: number;
}> = [
  { id: 'LUB-01', name: 'MAK ADBLUE 20 LTR PAIL', hsnCode: '31021000', defaultPackType: 'PAI', defaultVol: 20, defaultRate: 71.33, gstRate: 18 },
  { id: 'LUB-02', name: 'MAK ADBLUE 10 LTR PAIL', hsnCode: '31021000', defaultPackType: 'PAI', defaultVol: 10, defaultRate: 77.12, gstRate: 18 },
  { id: 'LUB-03', name: 'MAK DIAMOND-1 Ltr Case (12 x 1L)', hsnCode: '271019', defaultPackType: 'CS', defaultVol: 12, defaultRate: 267.29, gstRate: 18 },
  { id: 'LUB-04', name: 'MAK 4T Plus (SL 20W-40) 1L x 12', hsnCode: '271019', defaultPackType: 'CS', defaultVol: 12, defaultRate: 278.95, gstRate: 18 },
  { id: 'LUB-05', name: 'MAK REDI KOOL-1 L (12 x 1L)', hsnCode: '38200000', defaultPackType: 'CS', defaultVol: 12, defaultRate: 161.36, gstRate: 18 },
  { id: 'LUB-06', name: 'MAK ELITE 5W-30 (Synthetic) 3.5L', hsnCode: '271019', defaultPackType: 'CAN', defaultVol: 3.5, defaultRate: 485.00, gstRate: 18 },
  { id: 'LUB-07', name: 'MAK SPIROL EP 90 (Gear Oil) 1L x 12', hsnCode: '271019', defaultPackType: 'CS', defaultVol: 12, defaultRate: 215.50, gstRate: 18 },
  { id: 'LUB-08', name: 'SERVO 4T Synth 10W-30 1L x 12', hsnCode: '271019', defaultPackType: 'CS', defaultVol: 12, defaultRate: 285.00, gstRate: 18 },
  { id: 'LUB-09', name: 'CASTROL Activ 4T 20W-40 1L x 12', hsnCode: '271019', defaultPackType: 'CS', defaultVol: 12, defaultRate: 310.00, gstRate: 18 }
];

const VENDOR_LIST = [
  { name: 'Bharat Petroleum Corp. Ltd (Nashik Lubes C&F)', gstin: '27AAACB2902M1ZT', plant: '5430' },
  { name: 'Bharat Petroleum Corp. Ltd (Mumbai Depot)', gstin: '27AAACB2902M1ZT', plant: '5410' },
  { name: 'Indian Oil Corporation Ltd (Lubes Division)', gstin: '27AAACI1681G1ZM', plant: '4210' },
  { name: 'Hindustan Petroleum Corp. Ltd (Lube Plant)', gstin: '27AAACH1118M1ZW', plant: '3310' },
  { name: 'Castrol India Limited (Regional Depot)', gstin: '27AAACC2022C1ZR', plant: '1020' },
  { name: 'Gulf Oil Lubricants India Ltd', gstin: '27AAACG0421Q1ZS', plant: '2015' }
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

// Format numbers
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

export function OilPurchase() {
  // ── State for records ──
  const [records, setRecords] = useState<OilPurchaseRecord[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  // Table Selection & Sorting
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<keyof OilPurchaseRecord>('invoiceDate');
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
  const [recordToDelete, setRecordToDelete] = useState<OilPurchaseRecord | null>(null);

  // View Invoice Detail Modal
  const [viewInvoiceRecord, setViewInvoiceRecord] = useState<OilPurchaseRecord | null>(null);
  const [showViewInvoice, setShowViewInvoice] = useState(false);

  // ── Form State ──
  const createBlankItem = (): OilPurchaseItem => ({
    productId: DEFAULT_LUBE_CATALOG[0].id,
    productName: DEFAULT_LUBE_CATALOG[0].name,
    hsnCode: DEFAULT_LUBE_CATALOG[0].hsnCode,
    batchNo: '',
    packType: DEFAULT_LUBE_CATALOG[0].defaultPackType,
    packQty: 1,
    volumePerPack: DEFAULT_LUBE_CATALOG[0].defaultVol,
    totalVolume: DEFAULT_LUBE_CATALOG[0].defaultVol,
    ratePerUnit: DEFAULT_LUBE_CATALOG[0].defaultRate,
    grossAmount: DEFAULT_LUBE_CATALOG[0].defaultVol * DEFAULT_LUBE_CATALOG[0].defaultRate,
    discount: 0,
    taxableValue: DEFAULT_LUBE_CATALOG[0].defaultVol * DEFAULT_LUBE_CATALOG[0].defaultRate,
    gstRate: 18,
    cgstAmount: Math.round((DEFAULT_LUBE_CATALOG[0].defaultVol * DEFAULT_LUBE_CATALOG[0].defaultRate * 0.09) * 100) / 100,
    sgstAmount: Math.round((DEFAULT_LUBE_CATALOG[0].defaultVol * DEFAULT_LUBE_CATALOG[0].defaultRate * 0.09) * 100) / 100,
    itemTotal: Math.round((DEFAULT_LUBE_CATALOG[0].defaultVol * DEFAULT_LUBE_CATALOG[0].defaultRate * 1.18) * 100) / 100
  });

  const emptyForm = (): Omit<OilPurchaseRecord, 'id'> => ({
    voucherNo: `VCH/OP/${new Date().getFullYear()}/001`,
    invoiceNo: '',
    invoiceDate: getISTDateString(),
    vendorName: VENDOR_LIST[0].name,
    vendorGstin: VENDOR_LIST[0].gstin,
    supplyPlant: VENDOR_LIST[0].plant,
    vehicleNo: '',
    transporterName: '',
    ewayBillNo: '',
    paymentMode: 'RTGS',
    items: [createBlankItem()],
    totalGrossAmount: 0,
    totalDiscount: 0,
    totalTaxableValue: 0,
    totalCgstAmount: 0,
    totalSgstAmount: 0,
    cashDiscount: 0,
    roundingOff: 0,
    totalInvoiceAmount: 0,
    remarks: ''
  });

  const [form, setForm] = useState<Omit<OilPurchaseRecord, 'id'>>(emptyForm());

  // Load Records from Backend API
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchOilPurchases({
        search: searchTerm.trim() || undefined,
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
      console.error('Failed to load oil purchases:', err);
      toast.error('Failed to load oil purchases from server');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, vendorFilter, paymentModeFilter, fromDateFilter, toDateFilter, currentPage, pageSize, sortBy, sortDir]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Load Master Products
  useEffect(() => {
    async function loadMasters() {
      try {
        const prodRes = await fetchProducts({ size: 100 }).catch(() => ({ content: [] }));
        setProducts(prodRes?.content || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    }
    loadMasters();
  }, []);

  // Combined Catalog (Static defaults + Master Products tagged with Lubricants/DEF/Oil)
  const catalogList = useMemo(() => {
    const combined = [...DEFAULT_LUBE_CATALOG];
    products.forEach(p => {
      if (!combined.some(c => c.name.toLowerCase() === p.name.toLowerCase())) {
        combined.push({
          id: String(p.id),
          name: p.name,
          hsnCode: p.hsnCode || '271019',
          defaultPackType: 'CS',
          defaultVol: 1,
          defaultRate: 250,
          gstRate: 18
        });
      }
    });
    return combined;
  }, [products]);

  // Recalculate Line Item and Totals
  const recalculateItem = (item: OilPurchaseItem): OilPurchaseItem => {
    const qty = Number(item.packQty) || 0;
    const volPerPack = Number(item.volumePerPack) || 0;
    const totalVol = Math.round(qty * volPerPack * 100) / 100;
    const rate = Number(item.ratePerUnit) || 0;
    const gross = Math.round(totalVol * rate * 100) / 100;
    const disc = Number(item.discount) || 0;
    const taxable = Math.max(0, Math.round((gross - disc) * 100) / 100);

    const halfGst = (Number(item.gstRate) || 18) / 2;
    const cgst = Math.round(((taxable * halfGst) / 100) * 100) / 100;
    const sgst = Math.round(((taxable * halfGst) / 100) * 100) / 100;
    const total = Math.round((taxable + cgst + sgst) * 100) / 100;

    return {
      ...item,
      totalVolume: totalVol,
      grossAmount: gross,
      taxableValue: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      itemTotal: total
    };
  };

  const recalculateFormTotals = useCallback((formData: typeof form): typeof form => {
    const updatedItems = formData.items.map(recalculateItem);

    const grossSum = updatedItems.reduce((s, itm) => s + itm.grossAmount, 0);
    const discSum = updatedItems.reduce((s, itm) => s + itm.discount, 0);
    const taxableSum = updatedItems.reduce((s, itm) => s + itm.taxableValue, 0);
    const cgstSum = updatedItems.reduce((s, itm) => s + itm.cgstAmount, 0);
    const sgstSum = updatedItems.reduce((s, itm) => s + itm.sgstAmount, 0);

    const cashDisc = Number(formData.cashDiscount) || 0;
    const roundOff = Number(formData.roundingOff) || 0;

    const netPayable = Math.round((taxableSum + cgstSum + sgstSum - cashDisc + roundOff) * 100) / 100;

    return {
      ...formData,
      items: updatedItems,
      totalGrossAmount: Math.round(grossSum * 100) / 100,
      totalDiscount: Math.round(discSum * 100) / 100,
      totalTaxableValue: Math.round(taxableSum * 100) / 100,
      totalCgstAmount: Math.round(cgstSum * 100) / 100,
      totalSgstAmount: Math.round(sgstSum * 100) / 100,
      totalInvoiceAmount: netPayable
    };
  }, []);

  // Update item field
  const handleItemChange = (index: number, field: keyof OilPurchaseItem, value: any) => {
    setForm(prev => {
      const newItems = [...prev.items];
      let currentItem = { ...newItems[index], [field]: value };

      if (field === 'productId') {
        const found = catalogList.find(c => c.id === value);
        if (found) {
          currentItem.productName = found.name;
          currentItem.hsnCode = found.hsnCode;
          currentItem.packType = found.defaultPackType;
          currentItem.volumePerPack = found.defaultVol;
          currentItem.ratePerUnit = found.defaultRate;
          currentItem.gstRate = found.gstRate;
        }
      }

      newItems[index] = recalculateItem(currentItem);
      return recalculateFormTotals({ ...prev, items: newItems });
    });
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setForm(prev => recalculateFormTotals({
      ...prev,
      items: [...prev.items, createBlankItem()]
    }));
  };

  // Remove Item Row
  const handleRemoveItemRow = (index: number) => {
    if (form.items.length <= 1) {
      toast.warning('At least one line item is required in the purchase invoice.');
      return;
    }
    setForm(prev => {
      const newItems = prev.items.filter((_, idx) => idx !== index);
      return recalculateFormTotals({ ...prev, items: newItems });
    });
  };

  // Debounced Invoice Number Validation
  const handleInvoiceNoChange = (val: string) => {
    handleFieldChange('invoiceNo', val);
    setInvoiceExistsError('');

    if (!val.trim()) {
      setInvoiceChecking(false);
      return;
    }

    if (invoiceCheckTimeoutRef.current) {
      clearTimeout(invoiceCheckTimeoutRef.current);
    }

    setInvoiceChecking(true);
    invoiceCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await checkOilPurchaseInvoiceExists(
          val,
          modalMode === 'edit' && activeRecordId ? activeRecordId : undefined
        );
        if (res.exists) {
          setInvoiceExistsError(`Invoice number "${val.trim()}" already exists! Please enter a unique invoice number.`);
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

  // Form Field Change
  const handleFieldChange = (field: keyof typeof form, value: any) => {
    setForm(prev => {
      let updated = { ...prev, [field]: value };

      if (field === 'vendorName') {
        const matched = VENDOR_LIST.find(v => v.name === value);
        if (matched) {
          updated.vendorGstin = matched.gstin;
          updated.supplyPlant = matched.plant;
        }
      }

      if (['cashDiscount', 'roundingOff'].includes(field)) {
        updated = recalculateFormTotals(updated);
      }

      return updated;
    });
  };

  // Open Add Modal
  const handleAddNew = async () => {
    setModalMode('add');
    setActiveRecordId(null);
    setInvoiceExistsError('');

    let autoVoucher = `VCH/OP/${new Date().getFullYear()}/001`;
    try {
      autoVoucher = await fetchNextOilPurchaseVoucher();
    } catch {
      autoVoucher = `VCH/OP/${new Date().getFullYear()}/${String(totalElements + 1).padStart(3, '0')}`;
    }

    const initial = emptyForm();
    initial.voucherNo = autoVoucher;
    setForm(recalculateFormTotals(initial));
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEdit = (rec: OilPurchaseRecord) => {
    setModalMode('edit');
    setActiveRecordId(rec.id);
    setInvoiceExistsError('');
    const { id, createdAt, updatedAt, ...rest } = rec;
    setForm(recalculateFormTotals(rest));
    setShowModal(true);
  };

  // Open View Modal
  const handleView = (rec: OilPurchaseRecord) => {
    setModalMode('view');
    setActiveRecordId(rec.id);
    setInvoiceExistsError('');
    const { id, createdAt, updatedAt, ...rest } = rec;
    setForm(rest);
    setShowModal(true);
  };

  // Open Full Tax Invoice Preview
  const handleViewFullInvoice = (rec: OilPurchaseRecord) => {
    setViewInvoiceRecord(rec);
    setShowViewInvoice(true);
  };

  // Open Delete Confirm
  const handleDeleteClick = (rec: OilPurchaseRecord) => {
    setRecordToDelete(rec);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await deleteOilPurchaseApi(recordToDelete.id);
      toast.success(`Purchase voucher ${recordToDelete.voucherNo} deleted successfully.`);
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      loadRecords();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete oil purchase record.');
    }
  };

  // Form Submit
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
      toast.error('Please select the Vendor Name.');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Please add at least one line item.');
      return;
    }

    for (let i = 0; i < form.items.length; i++) {
      const itm = form.items[i];
      if (itm.packQty <= 0) {
        toast.error(`Item #${i + 1} (${itm.productName}): Quantity must be greater than 0.`);
        return;
      }
      if (itm.ratePerUnit <= 0) {
        toast.error(`Item #${i + 1} (${itm.productName}): Rate per Unit must be greater than 0.`);
        return;
      }
    }

    const finalCalculated = recalculateFormTotals(form);
    setIsSubmitting(true);

    try {
      if (modalMode === 'add') {
        const saved = await createOilPurchaseApi(finalCalculated);
        toast.success(`Oil purchase invoice ${saved.invoiceNo} (${saved.voucherNo}) recorded successfully!`);
        setShowModal(false);
        loadRecords();
      } else if (activeRecordId) {
        const updated = await updateOilPurchaseApi(activeRecordId, finalCalculated);
        toast.success(`Oil purchase invoice ${updated.invoiceNo} (${updated.voucherNo}) updated successfully!`);
        setShowModal(false);
        loadRecords();
      }
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save oil purchase invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    vendorFilter !== 'ALL' ||
    paymentModeFilter !== 'ALL' ||
    fromDateFilter ||
    toDateFilter
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setVendorFilter('ALL');
    setPaymentModeFilter('ALL');
    setFromDateFilter('');
    setToDateFilter('');
    setCurrentPage(0);
  };

  const handleSortToggle = (field: keyof OilPurchaseRecord) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: keyof OilPurchaseRecord }) => {
    if (sortBy !== field) return <ArrowUpDown className="inline w-3 h-3 ml-1 text-muted-foreground/40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="inline w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="inline w-3 h-3 ml-1 text-primary" />;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(records.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRecord = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Print Direct Tax Invoice ──
  const handlePrintTaxInvoice = (rec: OilPurchaseRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow popups to print.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${rec.invoiceNo}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 24px; color: #0f172a; line-height: 1.35; }
          .invoice-box { border: 1.5px solid #0284c7; padding: 18px; border-radius: 8px; max-width: 900px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 14px; }
          .header h2 { margin: 0; font-size: 18px; color: #0369a1; text-transform: uppercase; }
          .header p { margin: 2px 0; font-size: 12px; color: #475569; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; font-size: 11px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 8px; text-align: left; font-weight: 600; color: #0369a1; }
          td { border: 1px solid #e2e8f0; padding: 6px 8px; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
          .summary-table { width: 340px; margin-left: auto; margin-top: 14px; border-collapse: collapse; font-size: 11px; }
          .summary-table td { padding: 4px 8px; }
          .grand-total { font-size: 13px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
          .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <h2>${rec.vendorName}</h2>
              <p>GSTIN: <strong>${rec.vendorGstin || 'N/A'}</strong> | Supply Plant: <strong>${rec.supplyPlant || '5430'}</strong></p>
              <p>Original for Recipient — GST Tax Purchase Invoice</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Voucher:</strong> <span class="font-mono">${rec.voucherNo}</span></p>
              <p><strong>Invoice No:</strong> <span class="font-mono" style="font-size:14px;font-weight:bold;color:#0284c7;">${rec.invoiceNo}</span></p>
              <p><strong>Date:</strong> ${formatDateToDMY(rec.invoiceDate)}</p>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <p><strong>Billed to:</strong> SHIVNERI PETROLEUM SERVICES</p>
              <p><strong>GSTIN:</strong> 27DHQPP8099L1Z1 | State Code: 27 (Maharashtra)</p>
              <p><strong>Location:</strong> Gat No. 19/2/A, Vilholi, Nashik - 422010</p>
            </div>
            <div>
              <p><strong>Delivery Truck / Vehicle:</strong> ${rec.vehicleNo || 'MH15FV8051'}</p>
              <p><strong>Transporter:</strong> ${rec.transporterName || 'GOGAD BROS. WAREHOUSING & LOGISTICS'}</p>
              <p><strong>E-Way Bill:</strong> ${rec.ewayBillNo || '231581914374'} | <strong>Payment:</strong> ${rec.paymentMode}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:30px">#</th>
                <th>Product Description</th>
                <th>HSN</th>
                <th>Batch</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate/L</th>
                <th class="text-right">Gross</th>
                <th class="text-right">Disc.</th>
                <th class="text-right">Taxable</th>
                <th class="text-right">CGST</th>
                <th class="text-right">SGST</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rec.items.map((itm, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${itm.productName}</strong></td>
                  <td class="font-mono">${itm.hsnCode}</td>
                  <td class="font-mono">${itm.batchNo || '-'}</td>
                  <td class="text-right">${itm.packQty} ${itm.packType} (${itm.totalVolume}L)</td>
                  <td class="text-right font-mono">₹${itm.ratePerUnit.toFixed(2)}</td>
                  <td class="text-right font-mono">₹${itm.grossAmount.toFixed(2)}</td>
                  <td class="text-right font-mono text-red-600">${itm.discount > 0 ? `-₹${itm.discount.toFixed(2)}` : '₹0.00'}</td>
                  <td class="text-right font-mono font-semibold">₹${itm.taxableValue.toFixed(2)}</td>
                  <td class="text-right font-mono">₹${itm.cgstAmount.toFixed(2)}</td>
                  <td class="text-right font-mono">₹${itm.sgstAmount.toFixed(2)}</td>
                  <td class="text-right font-mono" style="font-weight:bold;color:#0369a1;">₹${itm.itemTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <table class="summary-table">
            <tr><td>Total Taxable Value:</td><td class="text-right font-mono"><strong>₹${rec.totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td></tr>
            <tr><td>CGST (Central Tax 9%):</td><td class="text-right font-mono">+₹${rec.totalCgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td>SGST (State Tax 9%):</td><td class="text-right font-mono">+₹${rec.totalSgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            ${rec.cashDiscount > 0 ? `<tr><td>Cash Discount:</td><td class="text-right font-mono" style="color:green;">-₹${rec.cashDiscount.toFixed(2)}</td></tr>` : ''}
            <tr><td>Rounding Off:</td><td class="text-right font-mono">${rec.roundingOff >= 0 ? `+₹${rec.roundingOff.toFixed(2)}` : `-₹${Math.abs(rec.roundingOff).toFixed(2)}`}</td></tr>
            <tr class="grand-total"><td>Net Payable Amount:</td><td class="text-right font-mono" style="font-size:14px;">₹${rec.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          </table>

          <div class="footer">
            <div>
              <p>Received Goods in Good Condition</p>
              <br/><br/>
              <p>__________________________<br/>Receiver Signature &amp; Stamp</p>
            </div>
            <div style="text-align: right;">
              <p>For ${rec.vendorName}</p>
              <br/><br/>
              <p>__________________________<br/>Authorised Signatory</p>
            </div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 600); }</script>
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
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Oil &amp; Lubricant Purchase
          </h1>
          <p className="text-sm text-muted-foreground">
            Procurement of packaged engine oils, DEF (AdBlue), coolants and greases with GST breakdown
          </p>
        </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            New Oil Purchase
          </Button>
      </div>

      {/* ── Metric / Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Packaged Volume */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Units / Volume</p>
            <p className="text-2xl font-bold mt-1 font-mono">
              {fmtQty(records.reduce((s, r) => s + r.items.reduce((sum, i) => sum + i.totalVolume, 0), 0))} L
            </p>
          </div>
        </div>

        {/* Total Taxable Value */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Taxable (Pre-GST)</p>
            <p className="text-2xl font-bold mt-1 font-mono">
              {formatCurrency(records.reduce((s, r) => s + (Number(r.totalTaxableValue) || 0), 0))}
            </p>
          </div>
        </div>

        {/* GST Input Credit (CGST + SGST) */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">GST Input Credit (ITC)</p>
            <p className="text-2xl font-bold mt-1 font-mono">
              {formatCurrency(records.reduce((s, r) => s + (Number(r.totalCgstAmount || 0) + Number(r.totalSgstAmount || 0)), 0))}
            </p>
          </div>
        </div>

        {/* Total Amount Invoiced */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Invoiced Amount</p>
            <p className="text-2xl font-bold mt-1 font-mono text-emerald-600">
              {formatCurrency(records.reduce((s, r) => s + (Number(r.totalInvoiceAmount) || 0), 0))}
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
              placeholder="Search vendor, invoice, product, batch…"
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

          {/* Vendor Filter */}
          <div className="w-44">
            <Select value={vendorFilter} onValueChange={v => { setVendorFilter(v); setCurrentPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Vendors</SelectItem>
                {VENDOR_LIST.map(v => (
                  <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
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
      </div>

      {/* ── Main Data Table ── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading oil purchase records…</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Package className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No oil purchase records found</p>
              <p className="text-xs">
                {(searchTerm || vendorFilter !== 'ALL' || paymentModeFilter !== 'ALL' || fromDateFilter || toDateFilter)
                  ? 'Try relaxing your search or filter inputs.'
                  : 'Click "New Oil Purchase" to record the first invoice.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="w-10 text-center p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === records.length && records.length > 0}
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
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Vendor / Supplier<SortIcon field="vendorName" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5 text-muted-foreground" /> Line Items
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Droplet className="w-3.5 h-3.5 text-muted-foreground" /> Total Vol (L)
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('totalTaxableValue')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /> Taxable (₹)<SortIcon field="totalTaxableValue" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" /> GST 18% (₹)
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('totalInvoiceAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /> Total Amount (₹)<SortIcon field="totalInvoiceAmount" />
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record) => {
                  const totalVol = record.items.reduce((s, i) => s + i.totalVolume, 0);
                  const totalGst = (record.totalCgstAmount || 0) + (record.totalSgstAmount || 0);

                  return (
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
                      <td className="px-4 py-3 text-sm font-medium">
                        <div>{record.vendorName}</div>
                        {record.vehicleNo && (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground font-mono">
                            <Truck className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{record.vehicleNo}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {record.items.slice(0, 2).map((itm, idx) => (
                            <span key={idx} className="text-[11px] bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 truncate max-w-[150px]">
                              {itm.productName.split(' ')[0]} {itm.productName.split(' ')[1]} ({itm.packQty})
                            </span>
                          ))}
                          {record.items.length > 2 && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              +{record.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium font-mono">
                        {fmtQty(totalVol)} L
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatCurrency(record.totalTaxableValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-amber-600">
                        {formatCurrency(totalGst)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold font-mono text-emerald-600">
                        {formatCurrency(record.totalInvoiceAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePrintTaxInvoice(record)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Print Tax Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
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
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30 border-t font-semibold text-sm">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-muted-foreground">
                    Total ({records.length} records)
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmtQty(records.reduce((s, r) => s + r.items.reduce((sum, i) => sum + i.totalVolume, 0), 0))} L
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(records.reduce((s, r) => s + r.totalTaxableValue, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600">
                    {formatCurrency(records.reduce((s, r) => s + (r.totalCgstAmount + r.totalSgstAmount), 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">
                    {formatCurrency(records.reduce((s, r) => s + r.totalInvoiceAmount, 0))}
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
          NEW / EDIT / VIEW OIL PURCHASE MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '980px', width: '95vw', maxHeight: '92vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Package className="w-5 h-5 text-purple-600" />
                {modalMode === 'add'
                  ? 'New Oil & Lubricant Purchase'
                  : modalMode === 'edit'
                    ? 'Edit Oil Purchase Invoice'
                    : `Purchase Record — ${form.voucherNo}`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-xs mt-0.5">
              Record packaged lubricant, DEF AdBlue, and coolant invoice with HSN &amp; GST tax breakdown
            </DialogDescription>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* ─────────────────────────────────
                  SECTION 1: INVOICE & SUPPLIER INFO
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  1. Invoice &amp; Supplier Information
                </h3>

                {/* Row 1: Voucher, Invoice No, Invoice Date, Payment Mode */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Hash className="w-3 h-3 text-muted-foreground" /> Voucher No.
                    </Label>
                    <Input
                      value={form.voucherNo}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs font-mono bg-muted/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-muted-foreground" /> Invoice No. <span className="text-red-500 font-bold">*</span>
                      </span>
                      {invoiceChecking && (
                        <span className="text-[10px] text-muted-foreground animate-pulse">Checking…</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="e.g. 4582662732"
                        value={form.invoiceNo}
                        onChange={e => handleInvoiceNoChange(e.target.value)}
                        disabled={isView}
                        className={`h-9 text-xs font-mono ${
                          invoiceExistsError
                            ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/20'
                            : form.invoiceNo.trim() && !invoiceChecking && !isView
                            ? 'border-emerald-500 focus-visible:ring-emerald-500'
                            : isView
                            ? 'bg-muted/60'
                            : 'bg-background'
                        }`}
                        required={!isView}
                      />
                      {form.invoiceNo.trim() && !invoiceChecking && !invoiceExistsError && !isView && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                      {invoiceExistsError && !invoiceChecking && !isView && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {invoiceExistsError && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {invoiceExistsError}
                      </p>
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

                {/* Row 2: Vendor, GSTIN, Plant, Truck No */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-muted-foreground" /> Supplier / Vendor Name <span className="text-red-500 font-bold">*</span>
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
                          <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Vendor GSTIN</Label>
                    <Input
                      value={form.vendorGstin}
                      disabled
                      className="h-9 text-xs font-mono bg-muted/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Truck className="w-3 h-3 text-muted-foreground" /> Delivery Truck No.
                    </Label>
                    <Input
                      placeholder="e.g. MH-15-FV-8051"
                      value={form.vehicleNo}
                      onChange={e => handleFieldChange('vehicleNo', e.target.value)}
                      disabled={isView}
                      className={`h-9 text-xs uppercase font-mono ${isView ? 'bg-muted/60' : 'bg-background'}`}
                    />
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 2: LINE ITEMS (MULTI-ITEM)
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-primary" />
                    2. Purchased Lube Items &amp; GST Details ({form.items.length})
                  </h3>
                  {!isView && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddItemRow}
                      className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 bg-background rounded-lg border border-border space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">
                          Item #{idx + 1}
                        </span>
                        {!isView && form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Row 1: Product, HSN, Batch */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-[11px] font-medium">Product Description</Label>
                          <Select
                            value={item.productId}
                            onValueChange={v => handleItemChange(idx, 'productId', v)}
                            disabled={isView}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {catalogList.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">HSN Code</Label>
                          <Input
                            value={item.hsnCode}
                            onChange={e => handleItemChange(idx, 'hsnCode', e.target.value)}
                            disabled={isView}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Batch No.</Label>
                          <Input
                            placeholder="e.g. 22I01"
                            value={item.batchNo}
                            onChange={e => handleItemChange(idx, 'batchNo', e.target.value)}
                            disabled={isView}
                            className="h-8 text-xs font-mono uppercase"
                          />
                        </div>
                      </div>

                      {/* Row 2: Pack Type, Qty, Vol/Pack, Rate/L, Discount, Total */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 pt-0.5">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Pack Type</Label>
                          <Select
                            value={item.packType}
                            onValueChange={v => handleItemChange(idx, 'packType', v)}
                            disabled={isView}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PAI">Pail (PAI)</SelectItem>
                              <SelectItem value="CS">Case (CS)</SelectItem>
                              <SelectItem value="CAN">Can (CAN)</SelectItem>
                              <SelectItem value="BOT">Bottle (BOT)</SelectItem>
                              <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Pack Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.packQty || ''}
                            onChange={e => handleItemChange(idx, 'packQty', Number(e.target.value))}
                            disabled={isView}
                            className="h-8 text-xs text-right font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Vol / Pack (L)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.volumePerPack || ''}
                            onChange={e => handleItemChange(idx, 'volumePerPack', Number(e.target.value))}
                            disabled={isView}
                            className="h-8 text-xs text-right font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Rate / L (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.ratePerUnit || ''}
                            onChange={e => handleItemChange(idx, 'ratePerUnit', Number(e.target.value))}
                            disabled={isView}
                            className="h-8 text-xs text-right font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Discount (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.discount || ''}
                            onChange={e => handleItemChange(idx, 'discount', Number(e.target.value))}
                            disabled={isView}
                            className="h-8 text-xs text-right text-red-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Line Total (₹)</Label>
                          <Input
                            value={formatCurrency(item.itemTotal)}
                            readOnly
                            className="h-8 text-xs text-right font-bold font-mono bg-muted/50 text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 3: INVOICE SUMMARY & TAX BREAKDOWN
              ───────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Remarks & Logistics */}
                <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    3. Logistics &amp; Remarks
                  </h3>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Transporter Name</Label>
                      <Input
                        placeholder="e.g. GOGAD BROS. WAREHOUSING & LOGISTICS"
                        value={form.transporterName}
                        onChange={e => handleFieldChange('transporterName', e.target.value)}
                        disabled={isView}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">E-Way Bill No.</Label>
                      <Input
                        placeholder="e.g. 231581914374"
                        value={form.ewayBillNo}
                        onChange={e => handleFieldChange('ewayBillNo', e.target.value)}
                        disabled={isView}
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Remarks / Delivery Notes</Label>
                      <Textarea
                        rows={2}
                        placeholder="Additional purchase remarks…"
                        value={form.remarks}
                        onChange={e => handleFieldChange('remarks', e.target.value)}
                        disabled={isView}
                        className="text-xs resize-none bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Calculation Box */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-right flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between gap-6">
                      <span>Gross Item Value:</span>
                      <span className="font-mono">{formatCurrency(form.totalGrossAmount)}</span>
                    </div>
                    <div className="flex justify-between gap-6 text-red-600">
                      <span>Total Line Discount:</span>
                      <span className="font-mono">-{formatCurrency(form.totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between gap-6 font-semibold text-foreground pt-1 border-t border-border/50">
                      <span>Net Taxable Value:</span>
                      <span className="font-mono">{formatCurrency(form.totalTaxableValue)}</span>
                    </div>
                    <div className="flex justify-between gap-6 text-amber-600">
                      <span>CGST (Central Tax 9%):</span>
                      <span className="font-mono">+{formatCurrency(form.totalCgstAmount)}</span>
                    </div>
                    <div className="flex justify-between gap-6 text-amber-600">
                      <span>SGST (State Tax 9%):</span>
                      <span className="font-mono">+{formatCurrency(form.totalSgstAmount)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="text-left space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Cash Disc (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.cashDiscount || ''}
                          onChange={e => handleFieldChange('cashDiscount', Number(e.target.value))}
                          disabled={isView}
                          className="h-7 text-xs text-right bg-background"
                        />
                      </div>
                      <div className="text-left space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Round Off (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.roundingOff || ''}
                          onChange={e => handleFieldChange('roundingOff', Number(e.target.value))}
                          disabled={isView}
                          className="h-7 text-xs text-right bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mt-3 flex justify-between gap-6 items-center">
                    <span className="font-bold text-sm text-foreground">Grand Total Amount</span>
                    <span className="font-bold text-emerald-600 text-lg font-mono">
                      {formatCurrency(form.totalInvoiceAmount)}
                    </span>
                  </div>
                </div>
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
                  disabled={isSubmitting || invoiceChecking || Boolean(invoiceExistsError)}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {modalMode === 'add' ? 'Save Oil Purchase' : 'Save Changes'}
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
                  Are you sure you want to delete oil purchase voucher{' '}
                  <strong className="text-foreground font-mono">{recordToDelete?.voucherNo}</strong> (Invoice: {recordToDelete?.invoiceNo})?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
