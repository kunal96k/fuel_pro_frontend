import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  IndianRupee,
  Plus,
  Calendar,
  Clock,
  User,
  TrendingUp,
  Search,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Package,
  Download,
  FileDown,
  CheckSquare,
  Loader2,
  CalendarDays,
  Truck,
  AlertTriangle,
  Tag,
  Layers,
  Fuel,
  Hash,
  Receipt
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';
import {
  fetchVehicles,
  fetchProducts,
  fetchMpdsAll,
  Vehicle,
  Product,
  MPD,
  Nozzle,
  formatDateToDMY,
  CreditSale as CreditSalesRecord,
  fetchCreditSales,
  createCreditSaleApi,
  updateCreditSaleApi,
  deleteCreditSaleApi,
  fetchNextVoucherNo,
  fetchNextSlipNo,
  fetchLatestOrDateRates,
  fetchCustomers,
  Customer
} from '../services/api';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Return current IST date string YYYY-MM-DD */
function getISTDateString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().split('T')[0];
}

/** Return current IST time string HH:MM */
function getISTTimeString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const mm = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Format INR currency */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

/** Format vehicle plates to standard pattern (e.g. MH-67-63-4322) */
function formatVehicleNumber(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const g1 = clean.slice(0, 2);
  const g2 = clean.slice(2, 4);
  const g3 = clean.slice(4, 6);
  const g4 = clean.slice(6, 10);
  return [g1, g2, g3, g4].filter(g => g.length > 0).join('-');
}

// ─────────────────────────────────────────────────────────────
// Initial form state
// ─────────────────────────────────────────────────────────────
const INIT_FORM = {
  customer: '',
  vehicleNo: '',
  voucherNo: '',
  slipNo: '',
  productCategory: '' as '' | 'Fuel' | 'Oil & Lubes',
  productId: '',
  productName: '',
  productUnit: '',
  rate: '',
  quantity: '',
  totalAmount: '',
  mpdId: '',
  mpdName: '',
  nozzleId: '',
  nozzleName: '',
  date: getISTDateString(),
  time: getISTTimeString(),
  status: 'Pending' as 'Pending' | 'Completed'
};

export function CreditSales() {
  // ── Master data ──
  const [products, setProducts] = useState<Product[]>([]);
  const [mpds, setMpds] = useState<MPD[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // ── Table / pagination state ──
  const [records, setRecords] = useState<CreditSalesRecord[]>([]);
  const [statsRecords, setStatsRecords] = useState<CreditSalesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Delete confirm ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<CreditSalesRecord | null>(null);

  // ── Form state ──
  const [form, setForm] = useState({ ...INIT_FORM });

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Customer & Vehicle Autocomplete Typeahead States ──
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleSuggestions, setVehicleSuggestions] = useState<any[]>([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const customerRef = useRef<HTMLDivElement>(null);
  const vehicleRef = useRef<HTMLDivElement>(null);

  // ── Derived: nozzles for selected MPD ──
  const availableNozzles: Nozzle[] = (() => {
    if (!form.mpdId) return [];
    const mpd = mpds.find(m => m.id === form.mpdId);
    return mpd ? mpd.nozzles : [];
  })();

  // ── Derived: filtered products by category ──
  const filteredProducts = form.productCategory
    ? products.filter(p => p.category === form.productCategory)
    : products;

  // ─────────────────────────────────────────────
  // Load Credit Sales Records from backend
  // ─────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCreditSales({
        page: currentPage,
        size: pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });
      setRecords(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);

      // Fetch stats globally (without pagination limits)
      const statsRes = await fetchCreditSales({
        page: 0,
        size: 100000,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });
      setStatsRecords(statsRes.content);
    } catch {
      toast.error('Failed to load credit sales records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter, fromDateFilter, toDateFilter, sortBy, sortDir]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // ─────────────────────────────────────────────
  // Load master data once on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingMaster(true);
      try {
        const [pRes, mRes] = await Promise.all([
          fetchProducts({ size: 1000 }),
          fetchMpdsAll()
        ]);
        setProducts(pRes.content);
        setMpds(mRes);
      } catch {
        toast.error('Failed to load master configuration data.');
      } finally {
        setLoadingMaster(false);
      }
    };
    load();
  }, []);

  // Click outside handlers to close typeahead dropdowns
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

  // ─────────────────────────────────────────────
  // Customer autocomplete backend typeahead fetch
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!customerSearch.trim() || modalMode === 'view') {
      setCustomerSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetchCustomers({ search: customerSearch, status: 'Active', size: 10 });
        setCustomerSuggestions(res.content);
      } catch {
        setCustomerSuggestions([]);
      } finally {
        setLoadingCustomers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch, modalMode]);

  // ─────────────────────────────────────────────
  // Vehicle autocomplete typeahead logic
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (modalMode === 'view') return;

    if (selectedCustomer) {
      // Local search inside customer vehicles list
      const query = vehicleSearch.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const filtered = customerVehicles.filter(v => 
        (v.vehicleNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(query)
      );
      setVehicleSuggestions(filtered.slice(0, 10));
    } else {
      // Dynamic cross-search all customer vehicles on backend
      if (!vehicleSearch.trim()) {
        setVehicleSuggestions([]);
        return;
      }
      const timer = setTimeout(async () => {
        setLoadingVehicles(true);
        try {
          const res = await fetchCustomers({ search: vehicleSearch, status: 'Active', size: 10 });
          const matches: any[] = [];
          res.content.forEach(cust => {
            (cust.vehicles || []).forEach(v => {
              if (v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase())) {
                matches.push({
                  ...v,
                  customer: cust
                });
              }
            });
          });
          setVehicleSuggestions(matches.slice(0, 10));
        } catch {
          setVehicleSuggestions([]);
        } finally {
          setLoadingVehicles(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [vehicleSearch, selectedCustomer, customerVehicles, modalMode]);

  // ─────────────────────────────────────────────
  // Dynamic Rate Lookup
  // ─────────────────────────────────────────────
  const loadDynamicRate = useCallback(async (productId: string, dateStr: string) => {
    if (!productId || !dateStr) return;
    try {
      const ratesMap = await fetchLatestOrDateRates(dateStr);
      const matchedRate = ratesMap[productId];
      if (matchedRate !== undefined) {
        setForm(prev => {
          const rateVal = String(matchedRate);
          let qtyVal = prev.quantity;
          let totalVal = prev.totalAmount;
          
          if (qtyVal) {
            totalVal = (parseFloat(qtyVal) * matchedRate).toFixed(2);
          } else if (totalVal) {
            qtyVal = (parseFloat(totalVal) / matchedRate).toFixed(2);
          }
          return {
            ...prev,
            rate: rateVal,
            quantity: qtyVal,
            totalAmount: totalVal
          };
        });
      }
    } catch {
      // ignore, fall back to manual rate inputting
    }
  }, []);

  useEffect(() => {
    if (form.productCategory === 'Fuel' && form.productId && form.date) {
      loadDynamicRate(form.productId, form.date);
    }
  }, [form.productId, form.date, form.productCategory, loadDynamicRate]);

  // ─────────────────────────────────────────────
  // Auto-calculate logic
  // ─────────────────────────────────────────────
  const handleQuantityChange = (val: string) => {
    const qty = parseFloat(val) || 0;
    const rate = parseFloat(form.rate) || 0;
    const total = qty > 0 && rate > 0 ? (qty * rate).toFixed(2) : '';
    setForm(prev => ({ ...prev, quantity: val, totalAmount: total }));
  };

  const handleTotalAmountChange = (val: string) => {
    const rawVal = val.replace(/,/g, '');
    const total = parseFloat(rawVal) || 0;
    const rate = parseFloat(form.rate) || 0;
    const qty = total > 0 && rate > 0 ? (total / rate).toFixed(2) : '';
    setForm(prev => ({ ...prev, totalAmount: rawVal, quantity: qty }));
  };

  // ─────────────────────────────────────────────
  // Selection handlers
  // ─────────────────────────────────────────────
  const handleProductChange = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setForm(prev => ({
      ...prev,
      productId,
      productName: prod.name,
      productUnit: prod.unit,
      quantity: '',
      totalAmount: '',
      rate: ''
    }));
  };

  const handleMpdChange = (mpdId: string) => {
    const mpd = mpds.find(m => m.id === mpdId);
    setForm(prev => ({
      ...prev,
      mpdId,
      mpdName: mpd?.mpdName ?? '',
      nozzleId: '',
      nozzleName: ''
    }));
  };

  const handleCategoryChange = (cat: 'Fuel' | 'Oil & Lubes') => {
    setForm(prev => ({
      ...prev,
      productCategory: cat,
      productId: '',
      productName: '',
      productUnit: '',
      rate: '',
      quantity: '',
      totalAmount: ''
    }));
  };

  // ─────────────────────────────────────────────
  // Action triggers
  // ─────────────────────────────────────────────
  const handleAddNew = async () => {
    setModalMode('add');
    setActiveRecordId(null);
    setSelectedCustomer(null);
    setCustomerVehicles([]);
    setCustomerSearch('');
    setVehicleSearch('');
    
    setForm({
      ...INIT_FORM,
      date: getISTDateString(),
      time: getISTTimeString(),
      voucherNo: 'CRVCH...',
      slipNo: 'SLIP...'
    });
    
    setShowModal(true);

    try {
      const [vch, slp] = await Promise.all([
        fetchNextVoucherNo(),
        fetchNextSlipNo(getISTDateString())
      ]);
      setForm(prev => ({ ...prev, voucherNo: vch, slipNo: slp }));
    } catch {
      toast.error('Failed to pre-fetch auto-generated voucher codes.');
    }
  };

  const handleEdit = async (record: CreditSalesRecord) => {
    setModalMode('edit');
    setActiveRecordId(record.id);
    setSelectedCustomer(null);
    setCustomerVehicles([]);

    // Find matching MPD and Nozzle IDs from the loaded lists
    let mappedMpdId = '';
    let mappedNozzleId = '';
    
    if (mpds.length > 0 && record.mpdName) {
      const foundMpd = mpds.find(m => m.mpdName === record.mpdName);
      if (foundMpd) {
        mappedMpdId = foundMpd.id;
        if (record.nozzleName) {
          const foundNozzle = foundMpd.nozzles.find(n => n.nozzleName === record.nozzleName);
          if (foundNozzle) {
            mappedNozzleId = foundNozzle.id;
          }
        }
      }
    }

    // Find matching product ID
    let mappedProductId = '';
    if (products.length > 0 && record.productName) {
      const foundProduct = products.find(p => p.name === record.productName);
      if (foundProduct) {
        mappedProductId = foundProduct.id;
      }
    }

    setForm({
      customer: record.customerName,
      vehicleNo: record.vehicleNo,
      voucherNo: record.voucherNo,
      slipNo: record.slipNo,
      productCategory: record.productCategory as '' | 'Fuel' | 'Oil & Lubes',
      productId: mappedProductId,
      productName: record.productName,
      productUnit: record.productUnit,
      rate: String(record.rate),
      quantity: String(record.quantity),
      totalAmount: String(record.totalAmount),
      mpdId: mappedMpdId,
      mpdName: record.mpdName,
      nozzleId: mappedNozzleId,
      nozzleName: record.nozzleName,
      date: record.date,
      time: record.saleTime,
      status: record.status
    });

    setCustomerSearch(record.customerName);
    setVehicleSearch(record.vehicleNo);
    setShowModal(true);

    // Resolve matching customer record to get vehicle lists
    try {
      const res = await fetchCustomers({ search: record.customerName, size: 5 });
      const exactCust = res.content.find(c => c.customerName.toLowerCase() === record.customerName.toLowerCase());
      if (exactCust) {
        setSelectedCustomer(exactCust);
        setCustomerVehicles(exactCust.vehicles || []);
      }
    } catch {
      // silent fallback
    }
  };

  const handleView = async (record: CreditSalesRecord) => {
    setModalMode('view');
    setActiveRecordId(record.id);
    setSelectedCustomer(null);
    setCustomerVehicles([]);

    // Find matching MPD and Nozzle IDs from the loaded lists
    let mappedMpdId = '';
    let mappedNozzleId = '';
    
    if (mpds.length > 0 && record.mpdName) {
      const foundMpd = mpds.find(m => m.mpdName === record.mpdName);
      if (foundMpd) {
        mappedMpdId = foundMpd.id;
        if (record.nozzleName) {
          const foundNozzle = foundMpd.nozzles.find(n => n.nozzleName === record.nozzleName);
          if (foundNozzle) {
            mappedNozzleId = foundNozzle.id;
          }
        }
      }
    }

    // Find matching product ID
    let mappedProductId = '';
    if (products.length > 0 && record.productName) {
      const foundProduct = products.find(p => p.name === record.productName);
      if (foundProduct) {
        mappedProductId = foundProduct.id;
      }
    }

    setForm({
      customer: record.customerName,
      vehicleNo: record.vehicleNo,
      voucherNo: record.voucherNo,
      slipNo: record.slipNo,
      productCategory: record.productCategory as '' | 'Fuel' | 'Oil & Lubes',
      productId: mappedProductId,
      productName: record.productName,
      productUnit: record.productUnit,
      rate: String(record.rate),
      quantity: String(record.quantity),
      totalAmount: String(record.totalAmount),
      mpdId: mappedMpdId,
      mpdName: record.mpdName,
      nozzleId: mappedNozzleId,
      nozzleName: record.nozzleName,
      date: record.date,
      time: record.saleTime,
      status: record.status
    });

    setCustomerSearch(record.customerName);
    setVehicleSearch(record.vehicleNo);
    setShowModal(true);
  };

  const handleDeleteClick = (record: CreditSalesRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await deleteCreditSaleApi(recordToDelete.id);
      toast.success('Credit sale deleted successfully!');
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
      await loadRecords();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete credit sale record.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.vehicleNo || !form.productCategory || !form.productName || !form.rate || !form.quantity || !form.mpdName || !form.nozzleName) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: form.date,
        saleTime: form.time,
        customerName: form.customer,
        vehicleNo: form.vehicleNo,
        productCategory: form.productCategory,
        productName: form.productName,
        productUnit: form.productUnit,
        quantity: parseFloat(form.quantity),
        rate: parseFloat(form.rate),
        totalAmount: parseFloat(form.totalAmount),
        mpdName: form.mpdName,
        nozzleName: form.nozzleName,
        status: form.status
      };

      if (modalMode === 'edit' && activeRecordId) {
        await updateCreditSaleApi(activeRecordId, payload);
        toast.success('Credit sale record updated successfully!');
      } else {
        await createCreditSaleApi(payload);
        toast.success('Credit sale record created successfully!');
      }
      setShowModal(false);
      await loadRecords();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  // Find mapping products on loads
  useEffect(() => {
    if (products.length > 0 && form.productName && !form.productId) {
      const found = products.find(p => p.name === form.productName);
      if (found) {
        setForm(prev => ({ ...prev, productId: found.id, productUnit: found.unit }));
      }
    }
  }, [products, form.productName, form.productId]);

  // Find mapping MPD & Nozzles
  useEffect(() => {
    if (mpds.length > 0 && form.mpdName && !form.mpdId) {
      const found = mpds.find(m => m.mpdName === form.mpdName);
      if (found) {
        setForm(prev => {
          const updated = { ...prev, mpdId: found.id };
          if (prev.nozzleName && !prev.nozzleId) {
            const nz = found.nozzles.find(n => n.nozzleName === prev.nozzleName);
            if (nz) {
              updated.nozzleId = nz.id;
            }
          }
          return updated;
        });
      }
    }
  }, [mpds, form.mpdName, form.mpdId, form.nozzleName, form.nozzleId]);

  // ─────────────────────────────────────────────
  // Pagination helpers
  // ─────────────────────────────────────────────
  const totalPagesCount = totalPages;
  const paginated = records;

  const handleSelectAll = () => {
    const ids = paginated.map(r => r.id);
    const allSel = ids.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSel) { ids.forEach(id => next.delete(id)); }
    else { ids.forEach(id => next.add(id)); }
    setSelectedIds(next);
  };

  const handleSelectRecord = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    setSelectedIds(next);
  };

  // ─────────────────────────────────────────────
  // Sort toggle
  // ─────────────────────────────────────────────
  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return sortDir === 'asc'
      ? <span className="ml-1 text-primary">↑</span>
      : <span className="ml-1 text-primary">↓</span>;
  };

  // ─────────────────────────────────────────────
  // CSV export
  // ─────────────────────────────────────────────
  const downloadCSV = (data: CreditSalesRecord[]) => {
    const headers = ['Slip No', 'Voucher No', 'Date', 'Sale Time', 'Customer', 'Vehicle No', 'Product Category', 'Product Name', 'Qty', 'Unit', 'Rate', 'Total Amount', 'MPD', 'Nozzle', 'Status'];
    const rows = data.map(r => [
      r.slipNo, r.voucherNo, r.date, r.saleTime, r.customerName,
      r.vehicleNo, r.productCategory, r.productName,
      r.quantity, r.productUnit, r.rate, r.totalAmount,
      r.mpdName, r.nozzleName, r.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `credit_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─────────────────────────────────────────────
  // Excel XLS export
  // ─────────────────────────────────────────────
  const downloadXLS = (data: CreditSalesRecord[]) => {
    const genDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Credit Sales</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>
      <h2>Credit Sales Report</h2><p>Report Date: ${genDate}</p><p>Total Records: ${data.length}</p>
      <table border="1">
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <th>Slip No</th><th>Voucher No</th><th>Date</th><th>Time</th><th>Customer</th><th>Vehicle No</th>
          <th>Category</th><th>Product</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total Amount</th>
          <th>MPD</th><th>Nozzle</th><th>Status</th>
        </tr>`;
    data.forEach(r => {
      html += `<tr><td>${r.slipNo}</td><td>${r.voucherNo}</td><td>${formatDateToDMY(r.date)}</td><td>${r.saleTime}</td><td>${r.customerName}</td><td>${r.vehicleNo}</td><td>${r.productCategory}</td><td>${r.productName}</td><td>${r.quantity}</td><td>${r.productUnit}</td><td>${r.rate}</td><td>${r.totalAmount}</td><td>${r.mpdName}</td><td>${r.nozzleName}</td><td>${r.status}</td></tr>`;
    });
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `credit_sales_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─────────────────────────────────────────────
  // PDF export
  // ─────────────────────────────────────────────
  const downloadPDF = (data: CreditSalesRecord[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Popup blocked! Please allow popups to generate PDFs.'); return; }
    const genDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    const genTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    let rowsHtml = '';
    data.forEach((r, idx) => {
      rowsHtml += `<tr>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;font-family:monospace">${idx + 1}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;font-family:monospace">${r.slipNo}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1">${formatDateToDMY(r.date)} ${r.saleTime}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;font-weight:500">${r.customerName}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;font-family:monospace">${r.vehicleNo}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1">${r.productName}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-family:monospace;font-weight:bold;color:#1d4ed8">₹${r.totalAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center">${r.status}</td>
      </tr>`;
    });
    const htmlContent = `<html><head><title>Credit Sales Report</title><style>
      body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;padding:24px;color:#1e293b}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #3b82f6;padding-bottom:12px;margin-bottom:24px}
      .title{font-size:22px;font-weight:700;color:#1e3a8a;margin:0}
      .meta{font-size:12px;color:#64748b;text-align:right;line-height:1.5}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th{background-color:#f8fafc;padding:8px;border:1px solid #cbd5e1;font-weight:600;text-align:left;color:#334155}
      .footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center}
      @media print{body{padding:0}button{display:none}}
    </style></head><body>
      <div class="header"><div><h1 class="title">Credit Sales Report</h1><p style="margin:4px 0 0;font-size:12px;color:#475569">Fuel Station Operations</p></div>
      <div class="meta"><p style="margin:0"><strong>Report Date:</strong> ${genDate}</p><p style="margin:2px 0 0"><strong>Generation Time:</strong> ${genTime}</p><p style="margin:2px 0 0"><strong>Total Records:</strong> ${data.length}</p></div></div>
      <table><thead><tr>
        <th style="width:40px">S.No</th><th>Slip No</th><th>Date &amp; Time</th><th>Customer</th><th>Vehicle</th><th>Product</th><th style="text-align:right">Amount</th><th style="text-align:center">Status</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="footer">System generated report. Generated on ${genDate} at ${genTime}.</div>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script>
    </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ─────────────────────────────────────────────
  // Export all matching (re-fetch with large size)
  // ─────────────────────────────────────────────
  const handleExportAll = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const allRes = await fetchCreditSales({
        size: 10000,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });
      if (format === 'csv') downloadCSV(allRes.content);
      else if (format === 'excel') downloadXLS(allRes.content);
      else if (format === 'pdf') downloadPDF(allRes.content);
      toast.success(`Exported all matching records to ${format.toUpperCase()}!`);
    } catch {
      toast.error('Failed to export records');
    }
  };

  // ─────────────────────────────────────────────
  // Export selected rows
  // ─────────────────────────────────────────────
  const handleExportSelected = async (format: 'csv' | 'excel' | 'pdf') => {
    if (selectedIds.size === 0) { toast.warning('Please select at least one record to export'); return; }
    try {
      const allRes = await fetchCreditSales({
        size: 10000,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });
      const selectedData = allRes.content.filter(r => selectedIds.has(r.id));
      if (selectedData.length === 0) { toast.warning('Selected records not found in current filter range'); return; }
      if (format === 'csv') downloadCSV(selectedData);
      else if (format === 'excel') downloadXLS(selectedData);
      else if (format === 'pdf') downloadPDF(selectedData);
      toast.success(`Exported ${selectedData.length} selected records to ${format.toUpperCase()}!`);
    } catch {
      toast.error('Failed to export selected records');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50/80 text-amber-700 border-amber-200 text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const isView = modalMode === 'view';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Sales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage vehicle-based credit fuel & oil sales with slip generation
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2" size="sm">
          <Plus className="w-4 h-4" />
          Add New Sale
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100">
            <IndianRupee className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(statsRecords.reduce((s, r) => s + r.totalAmount, 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total Credit Sales (Overall)</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100">
            <CalendarDays className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{totalElements}</p>
            <p className="text-xs text-muted-foreground">Total Slip Records</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{statsRecords.filter(r => r.status === 'Completed').length}</p>
            <p className="text-xs text-muted-foreground">Completed (Overall)</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {formatCurrency(statsRecords.length > 0 ? (statsRecords.reduce((s, r) => s + r.totalAmount, 0) / statsRecords.length) : 0)}
            </p>
            <p className="text-xs text-muted-foreground">Avg. Sale (Overall)</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4 z-0">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customer, slip, vehicle, product…"
            className="pl-10 h-9 text-xs"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>

        {/* Date From */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">From</label>
          <input
            type="date"
            value={fromDateFilter}
            onChange={e => { setFromDateFilter(e.target.value); setCurrentPage(0); }}
            className="w-32 h-9 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">To</label>
          <input
            type="date"
            value={toDateFilter}
            onChange={e => { setToDateFilter(e.target.value); setCurrentPage(0); }}
            className="w-32 h-9 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Category</label>
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="Fuel">Fuel</SelectItem>
              <SelectItem value="Oil & Lubes">Oil & Lubes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Status</label>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
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

      {/* ── Main Table ── */}
      <Card className="overflow-hidden border-border rounded-xl bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading credit sales records…</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <CreditCard className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No credit sale records found</p>
              <p className="text-xs">
                {(searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || fromDateFilter || toDateFilter) ? 'Try relaxing your search or filter inputs.' : 'Click "Add New Sale" to create the first record.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="w-12 text-center p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === paginated.length && paginated.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="w-14 text-left px-4 py-3 font-medium text-muted-foreground">S.No</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('customerName')}>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 opacity-60" /> Customer<SortIcon field="customerName" />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('slipNo')}>
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 opacity-60" /> Slip No<SortIcon field="slipNo" />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 opacity-60" /> Vehicle No.
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('productName')}>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 opacity-60" /> Product<SortIcon field="productName" />
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('date')}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" /> Date &amp; Time<SortIcon field="date" />
                      </div>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('totalAmount')}>
                      <div className="flex items-center gap-1.5 justify-end">
                        Amount <IndianRupee className="w-3.5 h-3.5 opacity-60" /><SortIcon field="totalAmount" />
                      </div>
                    </th>
                    <th className="w-28 text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="w-32 text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginated.map((record, index) => (
                    <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                      <td className="w-12 text-center p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => handleSelectRecord(record.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="w-14 px-4 py-3 font-semibold text-muted-foreground">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 text-xs">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {record.customerName ? record.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{record.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{record.slipNo}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-mono text-xs">{record.vehicleNo}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{record.productName}</p>
                          <p className="text-[11px] text-muted-foreground">{record.productCategory} · {record.quantity} {record.productUnit}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p className="font-mono">{formatDateToDMY(record.date)}</p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {record.saleTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600 font-mono">
                        {formatCurrency(record.totalAmount)}
                      </td>
                      <td className="w-28 px-4 py-3">{getStatusBadge(record.status)}</td>
                      <td className="w-32 px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" title="View" onClick={() => handleView(record)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" title="Edit" onClick={() => handleEdit(record)} disabled={record.status === 'Completed'}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteClick(record)} disabled={record.status === 'Completed'}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 border-t border-border text-xs font-semibold">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-left">
                      Page Total ({paginated.length} records)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {formatCurrency(paginated.reduce((s, r) => s + r.totalAmount, 0))}
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-muted-foreground text-left">
                      Overall Total: <span className="font-mono text-foreground font-bold">{formatCurrency(statsRecords.reduce((s, r) => s + r.totalAmount, 0))}</span> · Total Count: <span className="font-mono text-foreground font-bold">{totalElements}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono px-2">Page {currentPage + 1} of {totalPagesCount}</span>
                <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={currentPage >= totalPagesCount - 1} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════
          ADD / EDIT / VIEW MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '90vw', width: '900px', height: '88vh', maxHeight: '88vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="w-5 h-5 text-primary" />
                {modalMode === 'add'
                  ? 'Add New Credit Sale'
                  : modalMode === 'edit'
                  ? 'Edit Credit Sale'
                  : 'Credit Sale Details'}
              </DialogTitle>
              {modalMode !== 'view' && (
                <div className="text-[10px] text-muted-foreground/80 flex items-center gap-4 bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 font-medium mr-6">
                  <div>
                    <span className="text-amber-600 font-semibold">Pending:</span> Sale is draft/unverified
                  </div>
                  <div className="w-px h-3 bg-border/60" />
                  <div>
                    <span className="text-blue-600 font-semibold">Completed:</span> Sale is approved and posted to ledger
                  </div>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {modalMode === 'view'
                ? 'Review credit sale record details.'
                : 'Fill in the details below to record a credit sale transaction.'}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ─────────────────────────────────
                    LEFT COLUMN: Metadata / Header
                ───────────────────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">
                    Sale Header
                  </h3>

                  {/* Row: Voucher No + Slip No */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cs-voucherNo" className="text-xs font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Voucher No
                      </Label>
                      <Input
                        id="cs-voucherNo"
                        value={form.voucherNo}
                        disabled
                        className="h-9 text-xs bg-muted font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cs-slipNo" className="text-xs font-medium flex items-center gap-1">
                        <Receipt className="w-3 h-3" /> Slip No
                      </Label>
                      <Input
                        id="cs-slipNo"
                        value={form.slipNo}
                        disabled
                        className="h-9 text-xs bg-muted font-mono"
                      />
                    </div>
                  </div>

                  {/* Row: Date + Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cs-date" className="text-xs font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date
                      </Label>
                      <Input
                        id="cs-date"
                        type="date"
                        value={form.date}
                        disabled
                        className="h-9 text-xs bg-muted font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cs-time" className="text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Time (IST)
                      </Label>
                      <Input
                        id="cs-time"
                        type="time"
                        value={form.time}
                        disabled
                        className="h-9 text-xs bg-muted font-mono"
                      />
                    </div>
                  </div>

                  {/* Customer Name Autocomplete Typeahead */}
                  <div ref={customerRef} className="space-y-1.5 relative">
                    <Label htmlFor="cs-customer" className="text-xs font-medium">
                      Customer Name <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="cs-customer"
                        placeholder="Search customer name / party..."
                        value={customerSearch}
                        onChange={e => {
                          setCustomerSearch(e.target.value);
                          setForm(prev => ({ ...prev, customer: e.target.value }));
                          setShowCustomerDropdown(true);
                          if (selectedCustomer) {
                            setSelectedCustomer(null);
                            setCustomerVehicles([]);
                            setForm(prev => ({ ...prev, vehicleNo: '' }));
                            setVehicleSearch('');
                          }
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        disabled={isView}
                        className="h-9 text-xs pr-8"
                        required={!isView}
                        autoComplete="off"
                      />
                      {loadingCustomers && (
                        <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                      )}
                    </div>
                    {showCustomerDropdown && customerSuggestions.length > 0 && !isView && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-slate-900">
                        {customerSuggestions.map(c => (
                          <div
                            key={c.id}
                            className="px-3.5 py-2.5 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch(c.customerName);
                              setForm(prev => ({ ...prev, customer: c.customerName }));
                              setCustomerVehicles(c.vehicles || []);
                              setShowCustomerDropdown(false);
                              // Auto populate first vehicle if only one exists
                              if (c.vehicles && c.vehicles.length > 0) {
                                const firstVeh = c.vehicles[0];
                                const formatted = formatVehicleNumber(firstVeh.vehicleNumber);
                                setVehicleSearch(formatted);
                                setForm(prev => {
                                  const updated = { ...prev, vehicleNo: formatted };
                                  if (firstVeh.fuelType) {
                                    const matchedProduct = products.find(p => 
                                      p.category === 'Fuel' && 
                                      p.name.toLowerCase().includes(firstVeh.fuelType.toLowerCase())
                                    );
                                    if (matchedProduct) {
                                      updated.productCategory = 'Fuel';
                                      updated.productId = matchedProduct.id;
                                      updated.productName = matchedProduct.name;
                                      updated.productUnit = matchedProduct.unit;
                                      updated.rate = '';
                                      updated.quantity = '';
                                      updated.totalAmount = '';
                                    }
                                  }
                                  return updated;
                                });
                              }
                            }}
                          >
                            <span className="font-semibold text-foreground">{c.customerName}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Code: {c.customerCode} · Limit: {c.creditLimit || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vehicle No Autocomplete Typeahead */}
                  <div ref={vehicleRef} className="space-y-1.5 relative">
                    <Label htmlFor="cs-vehicle" className="text-xs font-medium">
                      Vehicle No. <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="cs-vehicle"
                        placeholder="Search vehicle number (e.g. MH-67-63-4322)..."
                        value={vehicleSearch}
                        onChange={e => {
                          const formatted = formatVehicleNumber(e.target.value);
                          setVehicleSearch(formatted);
                          setForm(prev => ({ ...prev, vehicleNo: formatted }));
                          setShowVehicleDropdown(true);
                        }}
                        onFocus={() => setShowVehicleDropdown(true)}
                        disabled={isView}
                        className="h-9 text-xs pr-8 font-mono"
                        required={!isView}
                        autoComplete="off"
                      />
                      {loadingVehicles && (
                        <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                      )}
                    </div>
                    {showVehicleDropdown && vehicleSuggestions.length > 0 && !isView && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-slate-900">
                        {vehicleSuggestions.map((v, i) => (
                          <div
                            key={v.id || i}
                            className="px-3.5 py-2.5 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col"
                            onClick={() => {
                              const formatted = formatVehicleNumber(v.vehicleNumber);
                              setVehicleSearch(formatted);
                              setForm(prev => {
                                const updated = { ...prev, vehicleNo: formatted };
                                
                                // Auto-select product based on vehicle fuelType
                                if (v.fuelType) {
                                  const matchedProduct = products.find(p => 
                                    p.category === 'Fuel' && 
                                    p.name.toLowerCase().includes(v.fuelType.toLowerCase())
                                  );
                                  if (matchedProduct) {
                                    updated.productCategory = 'Fuel';
                                    updated.productId = matchedProduct.id;
                                    updated.productName = matchedProduct.name;
                                    updated.productUnit = matchedProduct.unit;
                                    updated.rate = '';
                                    updated.quantity = '';
                                    updated.totalAmount = '';
                                  }
                                }
                                return updated;
                              });

                              setShowVehicleDropdown(false);
                              // Auto cross-select customer if not selected
                              if (!selectedCustomer && v.customer) {
                                setSelectedCustomer(v.customer);
                                setCustomerSearch(v.customer.customerName);
                                setForm(prev => {
                                  const updated = { ...prev, customer: v.customer.customerName };
                                  // Re-run the product select inside this context if not already done
                                  if (v.fuelType) {
                                    const matchedProduct = products.find(p => 
                                      p.category === 'Fuel' && 
                                      p.name.toLowerCase().includes(v.fuelType.toLowerCase())
                                    );
                                    if (matchedProduct) {
                                      updated.productCategory = 'Fuel';
                                      updated.productId = matchedProduct.id;
                                      updated.productName = matchedProduct.name;
                                      updated.productUnit = matchedProduct.unit;
                                      updated.rate = '';
                                      updated.quantity = '';
                                      updated.totalAmount = '';
                                    }
                                  }
                                  return updated;
                                });
                                setCustomerVehicles(v.customer.vehicles || []);
                              }
                            }}
                          >
                            <span className="font-mono font-semibold text-foreground">{formatVehicleNumber(v.vehicleNumber)}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {v.vehicleType} {v.make ? `· ${v.make}` : ''} {v.fuelType ? `· ${v.fuelType}` : ''} {v.customer ? `(Owner: ${v.customer.customerName})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-status" className="text-xs font-medium">
                      Status <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.status}
                      onValueChange={(val: any) => setForm(prev => ({ ...prev, status: val }))}
                      disabled={isView}
                    >
                      <SelectTrigger id="cs-status" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ─────────────────────────────────
                    RIGHT COLUMN: Product & Sale Details
                ───────────────────────────────── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">
                    Product &amp; Sale Details
                  </h3>

                  {/* Product Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-category" className="text-xs font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Product Category <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.productCategory || 'NONE'}
                      onValueChange={(val: any) => {
                        if (val === 'NONE') return;
                        handleCategoryChange(val);
                      }}
                      disabled={isView}
                    >
                      <SelectTrigger id="cs-category" className="h-9 text-xs">
                        <SelectValue placeholder="-- Select Category --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select Category --</SelectItem>
                        <SelectItem value="Fuel">
                          <span className="flex items-center gap-2">
                            <Fuel className="w-3.5 h-3.5 text-orange-500" /> Fuel
                          </span>
                        </SelectItem>
                        <SelectItem value="Oil & Lubes">
                          <span className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-emerald-600" /> Oil &amp; Lubes
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Type (filtered by category) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-product" className="text-xs font-medium flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Product <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.productId || 'NONE'}
                      onValueChange={val => {
                        if (val === 'NONE') return;
                        handleProductChange(val);
                      }}
                      disabled={isView || !form.productCategory}
                    >
                      <SelectTrigger id="cs-product" className="h-9 text-xs">
                        <SelectValue placeholder={form.productCategory ? '-- Select Product --' : 'Select a category first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select Product --</SelectItem>
                        {filteredProducts.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            {form.productCategory ? 'No products in this category' : 'Select a category first'}
                          </SelectItem>
                        ) : (
                          filteredProducts.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} <span className="text-muted-foreground ml-1">({p.unit})</span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rate (auto-filled, editable) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-rate" className="text-xs font-medium">
                      Rate per Unit (₹) <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                      <Input
                        id="cs-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.rate}
                        onChange={e => {
                          setForm(prev => ({ ...prev, rate: e.target.value, quantity: '', totalAmount: '' }));
                        }}
                        disabled={isView}
                        className="h-9 text-xs pl-7 text-right font-mono"
                        onWheel={e => e.currentTarget.blur()}
                        required={!isView}
                      />
                    </div>
                    {form.productUnit && (
                      <p className="text-[11px] text-muted-foreground">Unit: <span className="font-medium">{form.productUnit}</span></p>
                    )}
                  </div>

                  {/* Quantity ↔ Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cs-qty" className="text-xs font-medium">
                        Quantity {form.productUnit ? `(${form.productUnit})` : ''}
                      </Label>
                      <Input
                        id="cs-qty"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={form.quantity}
                        onChange={e => handleQuantityChange(e.target.value)}
                        disabled={isView}
                        className="h-9 text-xs text-right font-mono"
                        onWheel={e => e.currentTarget.blur()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cs-total" className="text-xs font-medium">
                        Total Amount (₹)
                      </Label>
                      <Input
                        id="cs-total"
                        type="text"
                        placeholder="0.00"
                        value={form.totalAmount}
                        onChange={e => handleTotalAmountChange(e.target.value)}
                        disabled={isView}
                        className="h-9 text-xs text-right font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Computed total display */}
                  {(form.quantity || form.totalAmount) && form.rate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                      <span className="font-semibold text-blue-900 text-xs">Calculated Total:</span>
                      <span className="text-xl font-bold text-blue-600 font-mono">
                        ₹{(parseFloat(form.quantity || '0') * parseFloat(form.rate || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ─────────────────────────────────
                  BOTTOM SECTION: MPD & Nozzle (full width)
              ───────────────────────────────── */}
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">
                  Dispenser Assignment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* MPD */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-mpd" className="text-xs font-medium">
                      MPD (Dispenser) <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.mpdId || 'NONE'}
                      onValueChange={val => {
                        if (val === 'NONE') return;
                        handleMpdChange(val);
                      }}
                      disabled={isView}
                    >
                      <SelectTrigger id="cs-mpd" className="h-9 text-xs">
                        <SelectValue placeholder="-- Select MPD --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select MPD --</SelectItem>
                        {mpds.length === 0 ? (
                          <SelectItem value="_empty" disabled>No MPDs in master</SelectItem>
                        ) : (
                          mpds.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.mpdName} ({m.numberOfNozzles} nozzles)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nozzle (filtered by MPD) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-nozzle" className="text-xs font-medium">
                      Nozzle <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.nozzleId || 'NONE'}
                      onValueChange={val => {
                        if (val === 'NONE') return;
                        const n = availableNozzles.find(nz => nz.id === val);
                        setForm(prev => ({
                          ...prev,
                          nozzleId: val,
                          nozzleName: n?.nozzleName ?? ''
                        }));
                      }}
                      disabled={isView || !form.mpdId}
                    >
                      <SelectTrigger id="cs-nozzle" className="h-9 text-xs">
                        <SelectValue placeholder={form.mpdId ? '-- Select Nozzle --' : 'Select an MPD first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select Nozzle --</SelectItem>
                        {availableNozzles.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            {form.mpdId ? 'No nozzles configured for this MPD' : 'Select an MPD first'}
                          </SelectItem>
                        ) : (
                          availableNozzles.map(nz => (
                            <SelectItem key={nz.id ?? nz.nozzleName} value={nz.id ?? nz.nozzleName}>
                              {nz.nozzleName}
                              {nz.fuelType && <span className="text-muted-foreground ml-1">· {nz.fuelType}</span>}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0 bg-muted/20">
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
                  className="gap-2 min-w-[120px]"
                  disabled={saving}
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Plus className="w-4 h-4" /> {modalMode === 'edit' ? 'Save Changes' : 'Add Sale'}</>
                  }
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-semibold">
              <AlertTriangle className="w-5 h-5" />
              Delete Credit Sale Record?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to permanently delete this credit sale record? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-3 rounded-lg border border-border text-xs space-y-1">
            <p><span className="font-semibold text-foreground">Customer:</span> {recordToDelete?.customerName}</p>
            <p><span className="font-semibold text-foreground">Slip No:</span> {recordToDelete?.slipNo}</p>
            <p><span className="font-semibold text-foreground">Vehicle:</span> {recordToDelete?.vehicleNo}</p>
            <p><span className="font-semibold text-foreground">Amount:</span> {recordToDelete && formatCurrency(recordToDelete.totalAmount)}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowDeleteConfirm(false); setRecordToDelete(null); }}>
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