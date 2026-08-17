import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  IndianRupee,
  Plus,
  Calendar,
  Clock,
  Search,
  Truck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Pencil,
  Trash2,
  Download,
  FileDown,
  CheckSquare,
  Loader2,
  CalendarDays,
  TrendingUp,
  Fuel,
  Hash,
  Tag,
  AlertTriangle,
  Car,
  Gauge,
  Droplet
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
  OwnUsageRecord,
  fetchOwnUsages,
  createOwnUsageApi,
  updateOwnUsageApi,
  deleteOwnUsageApi,
  fetchNextOwnUsageSlipApi,
  fetchEmployees,
  Employee,
  fetchLatestOrDateRates,
} from '../services/api';
import { isRecordInShift } from '../utils/shiftUtils';
import { resolveMpdNameFromList, isStrictMpdMatch } from '../utils/mpdUtils';


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getISTDateString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

function getISTTimeString(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const hh = String(ist.getUTCHours()).padStart(2, '0');
  const mm = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

const PURPOSE_BADGE: Record<string, string> = {
  'Personal': 'bg-purple-50/80 text-purple-700 border-purple-200',
  'Maintenance': 'bg-orange-50/80 text-orange-700 border-orange-200',
  'Office Use': 'bg-sky-50/80 text-sky-700 border-sky-200',
  'Generator': 'bg-amber-50/80 text-amber-700 border-amber-200',
  'Other': 'bg-slate-50/80 text-slate-600 border-slate-200',
};

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
  slipNo: '',
  date: getISTDateString(),
  usageTime: getISTTimeString(),
  vehicleId: '',
  vehicleNumber: '',
  vehicleType: '',
  fuelType: '',
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
  purpose: '' as '' | 'Personal' | 'Maintenance' | 'Office Use' | 'Generator' | 'Other',
  remarks: '',
  authorizedBy: '',
  approvedBy: '',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export interface OwnUsageProps {
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

export function OwnUsage({
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
}: OwnUsageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mpds, setMpds] = useState<MPD[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  const [records, setRecords] = useState<OwnUsageRecord[]>([]);
  const [statsRecords, setStatsRecords] = useState<OwnUsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<OwnUsageRecord | null>(null);

  const [form, setForm] = useState({ ...INIT_FORM });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Vehicle Autocomplete Typeahead States
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [vehicleSuggestions, setVehicleSuggestions] = useState<Vehicle[]>([]);
  const vehicleRef = useRef<HTMLDivElement>(null);

  // Click outside to close vehicle typeahead dropdown
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (vehicleRef.current && !vehicleRef.current.contains(e.target as Node)) {
        setShowVehicleDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter vehicle suggestions from pre-fetched vehicles master data
  useEffect(() => {
    if (!vehicleSearch.trim() || modalMode === 'view') {
      setVehicleSuggestions([]);
      return;
    }
    const query = vehicleSearch.trim().toLowerCase();
    const filtered = vehicles.filter(v =>
      v.vehicleNumber.toLowerCase().includes(query)
    );
    setVehicleSuggestions(filtered.slice(0, 10));
  }, [vehicleSearch, vehicles, modalMode]);

  // Compute inline warning if search vehicle doesn't match any in master
  const isVehicleWarning = (() => {
    if (!vehicleSearch.trim() || modalMode === 'view') return false;
    const match = vehicles.find(v => v.vehicleNumber.toLowerCase() === vehicleSearch.trim().toLowerCase());
    return !match;
  })();

  const availableNozzles: Nozzle[] = (() => {
    if (!form.mpdId) return [];
    const mpd = mpds.find(m => m.id === form.mpdId);
    return mpd ? mpd.nozzles : [];
  })();

  // ── Derived: filtered products by category, MPD & nozzle ──
  const filteredProducts = (() => {
    if (!form.productCategory) return products;
    let list = products.filter(p => p.category === form.productCategory);

    if (form.productCategory === 'Fuel' && form.mpdId) {
      const selectedNozzle = availableNozzles.find(nz => nz.id === form.nozzleId || nz.nozzleName === form.nozzleName);

      if (selectedNozzle) {
        const fuelName = selectedNozzle.fuelType || (selectedNozzle as any).connectedTank || '';
        if (fuelName) {
          const normFuel = fuelName.toLowerCase().trim();
          const matched = list.filter(p => {
            const normP = p.name.toLowerCase().trim();
            return normP === normFuel || normP.includes(normFuel) || normFuel.includes(normP);
          });
          if (matched.length > 0) return matched;
        }
      }

      if (availableNozzles.length > 0) {
        const mpdFuelNames = availableNozzles
          .map(nz => (nz.fuelType || (nz as any).connectedTank || '').toLowerCase().trim())
          .filter(Boolean);

        if (mpdFuelNames.length > 0) {
          const matched = list.filter(p => {
            const normP = p.name.toLowerCase().trim();
            return mpdFuelNames.some(f => normP === f || normP.includes(f) || f.includes(normP));
          });
          if (matched.length > 0) return matched;
        }
      }
    }

    return list;
  })();

  // ── Prefilled MPD Resolution Effect ──
  const [resolvedMpdName, setResolvedMpdName] = useState(() => resolveMpdNameFromList(prefilledMpdName, mpds));

  useEffect(() => {
    if (prefilledMpdName) {
      setResolvedMpdName(resolveMpdNameFromList(prefilledMpdName, mpds));
    }
  }, [prefilledMpdName, mpds]);

  // ── Load records ──
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      let activeFromDate = fromDateFilter;
      let activeToDate = toDateFilter;
      if (scopeMode === 'overall') {
        activeFromDate = '';
        activeToDate = '';
      } else if (isEmbedded || scopeMode === 'shift' || scopeMode === 'day') {
        if (!fromDateFilter && !toDateFilter && selectedDate) {
          activeFromDate = selectedDate;
          activeToDate = selectedDate;
        }
      }

      const fetchParams: any = {
        page: isEmbedded ? 0 : currentPage,
        size: isEmbedded ? 10000 : pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
        fromDate: activeFromDate || undefined,
        toDate: activeToDate || undefined,
        sortBy, sortDir
      };

      const res = await fetchOwnUsages(fetchParams);

      let filteredContent = res.content;
      if (isEmbedded && resolvedMpdName) {
        const isMpdMatch = (rec?: any, tgt?: string) => {
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

        let filtered = res.content.filter(r => {
          const mpdStr = r.mpdName || (r as any).mpd || (r as any).mpdId || (r as any).dispenser || '';
          const mpdOk = isStrictMpdMatch(mpdStr, resolvedMpdName);
          const shiftOk = (scopeMode === 'shift' && selectedShift)
            ? isRecordInShift(r.shiftName, r.usageTime || (r as any).time, selectedShift)
            : true;
          return mpdOk && shiftOk;
        });

        // Fallback 1: If date/shift filter yields 0 records but res.content has MPD records, display MPD records
        if (filtered.length === 0 && res.content.length > 0) {
          filtered = res.content.filter(r => {
            const mpdStr = r.mpdName || (r as any).mpd || (r as any).mpdId || (r as any).dispenser || '';
            return isStrictMpdMatch(mpdStr, resolvedMpdName);
          });
        }

        // Fallback 2: If fetch with activeFromDate returned 0 records, fetch all records for this MPD
        if (filtered.length === 0 && activeFromDate) {
          try {
            const fallbackRes = await fetchOwnUsages({
              page: 0,
              size: 1000,
              mpd: resolvedMpdName
            });
            if (fallbackRes && fallbackRes.content && fallbackRes.content.length > 0) {
              filtered = fallbackRes.content.filter(r => {
                const mpdStr = r.mpdName || (r as any).mpd || (r as any).mpdId || (r as any).dispenser || '';
                return isStrictMpdMatch(mpdStr, resolvedMpdName);
              });
            }
          } catch (e) {
            // ignore fallback error
          }
        }

        filteredContent = filtered;
      }

      if (isEmbedded) {
        const total = filteredContent.length;
        const totalPagesCount = Math.ceil(total / pageSize) || 1;
        const start = currentPage * pageSize;
        const paginatedContent = filteredContent.slice(start, start + pageSize);

        setRecords(paginatedContent);
        setTotalPages(totalPagesCount);
        setTotalElements(total);
      } else {
        setRecords(filteredContent);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      }

      // Fetch stats globally or scoped based on scopeMode
      const statsRes = await fetchOwnUsages({
        page: 0,
        size: 100000,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
        fromDate: activeFromDate || undefined,
        toDate: activeToDate || undefined,
        sortBy, sortDir
      });

      let statsFiltered = statsRes.content;
      if (isEmbedded && resolvedMpdName) {
        statsFiltered = statsRes.content.filter(
          r => isStrictMpdMatch(r.mpdName || (r as any).mpd || (r as any).mpdId, resolvedMpdName)
        );
        if (statsFiltered.length === 0 && filteredContent.length > 0) {
          statsFiltered = filteredContent;
        }
      }
      setStatsRecords(statsFiltered);
    } catch {
      toast.error('Failed to load own usage records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, categoryFilter, purposeFilter, fromDateFilter, toDateFilter, sortBy, sortDir, isEmbedded, resolvedMpdName, scopeMode, selectedDate, selectedShift]);

  useEffect(() => {
    if (isEmbedded && resolvedMpdName) {
      setCurrentPage(0);
    }
  }, [isEmbedded, resolvedMpdName]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  useEffect(() => {
    if (onTotalChange) {
      const sum = statsRecords.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
      onTotalChange(sum);
    }
  }, [statsRecords, onTotalChange]);

  // ── Load master data ──
  useEffect(() => {
    const load = async () => {
      setLoadingMaster(true);
      try {
        const [vRes, pRes, mRes, eRes] = await Promise.all([
          fetchVehicles({ size: 1000, status: 'Active' }),
          fetchProducts({ size: 1000 }),
          fetchMpdsAll(),
          fetchEmployees({ size: 1000, status: 'Active' })
        ]);
        setVehicles(vRes.content);
        setProducts(pRes.content);
        setMpds(mRes);
        setEmployees(eRes.content);
      } catch {
        toast.error('Failed to load master data (vehicles, products, MPDs, employees).');
      } finally {
        setLoadingMaster(false);
      }
    };
    load();
  }, []);

  // ── Dynamic Rate Lookup ──
  const loadDynamicRate = useCallback(async (productId: string, dateStr: string) => {
    if (!productId || !dateStr) return;
    const p = products.find(prod => String(prod.id) === String(productId) || prod.name === productId);
    if (!p) return;
    try {
      const ratesMap = await fetchLatestOrDateRates(dateStr);
      let dynamicRate: number | undefined = undefined;
      if (ratesMap[p.id] !== undefined && Number(ratesMap[p.id]) > 0) dynamicRate = Number(ratesMap[p.id]);
      else if (ratesMap[String(p.id)] !== undefined && Number(ratesMap[String(p.id)]) > 0) dynamicRate = Number(ratesMap[String(p.id)]);
      else if (ratesMap[p.name] !== undefined && Number(ratesMap[p.name]) > 0) dynamicRate = Number(ratesMap[p.name]);
      else if (ratesMap[p.name.toLowerCase()] !== undefined && Number(ratesMap[p.name.toLowerCase()]) > 0) dynamicRate = Number(ratesMap[p.name.toLowerCase()]);
      else if ((p as any).price > 0) dynamicRate = Number((p as any).price);

      if (dynamicRate !== undefined && dynamicRate > 0) {
        setForm(prev => ({ ...prev, rate: String(dynamicRate) }));
      }
    } catch {
      if ((p as any).price > 0) {
        setForm(prev => ({ ...prev, rate: String((p as any).price) }));
      }
    }
  }, [products]);

  // ── Auto-calculate total ──
  useEffect(() => {
    const q = parseFloat(form.quantity) || 0;
    const r = parseFloat(form.rate) || 0;
    if (q > 0 && r > 0) {
      setForm(prev => ({ ...prev, totalAmount: (q * r).toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, totalAmount: '' }));
    }
  }, [form.quantity, form.rate]);

  // ── Field handlers ──
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setForm(prev => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      fuelType: vehicle.fuelType
    }));
    setVehicleSearch(vehicle.vehicleNumber);
    setShowVehicleDropdown(false);

    // Auto-select product based on vehicle fuelType if it matches any fuel product name
    if (vehicle.fuelType) {
      const matchedProd = products.find(p =>
        p.category === 'Fuel' &&
        p.name.toLowerCase().includes(vehicle.fuelType.toLowerCase())
      );
      if (matchedProd) {
        setForm(prev => ({
          ...prev,
          productId: matchedProd.id,
          productName: matchedProd.name,
          productCategory: 'Fuel',
          productUnit: matchedProd.unit
        }));
        loadDynamicRate(matchedProd.id, form.date);
      }
    }
  };

  const handleVehicleSearchChange = (val: string) => {
    setVehicleSearch(val);
    setForm(prev => ({
      ...prev,
      vehicleNumber: val,
      vehicleId: '',
      vehicleType: '',
      fuelType: ''
    }));
  };

  const handleProductChange = (productId: string) => {
    const p = products.find(p => p.id === productId);
    if (!p) return;
    setForm(prev => ({ ...prev, productId, productName: p.name, productCategory: p.category as any, productUnit: p.unit }));
    loadDynamicRate(productId, form.date);
  };

  const autoSelectProductForNozzle = useCallback((nozzleObj: Nozzle) => {
    if (!nozzleObj) return;
    const fuelName = nozzleObj.fuelType || (nozzleObj as any).connectedTank || '';
    if (!fuelName) return;

    const normFuel = fuelName.toLowerCase().trim();
    const matchedProduct = products.find(p => {
      if (p.category !== 'Fuel') return false;
      const normP = p.name.toLowerCase().trim();
      return normP === normFuel || normP.includes(normFuel) || normFuel.includes(normP);
    });

    if (matchedProduct) {
      setForm(prev => ({
        ...prev,
        productCategory: 'Fuel',
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        productUnit: matchedProduct.unit
      }));
      loadDynamicRate(matchedProduct.id, form.date);
    }
  }, [products, form.date, loadDynamicRate]);

  const handleMpdChange = (mpdId: string) => {
    const m = mpds.find(m => m.id === mpdId);
    const firstNozzle = m?.nozzles && m.nozzles.length > 0 ? m.nozzles[0] : null;

    setForm(prev => ({
      ...prev,
      mpdId,
      mpdName: m?.mpdName ?? '',
      nozzleId: firstNozzle ? (firstNozzle.id || '') : '',
      nozzleName: firstNozzle ? firstNozzle.nozzleName : ''
    }));

    if (firstNozzle) {
      autoSelectProductForNozzle(firstNozzle);
    }
  };

  const handleNozzleChange = (nozzleId: string) => {
    const nz = availableNozzles.find(n => n.id === nozzleId || n.nozzleName === nozzleId);
    setForm(prev => ({ ...prev, nozzleId, nozzleName: nz?.nozzleName ?? '' }));
    if (nz) {
      autoSelectProductForNozzle(nz);
    }
  };

  // ── Modal openers ──
  const handleAddNew = async () => {
    setModalMode('add'); setActiveRecordId(null);
    const today = getISTDateString();
    let nextSlip = '';
    try {
      nextSlip = await fetchNextOwnUsageSlipApi(today);
    } catch {
      nextSlip = 'OWN-TEMP';
    }

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
      slipNo: nextSlip,
      date: today,
      usageTime: getISTTimeString(),
      mpdId: defaultMpdId,
      mpdName: defaultMpdName
    });
    setVehicleSearch('');
    setShowModal(true);
  };

  const openRecord = (rec: OwnUsageRecord, mode: 'edit' | 'view') => {
    setModalMode(mode); setActiveRecordId(rec.id);
    const matchedV = vehicles.find(v => v.vehicleNumber === rec.vehicleNumber);
    const matchedM = mpds.find(m => m.mpdName === rec.mpdName);
    const matchedNz = matchedM?.nozzles.find(n => n.nozzleName === rec.nozzleName);
    const matchedP = products.find(p => p.name === rec.productName);
    setForm({
      slipNo: rec.slipNo,
      date: rec.date, usageTime: rec.usageTime,
      vehicleId: matchedV?.id ?? '', vehicleNumber: rec.vehicleNumber,
      vehicleType: rec.vehicleType, fuelType: rec.fuelType,
      productCategory: rec.productCategory as any, productId: matchedP?.id ?? '',
      productName: rec.productName, productUnit: rec.productUnit,
      rate: String(rec.rate), quantity: String(rec.quantity), totalAmount: String(rec.totalAmount),
      mpdId: matchedM?.id ?? '', mpdName: rec.mpdName,
      nozzleId: matchedNz?.id ?? '', nozzleName: rec.nozzleName,
      purpose: rec.purpose as any, remarks: rec.remarks,
      authorizedBy: rec.authorizedBy || '', approvedBy: rec.approvedBy || '',
    });
    setVehicleSearch(rec.vehicleNumber);
    setShowModal(true);
  };

  const handleDeleteClick = (rec: OwnUsageRecord) => { setRecordToDelete(rec); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteOwnUsageApi(recordToDelete.id);
      toast.success('Own usage record deleted successfully.');
      setShowDeleteConfirm(false); setRecordToDelete(null);
      const s = new Set(selectedIds); s.delete(recordToDelete.id); setSelectedIds(s);
      if (records.length === 1 && currentPage > 0) setCurrentPage(p => p - 1);
      else await loadRecords();
    } catch (err: any) { toast.error(err?.message || 'Failed to delete.'); }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.purpose) { toast.warning('Please select a usage purpose.'); return; }

    const qtyNum = parseFloat(form.quantity || '0') || 0;
    const rateNum = parseFloat(form.rate || '0') || 0;
    const totalAmt = parseFloat(form.totalAmount || '0') || (qtyNum * rateNum);

    const payload: Omit<OwnUsageRecord, 'id' | 'slipNo'> = {
      date: form.date, usageTime: form.usageTime,
      vehicleNumber: form.vehicleNumber || '-', vehicleType: form.vehicleType || '', fuelType: form.fuelType || '',
      productCategory: form.productCategory || '', productName: form.productName || '-', productUnit: form.productUnit || 'L',
      quantity: qtyNum, rate: rateNum, totalAmount: totalAmt,
      mpdName: form.mpdName || '-', nozzleName: form.nozzleName || '-',
      purpose: form.purpose, remarks: form.remarks,
      authorizedBy: form.authorizedBy, approvedBy: form.approvedBy,
    };

    setSaving(true);
    try {
      if (modalMode === 'add') { await createOwnUsageApi(payload); toast.success('Own usage record added successfully!'); }
      else if (modalMode === 'edit' && activeRecordId) { await updateOwnUsageApi(activeRecordId, payload); toast.success('Own usage record updated!'); }
      setShowModal(false);
      await loadRecords();
    } catch (err: any) { toast.error(err?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleSelectAll = () => {
    const ids = records.map(r => r.id);
    const allSel = ids.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSel) ids.forEach(id => next.delete(id)); else ids.forEach(id => next.add(id));
    setSelectedIds(next);
  };
  const handleSelectRecord = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
    setCurrentPage(0);
  };
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 text-muted-foreground/30">↕</span>;
    return sortDir === 'asc' ? <span className="ml-1 text-primary">↑</span> : <span className="ml-1 text-primary">↓</span>;
  };

  // ── Export helpers ──
  const downloadCSV = (data: OwnUsageRecord[]) => {
    const headers = ['Slip No', 'Date', 'Time', 'Vehicle No', 'Vehicle Type', 'Fuel Type', 'Category', 'Product', 'Qty', 'Unit', 'Rate', 'Total Amount', 'MPD', 'Nozzle', 'Purpose', 'Remarks', 'Authorized By', 'Approved By'];
    const rows = data.map(r => [r.slipNo, r.date, r.usageTime, r.vehicleNumber, r.vehicleType, r.fuelType, r.productCategory, r.productName, r.quantity, r.productUnit, r.rate, r.totalAmount, r.mpdName, r.nozzleName, r.purpose, r.remarks, r.authorizedBy, r.approvedBy]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `own_usage_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadXLS = (data: OwnUsageRecord[]) => {
    const genDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/></head><body><h2>Own Usage Report</h2><p>Date: ${genDate}</p><table border="1"><tr style="background:#f1f5f9;font-weight:bold;"><th>Slip No</th><th>Date</th><th>Time</th><th>Vehicle</th><th>Product</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total</th><th>Purpose</th><th>Authorized By</th><th>Approved By</th></tr>`;
    data.forEach(r => { html += `<tr><td>${r.slipNo}</td><td>${formatDateToDMY(r.date)}</td><td>${r.usageTime}</td><td>${r.vehicleNumber}</td><td>${r.productName}</td><td>${r.quantity}</td><td>${r.productUnit}</td><td>${r.rate}</td><td>${r.totalAmount}</td><td>${r.purpose}</td><td>${r.authorizedBy || ''}</td><td>${r.approvedBy || ''}</td></tr>`; });
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `own_usage_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadPDF = (data: OwnUsageRecord[]) => {
    const pw = window.open('', '_blank');
    if (!pw) { toast.error('Popup blocked! Allow popups to generate PDFs.'); return; }
    const genDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    const genTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    let rowsHtml = '';
    data.forEach((r, i) => { rowsHtml += `<tr><td style="padding:6px 8px;border:1px solid #cbd5e1">${i + 1}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;font-family:monospace">${r.slipNo}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${formatDateToDMY(r.date)} ${r.usageTime}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;font-weight:500">${r.vehicleNumber}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.productName}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:#ea580c">&#8377;${r.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.purpose}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.authorizedBy || ''}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.approvedBy || ''}</td></tr>`; });
    pw.document.write(`<html><head><title>Own Usage Report</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#1e293b}.header{display:flex;justify-content:space-between;border-bottom:2px solid #f97316;padding-bottom:12px;margin-bottom:24px}.title{font-size:22px;font-weight:700;color:#9a3412;margin:0}.meta{font-size:12px;color:#64748b;text-align:right;line-height:1.5}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#fff7ed;padding:8px;border:1px solid #fed7aa;font-weight:600;text-align:left;color:#7c2d12}.footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center}@media print{button{display:none}}</style></head><body><div class="header"><div><h1 class="title">Own Usage Report</h1><p style="margin:4px 0 0;font-size:12px;color:#475569">Fuel Station Operations</p></div><div class="meta"><p><strong>Date:</strong> ${genDate}</p><p><strong>Time:</strong> ${genTime}</p><p><strong>Total Records:</strong> ${data.length}</p></div></div><table><thead><tr><th>S.No</th><th>Slip No</th><th>Date &amp; Time</th><th>Vehicle</th><th>Product</th><th style="text-align:right">Amount</th><th>Purpose</th><th>Auth By</th><th>Appr By</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="footer">System generated. ${genDate} at ${genTime}.</div><script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script></body></html>`);
    pw.document.close();
  };

  const handleExportAll = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const res = await fetchOwnUsages({ size: 10000, search: searchTerm || undefined, category: categoryFilter !== 'ALL' ? categoryFilter : undefined, purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined, fromDate: fromDateFilter || undefined, toDate: toDateFilter || undefined, sortBy, sortDir });
      if (format === 'csv') downloadCSV(res.content);
      else if (format === 'excel') downloadXLS(res.content);
      else downloadPDF(res.content);
      toast.success(`Exported all matching records to ${format.toUpperCase()}!`);
    } catch { toast.error('Failed to export.'); }
  };

  const handleExportSelected = async (format: 'csv' | 'excel' | 'pdf') => {
    if (selectedIds.size === 0) { toast.warning('Select at least one record to export'); return; }
    try {
      const res = await fetchOwnUsages({ size: 10000, sortBy, sortDir });
      const sel = res.content.filter(r => selectedIds.has(r.id));
      if (sel.length === 0) { toast.warning('Selected records not found'); return; }
      if (format === 'csv') downloadCSV(sel);
      else if (format === 'excel') downloadXLS(sel);
      else downloadPDF(sel);
      toast.success(`Exported ${sel.length} records to ${format.toUpperCase()}!`);
    } catch { toast.error('Failed to export selected records.'); }
  };

  const isView = modalMode === 'view';

  if (embeddedModalOnly) {
    if (!showModal) return null;
    return (
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) onCloseModal?.(); }}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '1100px', width: '92vw', maxHeight: '90vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-cyan-600" />
                  {modalMode === 'add' ? `Daily Operations > Own Usage > Add Own Usage Record (${resolvedMpdName || 'MPD'})` : modalMode === 'edit' ? `Daily Operations > Own Usage > Edit Own Usage Record (${resolvedMpdName || 'MPD'})` : `Daily Operations > Own Usage > View Own Usage Record (${resolvedMpdName || 'MPD'})`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {modalMode === 'add' ? 'Fill in details to record own operational or personal fuel usage' : modalMode === 'edit' ? 'Update own usage record details' : 'View complete own usage record details'}
                </DialogDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-600 border-cyan-500/20">
                {modalMode === 'add' ? 'NEW ENTRY' : modalMode === 'edit' ? 'EDIT MODE' : 'READ ONLY'}
              </Badge>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SECTION 1: DATE, TIME & PURPOSE */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date, Time &amp; Usage Purpose</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ou-date" className="text-xs font-medium">Date</Label>
                  <Input id="ou-date" type="date" disabled={isView} value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} tabIndex={1} className="h-9 text-xs bg-background" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ou-time" className="text-xs font-medium">Time (IST)</Label>
                  <Input id="ou-time" type="time" disabled={isView} value={form.time} onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))} tabIndex={2} className="h-9 text-xs bg-background font-mono" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ou-purpose" className="text-xs font-medium">Usage Purpose <span className="text-red-500 font-bold">*</span></Label>
                  <Select value={form.purpose} onValueChange={v => setForm(prev => ({ ...prev, purpose: v as any }))} disabled={isView}>
                    <SelectTrigger id="ou-purpose" tabIndex={3} className="h-9 text-xs"><SelectValue placeholder="Select Purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Office Use">Office Use</SelectItem>
                      <SelectItem value="Generator">Generator</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SECTION 2: VEHICLE & PRODUCT */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle &amp; Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ou-vehicle" className="text-xs font-medium">Vehicle / Equipment (Optional)</Label>
                  <Input id="ou-vehicle" disabled={isView} value={form.vehicleNo} onChange={e => setForm(prev => ({ ...prev, vehicleNo: e.target.value.toUpperCase() }))} tabIndex={4} className="h-9 text-xs font-mono" placeholder="e.g. MH-01-AB-1234 or Generator" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ou-product" className="text-xs font-medium">Product (Optional)</Label>
                  <Select value={form.productId} onValueChange={handleProductChange} disabled={isView || loadingMaster}>
                    <SelectTrigger id="ou-product" tabIndex={5} className="h-9 text-xs"><SelectValue placeholder="Select Product" /></SelectTrigger>
                    <SelectContent>{filteredProducts.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ou-qty" className="text-xs font-medium">Quantity (L) (Optional)</Label>
                  <Input id="ou-qty" type="number" min="0" step="0.01" disabled={isView} value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} onWheel={e => e.currentTarget.blur()} tabIndex={6} className="h-9 text-xs font-mono bg-background" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Total Amount (₹)</Label>
                  <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted font-bold text-cyan-600 font-mono text-xs cursor-not-allowed">
                    {form.totalAmount ? formatCurrency(parseFloat(form.totalAmount)) : '₹ 0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: AUTHORIZATION */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Authorization &amp; Notes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ou-auth" className="text-xs font-medium">Authorized By</Label>
                  <Input id="ou-auth" disabled={isView} value={form.authorizedBy} onChange={e => setForm(prev => ({ ...prev, authorizedBy: e.target.value }))} tabIndex={7} className="h-9 text-xs" placeholder="Person authorizing this entry" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ou-appr" className="text-xs font-medium">Approved By</Label>
                  <Input id="ou-appr" disabled={isView} value={form.approvedBy} onChange={e => setForm(prev => ({ ...prev, approvedBy: e.target.value }))} tabIndex={8} className="h-9 text-xs" placeholder="Manager or Owner" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="pt-4 border-t border-border gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); onCloseModal?.(); }}>Cancel</Button>
              {!isView && (
                <Button type="submit" disabled={saving} className="min-w-[120px] bg-cyan-600 hover:bg-cyan-700">
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
            <h1 className="mb-2">Own Usage</h1>
            <p className="text-muted-foreground">
              Track pump owner's personal and operational fuel usage across all registered vehicles
            </p>
          </div>
          <Button onClick={handleAddNew} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2" id="btn-add-own-usage">
            <Plus className="w-4 h-4" /> Add Own Usage
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Own Use - {resolvedMpdName}</h3>
          <Button onClick={handleAddNew} className="bg-cyan-600 hover:bg-cyan-700 gap-1.5" id="btn-add-own-usage">
            <Plus className="w-4 h-4" /> Add Own Usage
          </Button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      {!isEmbedded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{formatCurrency(statsRecords.reduce((s, r) => s + r.totalAmount, 0))}</p>
              <p className="text-xs text-muted-foreground">Total Usage Value (Overall)</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{totalElements}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{statsRecords.reduce((s, r) => s + r.quantity, 0).toFixed(2)} L</p>
              <p className="text-xs text-muted-foreground">Total Qty Used (Overall)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter / Search Bar ── */}
      {!isEmbedded && (
        <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search vehicle, slip no, product, purpose..." className="pl-9" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">From</label>
              <input type="date" value={fromDateFilter} onChange={e => { setFromDateFilter(e.target.value); setCurrentPage(0); }} className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">To</label>
              <input type="date" value={toDateFilter} onChange={e => { setToDateFilter(e.target.value); setCurrentPage(0); }} className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="w-36">
              <Select value={purposeFilter} onValueChange={v => { setPurposeFilter(v); setCurrentPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Purpose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Purposes</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Office Use">Office Use</SelectItem>
                  <SelectItem value="Generator">Generator</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">Export All Matching</div>
                <DropdownMenuItem onClick={() => handleExportAll('csv')} className="cursor-pointer text-xs"><FileDown className="w-4 h-4 mr-2 text-muted-foreground" /> Export All to CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll('excel')} className="cursor-pointer text-xs"><FileDown className="w-4 h-4 mr-2 text-muted-foreground" /> Export All to Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll('pdf')} className="cursor-pointer text-xs"><FileDown className="w-4 h-4 mr-2 text-muted-foreground" /> Export All to PDF</DropdownMenuItem>
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider border-t border-border mt-1">Export Selected ({selectedIds.size})</div>
                <DropdownMenuItem onClick={() => handleExportSelected('csv')} className="cursor-pointer text-xs" disabled={selectedIds.size === 0}><CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" /> Export Selected to CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportSelected('excel')} className="cursor-pointer text-xs" disabled={selectedIds.size === 0}><CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" /> Export Selected to Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportSelected('pdf')} className="cursor-pointer text-xs" disabled={selectedIds.size === 0}><CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" /> Export Selected to PDF</DropdownMenuItem>
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
              <p className="text-sm font-medium">Loading own usage records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Car className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No own usage records found</p>
              <p className="text-xs">
                {(searchTerm || purposeFilter !== 'ALL' || fromDateFilter || toDateFilter)
                  ? 'Try relaxing your search or filter inputs.'
                  : 'Click "Add Own Usage" to create the first record.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="w-12 text-center p-4">
                    <input type="checkbox" checked={selectedIds.size === records.length && records.length > 0} onChange={handleSelectAll} className="w-4 h-4 cursor-pointer align-middle rounded border-border" />
                  </th>
                  <th className="w-16 text-left p-4 font-medium text-muted-foreground">S.No</th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('slipNo')}>
                    <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-muted-foreground" /> Slip No<SortIcon field="slipNo" /></div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('date')}>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date &amp; Time<SortIcon field="date" /></div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('quantity')}>
                    <div className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-muted-foreground" /> Quantity (L)<SortIcon field="quantity" /></div>
                  </th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('productName')}>
                    <div className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-muted-foreground" /> Product<SortIcon field="productName" /></div>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-muted-foreground" /> Purpose</div>
                  </th>
                  <th className="text-left p-4 font-medium">Authorized / Approved By</th>
                  <th className="text-right p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none" onClick={() => handleSortToggle('totalAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">Amount <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" /><SortIcon field="totalAmount" /></div>
                  </th>
                  <th className="text-center p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="w-12 text-center p-4">
                      <input type="checkbox" checked={selectedIds.has(rec.id)} onChange={() => handleSelectRecord(rec.id)} className="w-4 h-4 cursor-pointer align-middle rounded border-border" />
                    </td>
                    <td className="w-16 p-4 font-medium text-muted-foreground">{currentPage * pageSize + index + 1}</td>
                    <td className="p-4 font-mono text-sm text-foreground">{rec.slipNo}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-mono text-sm">{formatDateToDMY(rec.date)}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {rec.usageTime}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm font-semibold text-cyan-600">
                      {rec.quantity ? `${rec.quantity.toFixed(2)} ${rec.productUnit || 'L'}` : '-'}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{rec.productName}</p>
                        <p className="text-xs text-muted-foreground">{rec.productCategory} · {rec.quantity} {rec.productUnit}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PURPOSE_BADGE[rec.purpose] || 'bg-muted text-muted-foreground'}`}>{rec.purpose}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{rec.authorizedBy || '-'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Approved: {rec.approvedBy || '-'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-foreground font-mono text-base">{formatCurrency(rec.totalAmount)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openRecord(rec, 'view')} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="View"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => openRecord(rec, 'edit')} className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4 text-blue-500" /></button>
                        <button onClick={() => handleDeleteClick(rec)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t border-border text-xs font-medium">
                <tr>
                  <td colSpan={8} className="p-4 text-left font-semibold">Page Total ({records.length} records)</td>
                  <td className="p-4 text-right font-mono font-bold text-foreground text-base">{formatCurrency(records.reduce((s, r) => s + r.totalAmount, 0))}</td>
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
            <span className="text-sm text-muted-foreground">Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" /> Previous</Button>
              <span className="text-sm font-medium px-2">Page {currentPage + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          ADD / EDIT / VIEW MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) onCloseModal?.(); }}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '1100px', width: '92vw', maxHeight: '90vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Car className="w-5 h-5 text-primary" />
                {modalMode === 'add' ? 'Add Own Usage Record' : modalMode === 'edit' ? 'Edit Own Usage Record' : 'Own Usage Record Details'}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* ─────────────────────────────────
                  SECTION 1: TRANSACTION HEADER & VEHICLE DETAILS
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Transaction &amp; Vehicle Information
                </h3>

                {/* Row 1: Slip No, Date, Time (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Slip No */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-slipNo" className="text-xs font-medium">
                      Slip No <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="ou-slipNo"
                      value={form.slipNo}
                      onChange={e => setForm(prev => ({ ...prev, slipNo: e.target.value }))}
                      disabled={isView}
                      tabIndex={1}
                      className={`h-9 text-xs font-mono ${isView ? 'bg-muted' : 'bg-background'}`}
                      required={!isView}
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-date" className="text-xs font-medium">Date (IST)</Label>
                    <Input
                      id="ou-date"
                      type="date"
                      value={form.date}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs bg-muted/60 font-mono"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-time" className="text-xs font-medium">Time (IST)</Label>
                    <Input
                      id="ou-time"
                      type="time"
                      value={form.usageTime}
                      disabled
                      tabIndex={-1}
                      className="h-9 text-xs bg-muted/60 font-mono"
                    />
                  </div>
                </div>

                {/* Row 2: Vehicle, Purpose, Authorized By, Approved By (4 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-0.5">
                  {/* Vehicle Autocomplete Typeahead */}
                  <div ref={vehicleRef} className="space-y-1 relative">
                    <Label htmlFor="ou-vehicle" className="text-xs font-medium">
                      Vehicle / Equipment No. <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {isView ? (
                      <Input
                        id="ou-vehicle"
                        value={formatVehicleNumber(form.vehicleNumber)}
                        disabled
                        tabIndex={-1}
                        className="h-9 text-xs bg-muted font-mono"
                      />
                    ) : (
                      <div className="relative">
                        <Input
                          id="ou-vehicle"
                          placeholder="Search vehicle..."
                          value={vehicleSearch}
                          onChange={e => handleVehicleSearchChange(formatVehicleNumber(e.target.value))}
                          onFocus={() => setShowVehicleDropdown(true)}
                          disabled={loadingMaster}
                          tabIndex={2}
                          className="h-9 text-xs font-mono"
                          autoComplete="off"
                        />
                        {loadingMaster && (
                          <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                        )}
                        {showVehicleDropdown && vehicleSuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto bg-white dark:bg-slate-900">
                            {vehicleSuggestions.map((v, i) => (
                              <div
                                key={v.id || i}
                                className="px-3 py-2 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col"
                                onClick={() => handleVehicleSelect(v)}
                              >
                                <span className="font-semibold text-foreground">{v.vehicleNumber}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">{v.vehicleType} · {v.fuelType}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {isVehicleWarning && (
                      <p className="text-[10px] text-amber-600 font-medium absolute mt-0.5 bg-background px-1 z-10">
                        Vehicle not registered.
                      </p>
                    )}
                  </div>

                  {/* Purpose */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-purpose" className="text-xs font-medium">
                      Usage Purpose <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {isView ? (
                      <Input
                        id="ou-purpose"
                        value={form.purpose}
                        disabled
                        tabIndex={-1}
                        className="h-9 text-xs bg-muted"
                      />
                    ) : (
                      <Select value={form.purpose} onValueChange={v => setForm(prev => ({ ...prev, purpose: v as any }))}>
                        <SelectTrigger id="ou-purpose" tabIndex={3} className="h-9 text-xs">
                          <SelectValue placeholder="Select Purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personal">Personal</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Office Use">Office Use</SelectItem>
                          <SelectItem value="Generator">Generator</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Authorized By */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-authBy" className="text-xs font-medium">Authorized By</Label>
                    {isView ? (
                      <Input
                        id="ou-authBy"
                        value={form.authorizedBy || '-'}
                        disabled
                        tabIndex={-1}
                        className="h-9 text-xs bg-muted"
                      />
                    ) : (
                      <Select value={form.authorizedBy} onValueChange={v => setForm(prev => ({ ...prev, authorizedBy: v }))} disabled={loadingMaster}>
                        <SelectTrigger id="ou-authBy" tabIndex={4} className="h-9 text-xs">
                          <SelectValue placeholder={loadingMaster ? 'Loading…' : '-- Select Employee --'} />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Approved By */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-appBy" className="text-xs font-medium">Approved By</Label>
                    {isView ? (
                      <Input
                        id="ou-appBy"
                        value={form.approvedBy || '-'}
                        disabled
                        tabIndex={-1}
                        className="h-9 text-xs bg-muted"
                      />
                    ) : (
                      <Select value={form.approvedBy} onValueChange={v => setForm(prev => ({ ...prev, approvedBy: v }))} disabled={loadingMaster}>
                        <SelectTrigger id="ou-appBy" tabIndex={5} className="h-9 text-xs">
                          <SelectValue placeholder={loadingMaster ? 'Loading…' : '-- Select Employee --'} />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 2: DISPENSER ASSIGNMENT & REMARKS
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Dispenser details */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Dispenser Assignment
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* MPD */}
                      <div className="space-y-1">
                        <Label htmlFor="ou-mpd" className="text-xs font-medium">
                          MPD Dispenser
                        </Label>
                        {isView ? (
                          <Input
                            id="ou-mpd"
                            value={form.mpdName}
                            disabled
                            tabIndex={-1}
                            className="h-9 text-xs bg-muted"
                          />
                        ) : (
                          <Select value={form.mpdId} onValueChange={handleMpdChange} disabled={loadingMaster || (isEmbedded && !!resolvedMpdName)}>
                            <SelectTrigger id="ou-mpd" tabIndex={6} className="h-9 text-xs">
                              <SelectValue placeholder="Select MPD" />
                            </SelectTrigger>
                            <SelectContent>
                              {mpds.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.mpdName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Nozzle */}
                      <div className="space-y-1">
                        <Label htmlFor="ou-nozzle" className="text-xs font-medium">
                          Nozzle
                        </Label>
                        {isView ? (
                          <Input
                            id="ou-nozzle"
                            value={form.nozzleName}
                            disabled
                            tabIndex={-1}
                            className="h-9 text-xs bg-muted"
                          />
                        ) : (
                          <Select value={form.nozzleId} onValueChange={handleNozzleChange} disabled={!form.mpdId || availableNozzles.length === 0}>
                            <SelectTrigger id="ou-nozzle" tabIndex={7} className="h-9 text-xs">
                              <SelectValue placeholder={!form.mpdId ? 'Select MPD first' : 'Select Nozzle'} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNozzles.map(n => (
                                <SelectItem key={n.id} value={n.id!}>{n.nozzleName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Remarks */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Additional Notes
                    </h3>
                    <div className="space-y-1">
                      <Label htmlFor="ou-remarks" className="text-xs font-medium">Remarks / Notes</Label>
                      <Input
                        id="ou-remarks"
                        placeholder="Optional remarks..."
                        value={form.remarks}
                        onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                        disabled={isView}
                        tabIndex={8}
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────
                  SECTION 3: PRODUCT & PRICING DETAILS
              ───────────────────────────────── */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Product &amp; Pricing Details
                </h3>

                {/* Row 3: Category, Product, Rate, Qty, Total Amount (5 Columns) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Product Category */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-cat" className="text-xs font-medium">Category</Label>
                    {isView ? (
                      <Input
                        id="ou-cat"
                        value={form.productCategory}
                        disabled
                        tabIndex={-1}
                        className="h-9 text-xs bg-muted"
                      />
                    ) : (
                      <Select value={form.productCategory} onValueChange={v => setForm(prev => ({ ...prev, productCategory: v as any, productId: '', productName: '', productUnit: '' }))}>
                        <SelectTrigger id="ou-cat" tabIndex={9} className="h-9 text-xs">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fuel">Fuel</SelectItem>
                          <SelectItem value="Oil & Lubes">Oil &amp; Lubes</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Product */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-product" className="text-xs font-medium">
                      Product
                    </Label>
                    {isView ? (
                      <Input
                        id="ou-product"
                        value={form.productName}
                        disabled
                        tabIndex={-1}
                        className="h-9 text-xs bg-muted"
                      />
                    ) : (
                      <Select value={form.productId} onValueChange={handleProductChange} disabled={loadingMaster}>
                        <SelectTrigger id="ou-product" tabIndex={10} className="h-9 text-xs">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProducts.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-rate" className="text-xs font-medium">
                      Rate (₹/{form.productUnit || 'unit'})
                    </Label>
                    <Input
                      id="ou-rate"
                      type="number"
                      disabled
                      value={form.rate}
                      tabIndex={-1}
                      className="h-9 text-xs bg-muted/60 font-mono"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Label htmlFor="ou-qty" className="text-xs font-medium">
                      Quantity (L)
                    </Label>
                    <Input
                      id="ou-qty"
                      type="number"
                      min="0.01"
                      step="0.01"
                      disabled={isView}
                      value={form.quantity}
                      onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                      onWheel={e => e.currentTarget.blur()}
                      tabIndex={11}
                      className="h-9 text-xs font-mono bg-background"
                    />
                  </div>

                  {/* Total Amount */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Total Amount (₹)</Label>
                    <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted font-bold text-orange-600 font-mono text-xs cursor-not-allowed">
                      {form.totalAmount ? formatCurrency(parseFloat(form.totalAmount)) : '₹ 0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                  {isView && activeRecordId
                    ? <span className="font-mono">Record ID: {activeRecordId}</span>
                    : <span>Fields marked <span className="text-red-500 font-bold">*</span> are required</span>}
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>{isView ? 'Close' : 'Cancel'}</Button>
                  {!isView && (
                    <Button type="submit" size="sm" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {modalMode === 'add' ? 'Add Record' : 'Save Changes'}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Own Usage Record
            </DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure you want to delete this record?</DialogDescription>
          </DialogHeader>
          {recordToDelete && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm border border-border space-y-1">
              <p><span className="font-medium">Slip No:</span> <span className="font-mono">{recordToDelete.slipNo}</span></p>
              <p><span className="font-medium">Vehicle:</span> {recordToDelete.vehicleNumber}</p>
              <p><span className="font-medium">Product:</span> {recordToDelete.productName} ({recordToDelete.quantity} {recordToDelete.productUnit})</p>
              <p><span className="font-medium">Amount:</span> {formatCurrency(recordToDelete.totalAmount)}</p>
              <p><span className="font-medium">Date:</span> {formatDateToDMY(recordToDelete.date)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
