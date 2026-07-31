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
  Gauge
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
} from '../services/api';


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
  'Personal':    'bg-purple-50/80 text-purple-700 border-purple-200',
  'Maintenance': 'bg-orange-50/80 text-orange-700 border-orange-200',
  'Office Use':  'bg-sky-50/80 text-sky-700 border-sky-200',
  'Generator':   'bg-amber-50/80 text-amber-700 border-amber-200',
  'Other':       'bg-slate-50/80 text-slate-600 border-slate-200',
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
  status: 'Pending' as 'Pending' | 'Completed',
  authorizedBy: '',
  approvedBy: '',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export function OwnUsage() {
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
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const filteredProducts = form.productCategory
    ? products.filter(p => p.category === form.productCategory)
    : products;

  // ── Load records ──
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchOwnUsages({
        page: currentPage,
        size: pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy, sortDir
      });
      setRecords(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);

      // Fetch stats globally (without pagination limits)
      const statsRes = await fetchOwnUsages({
        page: 0,
        size: 100000,
        search: searchTerm || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });
      setStatsRecords(statsRes.content);
    } catch {
      toast.error('Failed to load own usage records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter, purposeFilter, fromDateFilter, toDateFilter, sortBy, sortDir]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

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
  };

  const handleMpdChange = (mpdId: string) => {
    const m = mpds.find(m => m.id === mpdId);
    setForm(prev => ({ ...prev, mpdId, mpdName: m?.mpdName ?? '', nozzleId: '', nozzleName: '' }));
  };

  const handleNozzleChange = (nozzleId: string) => {
    const nz = availableNozzles.find(n => n.id === nozzleId);
    setForm(prev => ({ ...prev, nozzleId, nozzleName: nz?.nozzleName ?? '' }));
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
    setForm({
      ...INIT_FORM,
      slipNo: nextSlip,
      date: today,
      usageTime: getISTTimeString()
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
      purpose: rec.purpose as any, remarks: rec.remarks, status: rec.status,
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
    if (!form.vehicleNumber) { toast.warning('Please select or enter a vehicle.'); return; }
    if (!form.productName) { toast.warning('Please select a product.'); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast.warning('Please enter a valid quantity.'); return; }
    if (!form.rate || parseFloat(form.rate) <= 0) { toast.warning('Please enter a valid rate.'); return; }
    if (!form.purpose) { toast.warning('Please select a usage purpose.'); return; }
    if (!form.mpdName) { toast.warning('Please select an MPD.'); return; }
    if (!form.nozzleName) { toast.warning('Please select a nozzle.'); return; }

    const payload: Omit<OwnUsageRecord, 'id' | 'slipNo'> = {
      date: form.date, usageTime: form.usageTime,
      vehicleNumber: form.vehicleNumber, vehicleType: form.vehicleType, fuelType: form.fuelType,
      productCategory: form.productCategory || '', productName: form.productName, productUnit: form.productUnit,
      quantity: parseFloat(form.quantity), rate: parseFloat(form.rate), totalAmount: parseFloat(form.totalAmount),
      mpdName: form.mpdName, nozzleName: form.nozzleName,
      purpose: form.purpose, remarks: form.remarks, status: form.status,
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

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') return <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
    return <Badge variant="outline" className="bg-amber-50/80 text-amber-700 border-amber-200 text-xs">Pending</Badge>;
  };

  // ── Export helpers ──
  const downloadCSV = (data: OwnUsageRecord[]) => {
    const headers = ['Slip No', 'Date', 'Time', 'Vehicle No', 'Vehicle Type', 'Fuel Type', 'Category', 'Product', 'Qty', 'Unit', 'Rate', 'Total Amount', 'MPD', 'Nozzle', 'Purpose', 'Remarks', 'Status', 'Authorized By', 'Approved By'];
    const rows = data.map(r => [r.slipNo, r.date, r.usageTime, r.vehicleNumber, r.vehicleType, r.fuelType, r.productCategory, r.productName, r.quantity, r.productUnit, r.rate, r.totalAmount, r.mpdName, r.nozzleName, r.purpose, r.remarks, r.status, r.authorizedBy, r.approvedBy]);
    const csv = [headers.join(','), ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `own_usage_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const downloadXLS = (data: OwnUsageRecord[]) => {
    const genDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/></head><body><h2>Own Usage Report</h2><p>Date: ${genDate}</p><table border="1"><tr style="background:#f1f5f9;font-weight:bold;"><th>Slip No</th><th>Date</th><th>Time</th><th>Vehicle</th><th>Product</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total</th><th>Purpose</th><th>Authorized By</th><th>Approved By</th><th>Status</th></tr>`;
    data.forEach(r => { html += `<tr><td>${r.slipNo}</td><td>${formatDateToDMY(r.date)}</td><td>${r.usageTime}</td><td>${r.vehicleNumber}</td><td>${r.productName}</td><td>${r.quantity}</td><td>${r.productUnit}</td><td>${r.rate}</td><td>${r.totalAmount}</td><td>${r.purpose}</td><td>${r.authorizedBy || ''}</td><td>${r.approvedBy || ''}</td><td>${r.status}</td></tr>`; });
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
    data.forEach((r, i) => { rowsHtml += `<tr><td style="padding:6px 8px;border:1px solid #cbd5e1">${i+1}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;font-family:monospace">${r.slipNo}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${formatDateToDMY(r.date)} ${r.usageTime}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;font-weight:500">${r.vehicleNumber}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.productName}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:#ea580c">&#8377;${r.totalAmount.toLocaleString('en-IN',{minimumFractionDigits:2})}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.purpose}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.authorizedBy || ''}</td><td style="padding:6px 8px;border:1px solid #cbd5e1">${r.approvedBy || ''}</td><td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center">${r.status}</td></tr>`; });
    pw.document.write(`<html><head><title>Own Usage Report</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#1e293b}.header{display:flex;justify-content:space-between;border-bottom:2px solid #f97316;padding-bottom:12px;margin-bottom:24px}.title{font-size:22px;font-weight:700;color:#9a3412;margin:0}.meta{font-size:12px;color:#64748b;text-align:right;line-height:1.5}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#fff7ed;padding:8px;border:1px solid #fed7aa;font-weight:600;text-align:left;color:#7c2d12}.footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:11px;color:#94a3b8;text-align:center}@media print{button{display:none}}</style></head><body><div class="header"><div><h1 class="title">Own Usage Report</h1><p style="margin:4px 0 0;font-size:12px;color:#475569">Fuel Station Operations</p></div><div class="meta"><p><strong>Date:</strong> ${genDate}</p><p><strong>Time:</strong> ${genTime}</p><p><strong>Total Records:</strong> ${data.length}</p></div></div><table><thead><tr><th>S.No</th><th>Slip No</th><th>Date &amp; Time</th><th>Vehicle</th><th>Product</th><th style="text-align:right">Amount</th><th>Purpose</th><th>Auth By</th><th>Appr By</th><th style="text-align:center">Status</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="footer">System generated. ${genDate} at ${genTime}.</div><script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script></body></html>`);
    pw.document.close();
  };

  const handleExportAll = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const res = await fetchOwnUsages({ size: 10000, search: searchTerm || undefined, category: categoryFilter !== 'ALL' ? categoryFilter : undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined, purpose: purposeFilter !== 'ALL' ? purposeFilter : undefined, fromDate: fromDateFilter || undefined, toDate: toDateFilter || undefined, sortBy, sortDir });
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Own Usage</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track pump owner's personal and operational fuel usage across all registered vehicles
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2" size="sm" id="btn-add-own-usage">
          <Plus className="w-4 h-4" /> Add Own Usage
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-100">
            <IndianRupee className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{formatCurrency(statsRecords.reduce((s, r) => s + r.totalAmount, 0))}</p>
            <p className="text-xs text-muted-foreground">Total Usage Value (Overall)</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100">
            <CalendarDays className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{totalElements}</p>
            <p className="text-xs text-muted-foreground">Total Records</p>
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
            <Gauge className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{statsRecords.reduce((s, r) => s + r.quantity, 0).toFixed(2)} L</p>
            <p className="text-xs text-muted-foreground">Total Qty Used (Overall)</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search vehicle, slip no, product, purpose…" className="pl-10 h-9 text-xs" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">From</label>
          <input type="date" value={fromDateFilter} onChange={e => { setFromDateFilter(e.target.value); setCurrentPage(0); }} className="w-32 h-9 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">To</label>
          <input type="date" value={toDateFilter} onChange={e => { setToDateFilter(e.target.value); setCurrentPage(0); }} className="w-32 h-9 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Purpose</label>
          <Select value={purposeFilter} onValueChange={v => { setPurposeFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="h-9 w-36 text-xs"><SelectValue /></SelectTrigger>
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
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Status</label>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs"><Download className="w-4 h-4" /> Export</Button>
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

      {/* ── Main Table ── */}
      <Card className="overflow-hidden border-border rounded-xl bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading own usage records…</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Car className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No own usage records found</p>
              <p className="text-xs">
                {(searchTerm || statusFilter !== 'ALL' || purposeFilter !== 'ALL' || fromDateFilter || toDateFilter)
                  ? 'Try relaxing your search or filter inputs.'
                  : 'Click "Add Own Usage" to create the first record.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="w-12 text-center p-3">
                      <input type="checkbox" checked={selectedIds.size === records.length && records.length > 0} onChange={handleSelectAll} className="w-4 h-4 cursor-pointer" />
                    </th>
                    <th className="w-14 text-left px-4 py-3 font-medium text-muted-foreground">S.No</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('slipNo')}>
                      <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 opacity-60" /> Slip No<SortIcon field="slipNo" /></div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('date')}>
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-60" /> Date & Time<SortIcon field="date" /></div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('vehicleNumber')}>
                      <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 opacity-60" /> Vehicle<SortIcon field="vehicleNumber" /></div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('productName')}>
                      <div className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 opacity-60" /> Product<SortIcon field="productName" /></div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 opacity-60" /> Purpose</div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Authorized / Approved By</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSortToggle('totalAmount')}>
                      <div className="flex items-center gap-1.5 justify-end">Amount <IndianRupee className="w-3.5 h-3.5 opacity-60" /><SortIcon field="totalAmount" /></div>
                    </th>
                    <th className="w-28 text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="w-32 text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {records.map((rec, index) => (
                    <tr key={rec.id} className="hover:bg-muted/10 transition-colors">
                      <td className="w-12 text-center p-3">
                        <input type="checkbox" checked={selectedIds.has(rec.id)} onChange={() => handleSelectRecord(rec.id)} className="w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="w-14 px-4 py-3 font-semibold text-muted-foreground">{currentPage * pageSize + index + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{rec.slipNo}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p className="font-mono">{formatDateToDMY(rec.date)}</p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {rec.usageTime}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <Badge variant="secondary" className="font-mono text-xs">{formatVehicleNumber(rec.vehicleNumber)}</Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{rec.vehicleType} · {rec.fuelType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{rec.productName}</p>
                          <p className="text-[11px] text-muted-foreground">{rec.productCategory} · {rec.quantity} {rec.productUnit}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${PURPOSE_BADGE[rec.purpose] || 'text-muted-foreground'}`}>{rec.purpose}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p className="font-semibold text-foreground">{rec.authorizedBy || '-'}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Approved: {rec.approvedBy || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600 font-mono">{formatCurrency(rec.totalAmount)}</td>
                      <td className="w-28 px-4 py-3">{getStatusBadge(rec.status)}</td>
                      <td className="w-32 px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" title="View" onClick={() => openRecord(rec, 'view')}><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" title="Edit" onClick={() => openRecord(rec, 'edit')} disabled={rec.status === 'Completed'}><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteClick(rec)} disabled={rec.status === 'Completed'}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 border-t border-border text-xs font-semibold">
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-left">Page Total ({records.length} records)</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-orange-700">{formatCurrency(records.reduce((s, r) => s + r.totalAmount, 0))}</td>
                    <td colSpan={2} className="px-4 py-3 text-muted-foreground"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-xs font-mono px-2">Page {currentPage + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════
          ADD / EDIT / VIEW MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="flex flex-col overflow-hidden p-0" style={{ maxWidth: '90vw', width: '900px', height: '88vh', maxHeight: '88vh' }}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Car className="w-5 h-5 text-orange-500" />
                {modalMode === 'add' ? 'Add Own Usage Record' : modalMode === 'edit' ? 'Edit Own Usage Record' : 'Own Usage Record Details'}
              </DialogTitle>
              {modalMode !== 'view' && (
                <div className="text-[10px] text-muted-foreground/80 flex items-center gap-4 bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 font-medium mr-6">
                  <div><span className="text-amber-600 font-semibold">Pending:</span> Usage logged but not reconciled</div>
                  <div className="w-px h-3 bg-border/60" />
                  <div><span className="text-blue-600 font-semibold">Completed:</span> Approved and recorded in accounts</div>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {isView ? 'Review own usage record details.' : 'Fill in the details below to record an owner fuel usage transaction.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── LEFT: Vehicle & Context ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">Vehicle & Transaction Info</h3>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ou-date" className="text-xs font-medium">Date <span className="text-red-500 font-bold">*</span></Label>
                      <input id="ou-date" type="date" disabled={isView} value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ou-time" className="text-xs font-medium">Time <span className="text-red-500 font-bold">*</span></Label>
                      <input id="ou-time" type="time" disabled={isView} value={form.usageTime} onChange={e => setForm(prev => ({ ...prev, usageTime: e.target.value }))} className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60" required />
                    </div>
                  </div>

                  {/* Vehicle Autocomplete Typeahead */}
                  <div ref={vehicleRef} className="space-y-1.5 relative">
                    <Label htmlFor="ou-vehicle" className="text-xs font-medium">
                      Owner Vehicle / Equipment No. <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {isView ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm font-mono">{formatVehicleNumber(form.vehicleNumber)}</div>
                    ) : (
                      <div className="relative">
                        <Input
                          id="ou-vehicle"
                          placeholder="Search vehicle number (e.g. MH-01-1234)..."
                          value={vehicleSearch}
                          onChange={e => handleVehicleSearchChange(formatVehicleNumber(e.target.value))}
                          onFocus={() => setShowVehicleDropdown(true)}
                          disabled={loadingMaster}
                          className="h-9 text-xs pr-8 font-mono"
                          required
                          autoComplete="off"
                        />
                        {loadingMaster && (
                          <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-2.5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {showVehicleDropdown && vehicleSuggestions.length > 0 && !isView && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-slate-900">
                        {vehicleSuggestions.map((v, i) => (
                          <div
                            key={v.id || i}
                            className="px-3.5 py-2.5 hover:bg-muted cursor-pointer text-xs border-b border-border/40 transition-colors flex flex-col"
                            onClick={() => handleVehicleSelect(v)}
                          >
                            <span className="font-semibold text-foreground">{v.vehicleNumber}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">{v.vehicleType} · {v.fuelType}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isVehicleWarning && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline mr-1 align-text-bottom" /> Vehicle not found in active Vehicle Master. Confirm if correct.
                      </p>
                    )}
                    {form.vehicleType && (
                      <p className="text-[10px] text-muted-foreground">Type: <span className="font-medium">{form.vehicleType}</span> · Fuel: <span className="font-medium">{form.fuelType}</span></p>
                    )}
                  </div>

                  {/* Purpose */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-purpose" className="text-xs font-medium">Usage Purpose <span className="text-red-500 font-bold">*</span></Label>
                    {isView ? (
                      <div className="mt-1"><Badge variant="outline" className={`text-xs ${PURPOSE_BADGE[form.purpose] || ''}`}>{form.purpose}</Badge></div>
                    ) : (
                      <Select value={form.purpose} onValueChange={v => setForm(prev => ({ ...prev, purpose: v as any }))}>
                        <SelectTrigger id="ou-purpose" className="h-9 text-xs"><SelectValue placeholder="-- Select Purpose --" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Personal">Personal</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Office Use">Office Use</SelectItem>
                          <SelectItem value="Generator">Generator</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-[10px] text-muted-foreground/80 leading-relaxed">Categorize the reason — helps in cost center and expense tracking.</p>
                  </div>

                  {/* Authorized By & Approved By */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ou-authBy" className="text-xs font-medium flex items-center gap-1">Authorized By</Label>
                      {isView ? (
                        <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">{form.authorizedBy || '-'}</div>
                      ) : (
                        <Select value={form.authorizedBy} onValueChange={v => setForm(prev => ({ ...prev, authorizedBy: v }))} disabled={loadingMaster}>
                          <SelectTrigger id="ou-authBy" className="h-9 text-xs">
                            <SelectValue placeholder={loadingMaster ? 'Loading…' : employees.length === 0 ? 'No employees' : '-- Select Employee --'} />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">No active employees found.</div>
                            ) : (
                              employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.name}>{emp.name} ({emp.designation || 'Staff'})</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ou-appBy" className="text-xs font-medium flex items-center gap-1">Approved By</Label>
                      {isView ? (
                        <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">{form.approvedBy || '-'}</div>
                      ) : (
                        <Select value={form.approvedBy} onValueChange={v => setForm(prev => ({ ...prev, approvedBy: v }))} disabled={loadingMaster}>
                          <SelectTrigger id="ou-appBy" className="h-9 text-xs">
                            <SelectValue placeholder={loadingMaster ? 'Loading…' : employees.length === 0 ? 'No employees' : '-- Select Employee --'} />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">No active employees found.</div>
                            ) : (
                              employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.name}>{emp.name} ({emp.designation || 'Staff'})</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-remarks" className="text-xs font-medium">Remarks / Notes</Label>
                    <textarea id="ou-remarks" disabled={isView} value={form.remarks} onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))} rows={3} placeholder="Optional notes about this usage…" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 resize-none" />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-status" className="text-xs font-medium">Status <span className="text-red-500 font-bold">*</span></Label>
                    {isView ? (
                      <div>{getStatusBadge(form.status)}</div>
                    ) : (
                      <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v as any }))}>
                        <SelectTrigger id="ou-status" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* ── RIGHT: Product & Dispenser ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">Product & Dispenser Details</h3>

                  {/* Product Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-cat" className="text-xs font-medium">Product Category</Label>
                    {isView ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">{form.productCategory}</div>
                    ) : (
                      <Select value={form.productCategory} onValueChange={v => setForm(prev => ({ ...prev, productCategory: v as any, productId: '', productName: '', productUnit: '' }))}>
                        <SelectTrigger id="ou-cat" className="h-9 text-xs"><SelectValue placeholder="-- Select Category --" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fuel">Fuel</SelectItem>
                          <SelectItem value="Oil & Lubes">Oil & Lubes</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Product */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-product" className="text-xs font-medium">Product <span className="text-red-500 font-bold">*</span></Label>
                    {isView ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">{form.productName}</div>
                    ) : (
                      <Select value={form.productId} onValueChange={handleProductChange} disabled={loadingMaster}>
                        <SelectTrigger id="ou-product" className="h-9 text-xs"><SelectValue placeholder="-- Select Product --" /></SelectTrigger>
                        <SelectContent>
                          {filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Quantity & Rate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ou-qty" className="text-xs font-medium">Quantity ({form.productUnit || 'unit'}) <span className="text-red-500 font-bold">*</span></Label>
                      <Input id="ou-qty" type="number" min="0.01" step="0.01" disabled={isView} value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} onWheel={e => e.currentTarget.blur()} placeholder="0.00" className="h-9 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ou-rate" className="text-xs font-medium">Rate (₹/{form.productUnit || 'unit'}) <span className="text-red-500 font-bold">*</span></Label>
                      <Input id="ou-rate" type="number" min="0.01" step="0.01" disabled={isView} value={form.rate} onChange={e => setForm(prev => ({ ...prev, rate: e.target.value }))} onWheel={e => e.currentTarget.blur()} placeholder="0.00" className="h-9 text-sm" required />
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Total Amount (₹)</Label>
                    <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 font-bold text-orange-600 font-mono text-sm">
                      {form.totalAmount ? formatCurrency(parseFloat(form.totalAmount)) : '₹ —'}
                    </div>
                  </div>

                  {/* MPD */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-mpd" className="text-xs font-medium">MPD Dispenser <span className="text-red-500 font-bold">*</span></Label>
                    {isView ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">{form.mpdName}</div>
                    ) : (
                      <Select value={form.mpdId} onValueChange={handleMpdChange} disabled={loadingMaster}>
                        <SelectTrigger id="ou-mpd" className="h-9 text-xs"><SelectValue placeholder="-- Select MPD --" /></SelectTrigger>
                        <SelectContent>
                          {mpds.map(m => <SelectItem key={m.id} value={m.id}>{m.mpdName} ({m.numberOfNozzles} nozzles)</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Nozzle */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ou-nozzle" className="text-xs font-medium">Nozzle <span className="text-red-500 font-bold">*</span></Label>
                    {isView ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">{form.nozzleName}</div>
                    ) : (
                      <Select value={form.nozzleId} onValueChange={handleNozzleChange} disabled={!form.mpdId || availableNozzles.length === 0}>
                        <SelectTrigger id="ou-nozzle" className="h-9 text-xs"><SelectValue placeholder={!form.mpdId ? 'Select MPD first' : '-- Select Nozzle --'} /></SelectTrigger>
                        <SelectContent>
                          {availableNozzles.map(n => <SelectItem key={n.id} value={n.id!}>{n.nozzleName} ({n.fuelType})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
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
                    <Button type="submit" size="sm" disabled={saving} className="gap-2">
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
