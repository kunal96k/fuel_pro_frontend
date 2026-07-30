import React, { useState, useEffect, useCallback } from 'react';
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
  Filter,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  Package,
  Download,
  FileDown,
  CheckSquare,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
  fetchVehicles,
  fetchProducts,
  fetchMpdsAll,
  Vehicle,
  Product,
  MPD,
  Nozzle,
  formatDateToDMY
} from '../services/api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface CreditSalesRecord {
  id: string;
  date: string;
  saleTime: string;
  customer: string;
  vehicleNo: string;
  voucherNo: string;
  slipNo: string;
  productCategory: string;
  productName: string;
  productUnit: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  mpdName: string;
  nozzleName: string;
  status: 'Completed' | 'Pending' | 'Verified';
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Return current IST date string YYYY-MM-DD */
function getISTDateString(): string {
  const now = new Date();
  // IST = UTC + 5:30
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

/** Auto-generate voucher number */
function generateVoucherNo(existingCount: number): string {
  return `CRVCH${String(existingCount + 1).padStart(5, '0')}`;
}

/** Auto-generate slip number */
function generateSlipNo(existingCount: number): string {
  const today = getISTDateString().replace(/-/g, '');
  return `SLIP${today}${String(existingCount + 1).padStart(3, '0')}`;
}



// ─────────────────────────────────────────────────────────────
// Initial form state
// ─────────────────────────────────────────────────────────────
const INIT_FORM = {
  customer: '',
  vehicleNo: '',
  vehicleId: '',
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
  status: 'Pending' as 'Pending' | 'Completed' | 'Verified'
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export function CreditSales() {
  // ── Master data ──
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mpds, setMpds] = useState<MPD[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // ── Table / pagination state ──
  const [records] = useState<CreditSalesRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
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
  // Load master data once on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingMaster(true);
      try {
        const [vRes, pRes, mRes] = await Promise.all([
          fetchVehicles({ size: 1000, status: 'Active' }),
          fetchProducts({ size: 1000 }),
          fetchMpdsAll()
        ]);
        setVehicles(vRes.content);
        setProducts(pRes.content);
        setMpds(mRes);
      } catch {
        // silent — UI still works with empty lists
      } finally {
        setLoadingMaster(false);
      }
    };
    load();
  }, []);

  // ─────────────────────────────────────────────
  // Auto-calculate: when qty changes → update totalAmount
  // Auto-calculate: when totalAmount changes → update qty
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
  // When product changes → set rate from product (if available)
  // ─────────────────────────────────────────────
  const handleProductChange = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setForm(prev => ({
      ...prev,
      productId,
      productName: prod.name,
      productUnit: prod.unit,
      // Rate is not stored in product master — keep whatever rate user has or clear
      quantity: '',
      totalAmount: ''
    }));
  };

  // ─────────────────────────────────────────────
  // When MPD changes → reset nozzle selection
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // When product category changes → reset product
  // ─────────────────────────────────────────────
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
  // When vehicle changes
  // ─────────────────────────────────────────────
  const handleVehicleChange = (vehicleId: string) => {
    const v = vehicles.find(v => v.id === vehicleId);
    setForm(prev => ({
      ...prev,
      vehicleId,
      vehicleNo: v?.vehicleNumber ?? ''
    }));
  };

  // ─────────────────────────────────────────────
  // Open modals
  // ─────────────────────────────────────────────
  const handleAddNew = () => {
    setModalMode('add');
    setActiveRecordId(null);
    setForm({
      ...INIT_FORM,
      date: getISTDateString(),
      time: getISTTimeString(),
      voucherNo: generateVoucherNo(records.length),
      slipNo: generateSlipNo(records.length)
    });
    setShowModal(true);
  };

  const handleEdit = (record: CreditSalesRecord) => {
    setModalMode('edit');
    setActiveRecordId(record.id);
    setForm({
      customer: record.customer,
      vehicleNo: record.vehicleNo,
      vehicleId: '',
      voucherNo: record.voucherNo,
      slipNo: record.slipNo,
      productCategory: record.productCategory as '' | 'Fuel' | 'Oil & Lubes',
      productId: '',
      productName: record.productName,
      productUnit: record.productUnit,
      rate: String(record.rate),
      quantity: String(record.quantity),
      totalAmount: String(record.totalAmount),
      mpdId: '',
      mpdName: record.mpdName,
      nozzleId: '',
      nozzleName: record.nozzleName,
      date: record.date,
      time: record.saleTime,
      status: record.status
    });
    setShowModal(true);
  };

  const handleView = (record: CreditSalesRecord) => {
    setModalMode('view');
    setActiveRecordId(record.id);
    setForm({
      customer: record.customer,
      vehicleNo: record.vehicleNo,
      vehicleId: '',
      voucherNo: record.voucherNo,
      slipNo: record.slipNo,
      productCategory: record.productCategory as '' | 'Fuel' | 'Oil & Lubes',
      productId: '',
      productName: record.productName,
      productUnit: record.productUnit,
      rate: String(record.rate),
      quantity: String(record.quantity),
      totalAmount: String(record.totalAmount),
      mpdId: '',
      mpdName: record.mpdName,
      nozzleId: '',
      nozzleName: record.nozzleName,
      date: record.date,
      time: record.saleTime,
      status: record.status
    });
    setShowModal(true);
  };

  const handleDeleteClick = (record: CreditSalesRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simulate save — backend not integrated yet
    setTimeout(() => {
      setSaving(false);
      setShowModal(false);
    }, 600);
  };

  // ─────────────────────────────────────────────
  // Filtering & Pagination
  // ─────────────────────────────────────────────
  const filtered = records.filter(r =>
    r.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.slipNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dtA = new Date(`${a.date}T${a.saleTime}`).getTime();
    const dtB = new Date(`${b.date}T${b.saleTime}`).getTime();
    return dtB - dtA;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  // ── Selection helpers ──
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

  // ── Status badge ──
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-50/80 text-green-700 border-green-200 text-xs">Verified</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50/80 text-amber-700 border-amber-200 text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // ── Stats ──
  const totalSaleAmount = records.reduce((s, r) => s + r.totalAmount, 0);
  const totalSlips = records.length;
  const verifiedCount = records.filter(r => r.status === 'Verified').length;
  const avgSale = totalSlips > 0 ? totalSaleAmount / totalSlips : 0;

  // Readonly field helper for view mode
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
            <p className="text-2xl font-bold font-mono">{formatCurrency(totalSaleAmount)}</p>
            <p className="text-xs text-muted-foreground">Total Credit Sales</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100">
            <CalendarDays className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{totalSlips}</p>
            <p className="text-xs text-muted-foreground">Total Slips</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{verifiedCount}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{formatCurrency(avgSale)}</p>
            <p className="text-xs text-muted-foreground">Avg. Sale</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customer, slip, vehicle, product…"
            className="pl-10 h-9"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              Export All
            </div>
            <DropdownMenuItem className="cursor-pointer text-xs">
              <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
              Export All to CSV
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs">
              <FileDown className="w-4 h-4 mr-2 text-muted-foreground" />
              Export All to Excel
            </DropdownMenuItem>
            <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider border-t border-border mt-1">
              Export Selected ({selectedIds.size})
            </div>
            <DropdownMenuItem className="cursor-pointer text-xs" disabled={selectedIds.size === 0}>
              <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />
              Export Selected to CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Main Table ── */}
      <Card className="overflow-hidden border-border rounded-xl">
        <CardContent className="p-0">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <CreditCard className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No credit sale records found</p>
              <p className="text-xs">
                {searchTerm ? 'Try adjusting your search.' : 'Click "Add New Sale" to create the first record.'}
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 opacity-60" /> Customer
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 opacity-60" /> Slip No
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 opacity-60" /> Vehicle No.
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 opacity-60" /> Product
                      </div>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" /> Date & Time
                      </div>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5 justify-end">
                        Amount <IndianRupee className="w-3.5 h-3.5 opacity-60" />
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
                              {record.customer.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{record.customer}</span>
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" title="Edit" onClick={() => handleEdit(record)} disabled={record.status === 'Verified'}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteClick(record)} disabled={record.status === 'Verified'}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 border-t-2 border-border text-xs font-semibold">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-left">
                      Page Total ({paginated.length} records)
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {formatCurrency(paginated.reduce((s, r) => s + r.totalAmount, 0))}
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-muted-foreground text-left">
                      Overall: <span className="font-mono text-foreground font-bold">{formatCurrency(totalSaleAmount)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Pagination */}
          {sorted.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, sorted.length)} of {sorted.length} entries
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono px-2">Page {currentPage + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════
          ADD / EDIT / VIEW MODAL — matches CashCollection style
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '90vw', width: '900px', height: '88vh', maxHeight: '88vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-primary" />
              {modalMode === 'add'
                ? 'Add New Credit Sale'
                : modalMode === 'edit'
                ? 'Edit Credit Sale'
                : 'Credit Sale Details'}
            </DialogTitle>
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
                        className="h-9 text-xs bg-muted"
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
                        className="h-9 text-xs bg-muted"
                      />
                    </div>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-customer" className="text-xs font-medium">
                      Customer Name <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="cs-customer"
                      placeholder="Enter customer / party name"
                      value={form.customer}
                      onChange={e => setForm(prev => ({ ...prev, customer: e.target.value }))}
                      disabled={isView}
                      className="h-9 text-xs"
                      required={!isView}
                    />
                  </div>

                  {/* Vehicle No */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cs-vehicle" className="text-xs font-medium">
                      Vehicle No. <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {loadingMaster ? (
                      <div className="h-9 flex items-center text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Loading vehicles…
                      </div>
                    ) : (
                      <Select
                        value={form.vehicleId || 'NONE'}
                        onValueChange={val => {
                          if (val === 'NONE') return;
                          handleVehicleChange(val);
                        }}
                        disabled={isView}
                      >
                        <SelectTrigger id="cs-vehicle" className="h-9 text-xs">
                          <SelectValue placeholder="-- Select Vehicle --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Select Vehicle --</SelectItem>
                          {vehicles.length === 0 ? (
                            <SelectItem value="_empty" disabled>No vehicles found in master</SelectItem>
                          ) : (
                            vehicles.map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.vehicleNumber} · {v.vehicleType}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {/* Show selected vehicle number or typed */}
                    {form.vehicleNo && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Selected: <span className="font-mono font-semibold text-foreground">{form.vehicleNo}</span>
                      </p>
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
                    Product & Sale Details
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
                    {loadingMaster ? (
                      <div className="h-9 flex items-center text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Loading products…
                      </div>
                    ) : (
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
                    )}
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
                    {loadingMaster ? (
                      <div className="h-9 flex items-center text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Loading MPDs…
                      </div>
                    ) : (
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
                    )}
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
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              Delete Credit Sale Record?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Are you sure you want to permanently delete this credit sale record? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-3 rounded-lg border border-border text-xs space-y-1">
            <p><span className="font-semibold">Customer:</span> {recordToDelete?.customer}</p>
            <p><span className="font-semibold">Slip No:</span> {recordToDelete?.slipNo}</p>
            <p><span className="font-semibold">Vehicle:</span> {recordToDelete?.vehicleNo}</p>
            <p><span className="font-semibold">Amount:</span> {recordToDelete && formatCurrency(recordToDelete.totalAmount)}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowDeleteConfirm(false); setRecordToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { setShowDeleteConfirm(false); setRecordToDelete(null); }}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}