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
  ChevronDown,
  Eye,
  Edit,
  Pencil,
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
  Droplet,
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
  time: getISTTimeString()
};

export interface CreditSalesProps {
  embeddedModalOnly?: boolean;
  openModal?: boolean;
  modalMode?: 'add' | 'edit' | 'view';
  editRecord?: any;
  prefilledMpdName?: string;
  onCloseModal?: () => void;
  isEmbedded?: boolean;
  onTotalChange?: (total: number) => void;
  selectedDate?: string;
  selectedShift?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
}

export function CreditSales({
  embeddedModalOnly = false,
  openModal = false,
  modalMode: initialModalMode = 'add',
  editRecord = null,
  prefilledMpdName = '',
  onCloseModal,
  isEmbedded = false,
  onTotalChange,
  selectedDate,
  selectedShift,
  scopeMode = 'overall'
}: CreditSalesProps) {
  // ── Master data ──
  const [products, setProducts] = useState<Product[]>([]);
  const [mpds, setMpds] = useState<MPD[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // ── Table / pagination state ──
  const [records, setRecords] = useState<CreditSalesRecord[]>([]);
  const [statsRecords, setStatsRecords] = useState<CreditSalesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [mpdFilter, setMpdFilter] = useState('ALL');
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

  // ── Customer & Vehicle dropdown selection states ──
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([]);

  // ── Customer & Vehicle Autocomplete Typeahead States ──
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleSuggestions, setVehicleSuggestions] = useState<any[]>([]);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const customerRef = useRef<HTMLDivElement>(null);
  const vehicleRef = useRef<HTMLDivElement>(null);

  // ── Slip No validation warning state ──
  const [slipNoExists, setSlipNoExists] = useState(false);

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

  // ── Prefilled MPD Resolution Effect ──
  // Must be declared BEFORE loadRecords to avoid TDZ errors
  const [resolvedMpdName, setResolvedMpdName] = useState(prefilledMpdName);

  useEffect(() => {
    if (prefilledMpdName && mpds.length > 0) {
      const match = prefilledMpdName.match(/^MPD_?(\d+)$/i);
      if (match) {
        const idx = parseInt(match[1]) - 1;
        const sortedMpds = [...mpds].sort((a, b) => a.mpdName.localeCompare(b.mpdName));
        if (idx >= 0 && idx < sortedMpds.length) {
          setResolvedMpdName(sortedMpds[idx].mpdName);
          return;
        }
      }
      setResolvedMpdName(prefilledMpdName);
    } else {
      setResolvedMpdName(prefilledMpdName);
    }
  }, [prefilledMpdName, mpds]);

  // ─────────────────────────────────────────────
  // Load Credit Sales Records from backend
  // ─────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    // When embedded, wait until we have the resolved MPD name before fetching
    if (isEmbedded && !resolvedMpdName) return;
    setLoading(true);
    try {
      let activeFromDate = fromDateFilter;
      let activeToDate = toDateFilter;
      if (isEmbedded || scopeMode === 'shift' || scopeMode === 'day') {
        if (!fromDateFilter && !toDateFilter && selectedDate) {
          activeFromDate = selectedDate;
          activeToDate = selectedDate;
        }
      }
      if (scopeMode === 'overall') {
        activeFromDate = '';
        activeToDate = '';
      }

      // Always use resolvedMpdName as filter when embedded — never fall back to 'ALL'
      const activeMpdFilter = isEmbedded && resolvedMpdName
        ? resolvedMpdName
        : (mpdFilter !== 'ALL' ? mpdFilter : undefined);

      const res = await fetchCreditSales({
        page: currentPage,
        size: pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        mpd: activeMpdFilter || undefined,
        fromDate: activeFromDate || undefined,
        toDate: activeToDate || undefined,
        sortBy,
        sortDir
      });
      setRecords(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);

      // Fetch stats for total calculation, always scoped to the correct MPD when embedded
      const statsRes = await fetchCreditSales({
        page: 0,
        size: 100000,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        mpd: activeMpdFilter || undefined,
        fromDate: activeFromDate || undefined,
        toDate: activeToDate || undefined,
        sortBy,
        sortDir
      });

      // Extra client-side MPD name filter for safety when embedded
      let statsContent = statsRes.content;
      if (isEmbedded && resolvedMpdName) {
        const isMpdMatch = (rec?: string, tgt?: string) => {
          if (!rec || !tgt) return false;
          const rNorm = rec.toLowerCase().replace(/[^a-z0-9]/g, '');
          const tNorm = tgt.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (rNorm === tNorm || rNorm.includes(tNorm) || tNorm.includes(rNorm)) return true;
          const rNum = rec.match(/\d+/)?.[0];
          const tNum = tgt.match(/\d+/)?.[0];
          return Boolean(rNum && tNum && rNum === tNum);
        };

        statsContent = statsRes.content.filter(
          r => isMpdMatch(r.mpdName, resolvedMpdName)
        );
      }
      setStatsRecords(statsContent);
    } catch {
      toast.error('Failed to load credit sales records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, mpdFilter, resolvedMpdName, fromDateFilter, toDateFilter, sortBy, sortDir, isEmbedded, scopeMode, selectedDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (onTotalChange) {
      const sum = statsRecords.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      onTotalChange(sum);
    }
  }, [statsRecords, onTotalChange]);

  useEffect(() => {
    if (isEmbedded && resolvedMpdName) {
      setMpdFilter(resolvedMpdName);
      setCurrentPage(0);
    }
  }, [isEmbedded, resolvedMpdName]);

  // ─────────────────────────────────────────────
  // Load master data once on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingMaster(true);
      try {
        const [pRes, mRes, cRes] = await Promise.all([
          fetchProducts({ size: 1000 }),
          fetchMpdsAll(),
          fetchCustomers({ status: 'Active', size: 1000 })
        ]);
        setProducts(pRes.content);
        setMpds(mRes);
        setAllCustomers(cRes.content);
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
  // Slip No duplicate validation check
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!form.slipNo.trim() || form.slipNo === 'SLIP...' || modalMode === 'view') {
      setSlipNoExists(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetchCreditSales({ search: form.slipNo.trim() });
        const exists = res.content.some(
          r => r.slipNo.toLowerCase() === form.slipNo.trim().toLowerCase() && r.id !== activeRecordId
        );
        setSlipNoExists(exists);
      } catch {
        setSlipNoExists(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.slipNo, activeRecordId, modalMode]);

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
    setSlipNoExists(false);
    
    let defaultMpdId = '';
    let defaultMpdName = '';
    if (resolvedMpdName && mpds.length > 0) {
      const found = mpds.find(m => m.mpdName.toLowerCase() === resolvedMpdName.toLowerCase());
      if (found) {
        defaultMpdId = found.id;
        defaultMpdName = found.mpdName;
      }
    }

    setForm({
      ...INIT_FORM,
      date: getISTDateString(),
      time: getISTTimeString(),
      voucherNo: 'CRVCH...',
      slipNo: 'SLIP...',
      mpdId: defaultMpdId,
      mpdName: defaultMpdName
    });
    
    setShowModal(true);

    try {
      const [vch, slp] = await Promise.all([
        fetchNextVoucherNo(),
        fetchNextSlipNo(getISTDateString())
      ]);
      setForm(prev => ({ 
        ...prev, 
        voucherNo: vch, 
        slipNo: slp,
        mpdId: prev.mpdId || defaultMpdId,
        mpdName: prev.mpdName || defaultMpdName
      }));
    } catch {
      toast.error('Failed to pre-fetch auto-generated voucher codes.');
    }
  };

  const handleEdit = async (record: CreditSalesRecord) => {
    setModalMode('edit');
    setActiveRecordId(record.id);
    setSlipNoExists(false);

    // Resolve matching customer record to get vehicle lists
    const matchedCustomer = allCustomers.find(c => c.customerName.toLowerCase() === record.customerName.toLowerCase());
    if (matchedCustomer) {
      setSelectedCustomer(matchedCustomer);
      setCustomerVehicles(matchedCustomer.vehicles || []);
    } else {
      setSelectedCustomer(null);
      setCustomerVehicles([]);
    }

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
      time: record.saleTime
    });

    setCustomerSearch(record.customerName);
    setVehicleSearch(record.vehicleNo);
    setShowModal(true);
  };

  const handleView = async (record: CreditSalesRecord) => {
    setModalMode('view');
    setActiveRecordId(record.id);

    // Resolve matching customer record to get vehicle lists
    const matchedCustomer = allCustomers.find(c => c.customerName.toLowerCase() === record.customerName.toLowerCase());
    if (matchedCustomer) {
      setSelectedCustomer(matchedCustomer);
      setCustomerVehicles(matchedCustomer.vehicles || []);
    } else {
      setSelectedCustomer(null);
      setCustomerVehicles([]);
    }

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
      time: record.saleTime
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

    if (slipNoExists) {
      toast.error('Cannot submit because Slip No. already exists.');
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
        slipNo: form.slipNo
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
    const headers = ['Slip No', 'Voucher No', 'Date', 'Sale Time', 'Customer', 'Vehicle No', 'Product Category', 'Product Name', 'Qty', 'Unit', 'Rate', 'Total Amount', 'MPD', 'Nozzle'];
    const rows = data.map(r => [
      r.slipNo, r.voucherNo, r.date, r.saleTime, r.customerName,
      r.vehicleNo, r.productCategory, r.productName,
      r.quantity, r.productUnit, r.rate, r.totalAmount,
      r.mpdName, r.nozzleName
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(','))].join('\n');
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
          <th>MPD</th><th>Nozzle</th>
        </tr>`;
    data.forEach(r => {
      html += `<tr><td>${r.slipNo}</td><td>${r.voucherNo}</td><td>${formatDateToDMY(r.date)}</td><td>${r.saleTime}</td><td>${r.customerName}</td><td>${r.vehicleNo}</td><td>${r.productCategory}</td><td>${r.productName}</td><td>${r.quantity}</td><td>${r.productUnit}</td><td>${r.rate}</td><td>${r.totalAmount}</td><td>${r.mpdName}</td><td>${r.nozzleName}</td></tr>`;
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
        <th style="width:40px">S.No</th><th>Slip No</th><th>Date &amp; Time</th><th>Customer</th><th>Vehicle</th><th>Product</th><th style="text-align:right">Amount</th>
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
        mpd: mpdFilter !== 'ALL' ? mpdFilter : undefined,
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
        mpd: mpdFilter !== 'ALL' ? mpdFilter : undefined,
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

  const isView = modalMode === 'view';

  if (embeddedModalOnly) {
    if (!showModal) return null;
    return (
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if(!open) onCloseModal?.(); }}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '1100px', width: '92vw', maxHeight: '90vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {modalMode === 'add' ? `Daily Operations > Credit Sales > Add New Credit Sale (${resolvedMpdName || 'MPD'})` : modalMode === 'edit' ? `Daily Operations > Credit Sales > Edit Credit Sale (${resolvedMpdName || 'MPD'})` : `Daily Operations > Credit Sales > View Credit Sale (${resolvedMpdName || 'MPD'})`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {modalMode === 'add' ? 'Fill in details to record a new credit fuel/lubricant sale' : modalMode === 'edit' ? 'Update credit sale record details' : 'View complete credit sale record details'}
                </DialogDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-primary/5 text-primary border-primary/20">
                {modalMode === 'add' ? 'NEW ENTRY' : modalMode === 'edit' ? 'EDIT MODE' : 'READ ONLY'}
              </Badge>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SECTION 1: VOUCHER, SLIP & TIME */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Voucher &amp; Slip Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cs-voucher" className="text-xs font-medium">Voucher Number</Label>
                  <Input id="cs-voucher" disabled value={form.voucherNo || (modalMode === 'add' ? 'CS-AUTO' : '')} tabIndex={-1} className="h-9 text-xs font-mono bg-muted" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cs-slip" className="text-xs font-medium">Slip Number <span className="text-red-500 font-bold">*</span></Label>
                  <Input id="cs-slip" disabled={isView} value={form.slipNo} onChange={e => handleSlipNoChange(e.target.value)} tabIndex={1} className="h-9 text-xs font-mono bg-background" placeholder="e.g. SLIP-2026-001" required />
                  {slipError && <p className="text-[10px] text-red-500 font-medium absolute mt-0.5">{slipError}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cs-date" className="text-xs font-medium">Date</Label>
                  <Input id="cs-date" type="date" disabled={isView} value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} tabIndex={2} className="h-9 text-xs bg-background" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cs-time" className="text-xs font-medium">Time (IST)</Label>
                  <Input id="cs-time" type="time" disabled={isView} value={form.time} onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))} tabIndex={3} className="h-9 text-xs bg-background font-mono" required />
                </div>
              </div>
            </div>

            {/* SECTION 2: CUSTOMER & VEHICLE */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Customer &amp; Vehicle Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <Label htmlFor="cs-customer" className="text-xs font-medium">Customer Name <span className="text-red-500 font-bold">*</span></Label>
                  <Input id="cs-customer" disabled={isView} value={customerSearch} onChange={e => handleCustomerSearchChange(e.target.value)} onFocus={() => setShowCustDropdown(true)} tabIndex={4} className="h-9 text-xs font-medium" placeholder="Search customer name..." required autoComplete="off" />
                  {showCustDropdown && customerSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto bg-white dark:bg-slate-900">
                      {customerSuggestions.map(c => (
                        <div key={c.id} className="px-3 py-2 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col" onClick={() => handleCustomerSelect(c)}>
                          <span className="font-semibold text-foreground">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{c.phone || c.email || 'Registered Customer'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1 relative">
                  <Label htmlFor="cs-vehicle" className="text-xs font-medium">Vehicle / Truck Number</Label>
                  <Input id="cs-vehicle" disabled={isView || !form.customer} value={vehicleSearch} onChange={e => handleVehicleSearchChange(e.target.value.toUpperCase())} onFocus={() => setShowVehicleDropdown(true)} tabIndex={5} className="h-9 text-xs font-mono" placeholder={!form.customer ? 'Select customer first' : 'Enter truck/vehicle no...'} autoComplete="off" />
                  {showVehicleDropdown && vehicleSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto bg-white dark:bg-slate-900">
                      {vehicleSuggestions.map((v, i) => (
                        <div key={i} className="px-3 py-2 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors" onClick={() => handleVehicleSelect(v)}>
                          <span className="font-mono font-semibold text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: PRODUCT & PRICING */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Product &amp; Pricing Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cs-cat" className="text-xs font-medium">Category</Label>
                  <Select value={form.productCategory} onValueChange={v => setForm(prev => ({ ...prev, productCategory: v as any, productId: '', productName: '', productUnit: '' }))} disabled={isView}>
                    <SelectTrigger id="cs-cat" tabIndex={6} className="h-9 text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent><SelectItem value="Fuel">Fuel</SelectItem><SelectItem value="Oil & Lubes">Oil &amp; Lubes</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cs-product" className="text-xs font-medium">Product <span className="text-red-500 font-bold">*</span></Label>
                  <Select value={form.productId} onValueChange={handleProductChange} disabled={isView || loadingMaster}>
                    <SelectTrigger id="cs-product" tabIndex={7} className="h-9 text-xs"><SelectValue placeholder="Select Product" /></SelectTrigger>
                    <SelectContent>{filteredProducts.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cs-rate" className="text-xs font-medium">Rate (₹/unit)</Label>
                  <Input id="cs-rate" type="number" disabled value={form.rate} tabIndex={-1} className="h-9 text-xs bg-muted/60 font-mono" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cs-qty" className="text-xs font-medium">Quantity ({form.productUnit || 'unit'}) <span className="text-red-500 font-bold">*</span></Label>
                  <Input id="cs-qty" type="number" min="0.01" step="0.01" disabled={isView} value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} onWheel={e => e.currentTarget.blur()} tabIndex={8} className="h-9 text-xs font-mono bg-background" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Total Amount (₹)</Label>
                  <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted font-bold text-primary font-mono text-xs cursor-not-allowed">
                    {form.totalAmount ? formatCurrency(parseFloat(form.totalAmount)) : '₹ 0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="pt-4 border-t border-border gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); onCloseModal?.(); }}>Cancel</Button>
              {!isView && (
                <Button type="submit" disabled={saving || !!slipError} className="min-w-[120px] bg-blue-600 hover:bg-blue-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {modalMode === 'add' ? 'Save Record' : 'Update Record'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={isEmbedded ? "p-0" : "p-8"}>

      {/* ── Header ── */}
      {!isEmbedded ? (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-2">Credit Sales</h1>
            <p className="text-muted-foreground">Manage vehicle-based credit fuel &amp; oil sales with slip generation</p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Add New Sale
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Credit Sales - {resolvedMpdName}</h3>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <Plus className="w-4 h-4" />
            Add New Sale
          </Button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      {!isEmbedded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">
                {formatCurrency(statsRecords.reduce((s, r) => s + r.totalAmount, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total Credit Sales (Overall)</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{totalElements}</p>
              <p className="text-xs text-muted-foreground">Total Slip Records</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">
                {formatCurrency(statsRecords.length > 0 ? (statsRecords.reduce((s, r) => s + r.totalAmount, 0) / statsRecords.length) : 0)}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Sale (Overall)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter / Search Bar ── */}
      {!isEmbedded && (
        <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customer, slip, vehicle, product..."
                className="pl-9"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              />
            </div>

            {/* Date From */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">From</label>
              <input
                type="date"
                value={fromDateFilter}
                onChange={e => { setFromDateFilter(e.target.value); setCurrentPage(0); }}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">To</label>
              <input
                type="date"
                value={toDateFilter}
                onChange={e => { setToDateFilter(e.target.value); setCurrentPage(0); }}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Category Filter */}
            <div className="w-36">
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Fuel">Fuel</SelectItem>
                  <SelectItem value="Oil & Lubes">Oil & Lubes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* MPD Filter */}
            {!isEmbedded && (
              <div className="w-36">
                <Select value={mpdFilter} onValueChange={v => { setMpdFilter(v); setCurrentPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="MPD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All MPDs</SelectItem>
                    {mpds.map(m => (
                      <SelectItem key={m.id} value={m.mpdName}>
                        {m.mpdName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
      )}

      {/* ── Main Table ── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading credit sales records...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <CreditCard className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No credit sale records found</p>
              <p className="text-xs">
                {(searchTerm || categoryFilter !== 'ALL' || fromDateFilter || toDateFilter) ? 'Try relaxing your search or filter inputs.' : 'Click "Add New Sale" to create the first record.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="w-12 text-center p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer align-middle rounded border-border"
                    />
                  </th>
                  <th className="w-16 text-left p-4 font-medium text-muted-foreground">S.No</th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('customerName')}>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> Customer<SortIcon field="customerName" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('slipNo')}>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground" /> Slip No<SortIcon field="slipNo" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('quantity')}>
                    <div className="flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-muted-foreground" /> Quantity (L)<SortIcon field="quantity" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('productName')}>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" /> Product<SortIcon field="productName" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('date')}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date &amp; Time<SortIcon field="date" />
                    </div>
                  </th>
                  <th className="text-right p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('totalAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      Amount <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /><SortIcon field="totalAmount" />
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((record, index) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="w-12 text-center p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="w-4 h-4 cursor-pointer align-middle rounded border-border"
                      />
                    </td>
                    <td className="w-16 p-4 font-medium text-muted-foreground">
                      {currentPage * pageSize + index + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 text-xs">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {record.customerName ? record.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{record.customerName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-foreground">{record.slipNo}</td>
                    <td className="p-4 font-mono text-sm font-semibold text-blue-600">
                      {record.quantity ? `${record.quantity.toFixed(2)} ${record.productUnit || 'L'}` : '0.00 L'}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{record.productName}</p>
                        <p className="text-xs text-muted-foreground">{record.productCategory} · {record.quantity} {record.productUnit}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-mono text-sm">{formatDateToDMY(record.date)}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {record.saleTime}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-foreground font-mono text-base">
                      {formatCurrency(record.totalAmount)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(record)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t border-border text-xs font-medium">
                <tr>
                  <td colSpan={7} className="p-4 text-left font-semibold">
                    Page Total ({paginated.length} records)
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-foreground text-base">
                    {formatCurrency(paginated.reduce((s, r) => s + r.totalAmount, 0))}
                  </td>
                  <td colSpan={1} className="p-4 text-muted-foreground text-left">
                    Overall Total: <span className="font-mono text-foreground font-bold">{formatCurrency(statsRecords.reduce((s, r) => s + r.totalAmount, 0))}</span> · Total Count: <span className="font-mono text-foreground font-bold">{totalElements}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalElements > 0 && (
          <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
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
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          ADD / EDIT / VIEW MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if(!open) onCloseModal?.(); }}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '1100px', width: '92vw', maxHeight: '90vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <CreditCard className="w-5 h-5 text-primary" />
                {modalMode === 'add'
                  ? 'Add New Credit Sale'
                  : modalMode === 'edit'
                  ? 'Edit Credit Sale'
                  : 'Credit Sale Details'}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* ─────────────────────────────────
                  SECTION 1: SALE HEADER & PARTY DETAILS
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Sale Header &amp; Customer Information
                </h3>

                {/* Row 1: Voucher No, Slip No, Date, Time (4 Columns) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Voucher No */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-voucherNo" className="text-xs font-medium flex items-center gap-1">
                      <Hash className="w-3 h-3 text-muted-foreground" /> Voucher No
                    </Label>
                    <Input
                      id="cs-voucherNo"
                      value={form.voucherNo}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs bg-muted/60 font-mono"
                    />
                  </div>

                  {/* Slip No */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-slipNo" className="text-xs font-medium flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-muted-foreground" /> Slip No <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="cs-slipNo"
                      value={form.slipNo}
                      onChange={e => setForm(prev => ({ ...prev, slipNo: e.target.value }))}
                      disabled={isView}
                      tabIndex={1}
                      className={`h-9 text-xs font-mono ${isView ? 'bg-muted' : 'bg-background'}`}
                      required={!isView}
                    />
                    {slipNoExists && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        Already exists!
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-date" className="text-xs font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" /> Date (IST)
                    </Label>
                    <Input
                      id="cs-date"
                      type="date"
                      value={form.date}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs bg-muted/60 font-mono"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-time" className="text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" /> Time (IST)
                    </Label>
                    <Input
                      id="cs-time"
                      type="time"
                      value={form.time}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs bg-muted/60 font-mono"
                    />
                  </div>
                </div>

                {/* Row 2: Customer Name & Vehicle No (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                  {/* Customer Name Autocomplete Typeahead */}
                  <div ref={customerRef} className="space-y-1 relative">
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
                        tabIndex={2}
                        className="h-9 text-xs pr-10 bg-background"
                        required={!isView}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => {
                          if (!isView) {
                            setShowCustomerDropdown(prev => !prev);
                          }
                        }}
                        disabled={isView}
                      >
                        {loadingCustomers ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {showCustomerDropdown && !isView && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto bg-white dark:bg-slate-900">
                        {(() => {
                          const displayList = customerSearch.trim()
                            ? customerSuggestions
                            : allCustomers.slice(0, 10);
                          
                          if (displayList.length === 0) {
                            return (
                              <div className="px-3.5 py-2 text-xs text-muted-foreground italic">
                                No customers found
                              </div>
                            );
                          }

                          return displayList.map(c => (
                            <div
                              key={c.id}
                              className="px-3 py-2 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col"
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
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Vehicle No Autocomplete Typeahead */}
                  <div ref={vehicleRef} className="space-y-1 relative">
                    <Label htmlFor="cs-vehicle" className="text-xs font-medium">
                      Vehicle No. <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="cs-vehicle"
                        placeholder={selectedCustomer ? "Search vehicle number..." : "Select a customer first"}
                        value={vehicleSearch}
                        onChange={e => {
                          const formatted = formatVehicleNumber(e.target.value);
                          setVehicleSearch(formatted);
                          setForm(prev => ({ ...prev, vehicleNo: formatted }));
                          setShowVehicleDropdown(true);
                        }}
                        onFocus={() => {
                          if (selectedCustomer) {
                            setShowVehicleDropdown(true);
                          }
                        }}
                        disabled={isView || !selectedCustomer}
                        tabIndex={3}
                        className="h-9 text-xs pr-10 font-mono bg-background"
                        required={!isView}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                        onClick={() => {
                          if (!isView && selectedCustomer) {
                            setShowVehicleDropdown(prev => !prev);
                          }
                        }}
                        disabled={isView || !selectedCustomer}
                      >
                        {loadingVehicles ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {showVehicleDropdown && !isView && selectedCustomer && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto bg-white dark:bg-slate-900">
                        {(() => {
                          const displayList = vehicleSearch.trim()
                            ? vehicleSuggestions
                            : customerVehicles.slice(0, 10);
                          
                          if (displayList.length === 0) {
                            return (
                              <div className="px-3.5 py-2 text-xs text-muted-foreground italic">
                                No vehicles found
                              </div>
                            );
                          }

                          return displayList.map((v, i) => {
                            const formatted = formatVehicleNumber(v.vehicleNumber);
                            return (
                              <div
                                key={v.id || i}
                                className="px-3 py-2 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col"
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
                                }}
                              >
                                <span className="font-mono font-semibold text-foreground">{formatted}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  {v.vehicleType} {v.make ? `· ${v.make}` : ''} {v.fuelType ? `· ${v.fuelType}` : ''}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 2: PRODUCT & SALE DETAILS (5 Columns)
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Product &amp; Fuel Details
                </h3>

                {/* 5 Column Grid for Category, Product, Rate, Quantity, Total Amount */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* Product Category */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-category" className="text-xs font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3 text-muted-foreground" /> Category <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.productCategory || 'NONE'}
                      onValueChange={(val: any) => {
                        if (val === 'NONE') return;
                        handleCategoryChange(val);
                      }}
                      disabled={isView}
                    >
                      <SelectTrigger id="cs-category" className="h-9 text-xs" tabIndex={4}>
                        <SelectValue placeholder="-- Category --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Category --</SelectItem>
                        <SelectItem value="Fuel">
                          <span className="flex items-center gap-1.5">
                            <Fuel className="w-3.5 h-3.5 text-orange-500" /> Fuel
                          </span>
                        </SelectItem>
                        <SelectItem value="Oil & Lubes">
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-emerald-600" /> Oil &amp; Lubes
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Type */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-product" className="text-xs font-medium flex items-center gap-1">
                      <Tag className="w-3 h-3 text-muted-foreground" /> Product <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.productId || 'NONE'}
                      onValueChange={val => {
                        if (val === 'NONE') return;
                        handleProductChange(val);
                      }}
                      disabled={isView || !form.productCategory}
                    >
                      <SelectTrigger id="cs-product" className="h-9 text-xs" tabIndex={5}>
                        <SelectValue placeholder={form.productCategory ? '-- Select --' : 'Category first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select Product --</SelectItem>
                        {filteredProducts.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            {form.productCategory ? 'No products' : 'Select a category first'}
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

                  {/* Rate */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-rate" className="text-xs font-medium">
                      Rate/Unit (₹) <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
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
                        disabled={isView || form.productCategory === 'Fuel'}
                        tabIndex={6}
                        className={`h-9 text-xs pl-6 text-right font-mono ${(isView || form.productCategory === 'Fuel') ? 'bg-muted' : ''}`}
                        onWheel={e => e.currentTarget.blur()}
                        required={!isView}
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-qty" className="text-xs font-medium">
                      Quantity {form.productUnit ? `(${form.productUnit})` : ''} <span className="text-red-500 font-bold">*</span>
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
                      tabIndex={7}
                      className="h-9 text-xs text-right font-mono"
                      onWheel={e => e.currentTarget.blur()}
                    />
                  </div>

                  {/* Total Amount */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-total" className="text-xs font-medium">
                      Total Amount (₹) <span className="text-muted-foreground font-normal">(Auto)</span>
                    </Label>
                    <Input
                      id="cs-total"
                      type="text"
                      placeholder="0.00"
                      value={form.totalAmount}
                      onChange={e => handleTotalAmountChange(e.target.value)}
                      disabled={true}
                      tabIndex={-1}
                      className="h-9 text-xs text-right font-mono font-bold text-primary bg-muted/60"
                    />
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 3: DISPENSER ASSIGNMENT
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Dispenser Assignment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* MPD */}
                  <div className="space-y-1">
                    <Label htmlFor="cs-mpd" className="text-xs font-medium">
                      MPD (Dispenser) <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={form.mpdId || 'NONE'}
                      onValueChange={val => {
                        if (val === 'NONE') return;
                        handleMpdChange(val);
                      }}
                      disabled={isView || (isEmbedded && !!resolvedMpdName)}
                    >
                      <SelectTrigger id="cs-mpd" className="h-9 text-xs" tabIndex={8}>
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

                  {/* Nozzle */}
                  <div className="space-y-1">
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
                      <SelectTrigger id="cs-nozzle" className="h-9 text-xs" tabIndex={9}>
                        <SelectValue placeholder={form.mpdId ? '-- Select Nozzle --' : 'Select an MPD first'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select Nozzle --</SelectItem>
                        {availableNozzles.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            {form.mpdId ? 'No nozzles configured' : 'Select an MPD first'}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[120px]"
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