import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  BadgeIndianRupee,
  Car,
  Truck,
  Bike,
  X,
  Loader2,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import {
  fetchProducts,
  Product,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchVehicles,
  Customer,
  CustomerVehicle,
  fetchNextCustomerCode,
  checkCustomerUnique
} from '../services/api';



// ─────────────────────────────────────────────
// Vehicle number formatter
// Converts any input → MH-10-BD-3132 format
// ─────────────────────────────────────────────
function formatVehicleNumber(raw: string): string {
  // Strip everything except alphanumeric, uppercase
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  // Slice into 4 groups: [2][2][2][4]
  const g1 = clean.slice(0, 2);
  const g2 = clean.slice(2, 4);
  const g3 = clean.slice(4, 6);
  const g4 = clean.slice(6, 10);
  return [g1, g2, g3, g4].filter(g => g.length > 0).join('-');
}

// Validate formatted vehicle number (XX-XX-XX-XXXX)
function isValidVehicleNumber(v: string): boolean {
  // Allow partial during typing; only validate if reasonably complete (>= 9 chars)
  if (v.length < 9) return false;
  return /^[A-Z]{2}-[0-9]{1,2}-[A-Z]{1,3}-[0-9]{1,4}$/.test(v);
}

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const BLANK_VEHICLE: Omit<CustomerVehicle, 'id'> = {
  vehicleNumber: '',
  vehicleType: 'Car',
  make: '',
  model: '',
  color: '',
  fuelType: ''
};

const BLANK_FORM: Omit<Customer, 'id'> = {
  customerCode: '',
  customerName: '',
  contactPerson: '',
  aadharNo: '',
  creditLimit: '',
  openingBalance: 0,
  creditPeriod: 15,
  creditDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  phoneNo: '',
  mobileNo: '',
  email: '',
  address: '',
  area: '',
  city: '',
  state: '',
  pincode: '',
  gstNo: '',
  panNo: '',
  cinNo: '',
  status: 'Active',
  vehicles: []
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const vehicleIcon = (type: string) => {
  switch (type) {
    case 'Truck': return Truck;
    case 'Bike':  return Bike;
    default:      return Car;
  }
};

function Req() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function CustomerMaster() {
  // Master state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fuelProducts, setFuelProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination / filter
  const [page, setPage]           = useState(0);
  const [pageSize, setPageSize]   = useState(10);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy]       = useState('customerCode');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Load fuel products on mount
  useEffect(() => {
    const loadFuel = async () => {
      try {
        const response = await fetchProducts({ size: 1000, category: 'Fuel' });
        setFuelProducts(response.content);
      } catch (err) {
        console.error('Failed to load products for fuel types:', err);
      }
    };
    loadFuel();
  }, []);

  // Fetch customers from backend whenever params change
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetchCustomers({
        page,
        size: pageSize,
        search,
        status: statusFilter,
        sortBy,
        sortDir,
      });
      setCustomers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, pageSize, search, statusFilter, sortBy, sortDir]);

  // Dialogs
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [showView, setShowView]       = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Form
  const [form, setForm]   = useState<Omit<Customer, 'id'>>({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);

  // New vehicle row
  const [newVehicle, setNewVehicle] = useState<Omit<CustomerVehicle, 'id'>>({ ...BLANK_VEHICLE });
  const [vehicleError, setVehicleError] = useState('');

  // ── Sort toggle ──
  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
    setPage(0);
  };

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = async (field: string, value: string) => {
    if (!value || !value.trim()) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
      return;
    }

    try {
      const isUnique = await checkCustomerUnique(field, value.trim(), editingCustomer?.id || undefined);
      setValidationErrors(prev => {
        const copy = { ...prev };
        if (!isUnique) {
          const labels: Record<string, string> = {
            mobileNo: 'Mobile Number',
            email: 'Email Address',
            aadharNo: 'Aadhar Card No.',
            gstNo: 'GST Number',
            panNo: 'PAN Number',
            cinNo: 'CIN Number',
            customerCode: 'Customer Code'
          };
          copy[field] = `${labels[field] || field} already exists!`;
        } else {
          delete copy[field];
        }
        return copy;
      });
    } catch {
      // ignore
    }
  };

  // ── Open dialogs ──
  const openAdd = async () => {
    let nextCode = '';
    try {
      nextCode = await fetchNextCustomerCode();
    } catch (err) {
      console.error('Failed to pre-fetch next customer code:', err);
    }
    setForm({
      ...BLANK_FORM,
      customerCode: nextCode
    });
    setNewVehicle({ ...BLANK_VEHICLE });
    setVehicleError('');
    setEditingCustomer(null);
    setValidationErrors({});
    setShowAddEdit(true);
  };

  const openEdit = (c: Customer) => {
    setForm({ ...c });
    setNewVehicle({ ...BLANK_VEHICLE });
    setVehicleError('');
    setEditingCustomer(c);
    setValidationErrors({});
    setShowAddEdit(true);
  };

  const openView = (c: Customer) => {
    setViewingCustomer(c);
    setShowView(true);
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted');
        loadCustomers();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete customer');
      }
    }
  };

  // ── Vehicle helpers ──
  const handleVehicleNumberChange = (raw: string) => {
    const formatted = formatVehicleNumber(raw);
    setNewVehicle(v => ({ ...v, vehicleNumber: formatted }));
    setVehicleError('');
  };

  const isDuplicateVehicle = (vn: string) =>
    form.vehicles.some(v => v.vehicleNumber.replace(/-/g, '') === vn.replace(/-/g, ''));

  const addVehicleRow = async () => {
    const vn = newVehicle.vehicleNumber.trim();
    if (!vn) { setVehicleError('Vehicle number is required'); return; }
    if (vn.replace(/-/g, '').length < 6) { setVehicleError('Enter a valid vehicle number (e.g. MH-10-BD-3132)'); return; }
    if (isDuplicateVehicle(vn)) { setVehicleError('This vehicle number is already added'); return; }
    if (!newVehicle.fuelType) { setVehicleError('Fuel Type is required'); return; }

    // Dynamic warning check: verify if vehicle already exists in the system (Vehicles Master)
    try {
      const response = await fetchVehicles({ search: vn });
      const exactMatch = response.content.some(
        v => v.vehicleNumber.replace(/[^A-Z0-9]/g, '') === vn.replace(/[^A-Z0-9]/g, '')
      );
      if (exactMatch) {
        toast.warning(`Warning: Vehicle number ${vn} already exists in Vehicles Master!`);
      }
    } catch (err) {
      console.error('Error checking vehicle existence:', err);
    }

    setForm(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { ...newVehicle, id: `temp-${Date.now()}-${Math.random()}` }]
    }));
    setNewVehicle({ ...BLANK_VEHICLE });
    setVehicleError('');
  };

  const removeVehicleRow = (id?: string) => {
    setForm(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id)
    }));
  };

  // ── Save ──
  const handleSave = async (addAnother = false) => {
    if (!form.customerName.trim())    { toast.warning('Customer Name is required'); return; }
    if (!form.contactPerson.trim())   { toast.warning('Contact Person is required'); return; }
    if (!form.aadharNo.trim())        { toast.warning('Aadhar Card No. is required'); return; }
    if (form.aadharNo.replace(/\s/g, '').length !== 12) {
      toast.warning('Aadhar Card No. must be 12 digits'); return;
    }
    if (!form.mobileNo.trim())        { toast.warning('Mobile Number is required'); return; }
    if (!/^\d{10}$/.test(form.mobileNo.trim())) {
      toast.warning('Mobile Number must be 10 digits'); return;
    }
    if (!form.email.trim())           { toast.warning('Email Address is required'); return; }
    if (form.vehicles.length === 0)   { toast.warning('Please add at least one vehicle'); return; }

    // Block submit if there are duplicate validation errors
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.warning(firstError);
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer && editingCustomer.id) {
        await updateCustomer(editingCustomer.id, form);
        toast.success('Customer updated successfully');
      } else {
        await createCustomer(form);
        toast.success('Customer added successfully');
      }
      loadCustomers();
      if (addAnother) {
        setForm({ ...BLANK_FORM });
        setNewVehicle({ ...BLANK_VEHICLE });
        setVehicleError('');
        setEditingCustomer(null);
      } else {
        setShowAddEdit(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">Customer Master</h1>
          <p className="text-muted-foreground">Manage customers, credit limits and linked vehicles</p>
        </div>
        <Button id="btn-add-customer" onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add New Customer
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by code, name, contact, city…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <div className="w-36">
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(pageSize)} onValueChange={val => { setPageSize(Number(val)); setPage(0); }}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {[
                  { label: 'Code',          field: 'customerCode' },
                  { label: 'Customer Name', field: 'customerName' },
                ].map(col => (
                  <th key={col.field} onClick={() => toggleSort(col.field)}
                    className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-1.5">
                      {col.label} <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </th>
                ))}
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-left p-4 font-medium">Mobile / Email</th>
                <th className="text-left p-4 font-medium">City</th>
                <th className="text-right p-4 font-medium">Credit Limit</th>
                <th className="text-center p-4 font-medium">Vehicles</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs">Loading customers list...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted-foreground">
                    <User className="w-10 h-10 mx-auto opacity-20 mb-3" />
                    <p className="text-sm font-medium">No customers found</p>
                    <p className="text-xs mt-1">
                      {search || statusFilter !== 'ALL' ? 'Try adjusting your search.' : 'Click "Add New Customer" to get started.'}
                    </p>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono font-medium text-sm">{c.customerCode || '—'}</td>
                  <td className="p-4">
                    <div className="font-medium text-foreground">{c.customerName}</div>
                    {c.gstNo && <div className="text-xs text-muted-foreground font-mono">GST: {c.gstNo}</div>}
                  </td>
                  <td className="p-4 text-sm">{c.contactPerson}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    <div>{c.mobileNo || '—'}</div>
                    {c.email && <div className="text-xs truncate max-w-[140px]">{c.email}</div>}
                  </td>
                  <td className="p-4 text-sm">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="p-4 text-right font-mono text-sm font-semibold">
                    {c.creditLimit ? `₹${Number(c.creditLimit).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="p-4 text-center">
                    {c.vehicles.length > 0
                      ? <Badge variant="secondary" className="text-xs">{c.vehicles.length} vehicle{c.vehicles.length > 1 ? 's' : ''}</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>{c.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button id={`btn-view-${c.customerCode}`} onClick={() => openView(c)} className="p-1.5 hover:bg-sky-500/10 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4 text-sky-500" /></button>
                      <button id={`btn-edit-${c.customerCode}`} onClick={() => openEdit(c)} className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4 text-blue-500" /></button>
                      <button id={`btn-delete-${c.customerCode}`} onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {customers.length === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} customers
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-sm font-medium px-2">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════
          ADD / EDIT MODAL  — full/wide screen, no Y-scroll
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={showAddEdit} onOpenChange={setShowAddEdit}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '96vw', width: '1100px', height: '92vh', maxHeight: '92vh' }}
        >
          {/* ── Header ── */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingCustomer
                ? 'Update the customer record. All fields marked * are mandatory.'
                : 'Fill in the details below. All fields marked * are mandatory.'}
            </DialogDescription>
          </DialogHeader>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="customer-form"
              className="space-y-6"
              onSubmit={e => { e.preventDefault(); handleSave(); }}
            >
              {/* ── Top: 3-column grid ── */}
              <div className="grid grid-cols-3 gap-5">

                {/* ── Column 1: Basic Information ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1.5">
                    Basic Information
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerCode" className="text-xs font-medium">Customer Code</Label>
                    <Input id="customerCode" value={form.customerCode} disabled
                      placeholder="Auto-generated" className="h-9 text-xs bg-muted font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerName" className="text-xs font-medium">Customer Name<Req /></Label>
                    <Input id="customerName" placeholder="Enter customer / company name" className="h-9 text-xs"
                      value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contactPerson" className="text-xs font-medium">Contact Person<Req /></Label>
                    <Input id="contactPerson" placeholder="Enter contact person name" className="h-9 text-xs"
                      value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="aadharNo" className="text-xs font-medium">Aadhar Card No.<Req /></Label>
                    <Input id="aadharNo" placeholder="12-digit Aadhar number" className={`h-9 text-xs font-mono ${validationErrors.aadharNo ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      maxLength={12}
                      value={form.aadharNo}
                      onChange={e => setForm(f => ({ ...f, aadharNo: e.target.value.replace(/\D/g, '') }))}
                      onBlur={() => validateField('aadharNo', form.aadharNo)}
                      required />
                    {validationErrors.aadharNo && (
                      <p className="text-[10px] text-red-500 font-semibold">{validationErrors.aadharNo}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cc-status" className="text-xs font-medium">Status</Label>
                    <Select value={form.status} onValueChange={(v: any) => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger id="cc-status" className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Column 2: Credit & Tax ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1.5">
                    Credit &amp; Tax Information
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-climit" className="text-xs font-medium">Credit Limit (₹)</Label>
                      <Input id="cc-climit" placeholder="0.00" className="h-9 text-xs"
                        value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-obal" className="text-xs font-medium">Opening Balance</Label>
                      <Input id="cc-obal" type="number" step="0.01" placeholder="0.00" className="h-9 text-xs"
                        value={form.openingBalance}
                        onChange={e => setForm(f => ({ ...f, openingBalance: parseFloat(e.target.value) || 0 }))}
                        onWheel={(e) => e.currentTarget.blur()} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-cperiod" className="text-xs font-medium">Credit Period (Days)</Label>
                      <Input id="cc-cperiod" type="number" min="0" placeholder="15" className="h-9 text-xs"
                        value={form.creditPeriod}
                        onChange={e => setForm(f => ({ ...f, creditPeriod: parseInt(e.target.value) || 0 }))}
                        onWheel={(e) => e.currentTarget.blur()} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-cdate" className="text-xs font-medium">Credit Date</Label>
                      <Input id="cc-cdate" type="date" className="h-9 text-xs"
                        value={form.creditDate} onChange={e => setForm(f => ({ ...f, creditDate: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cc-gst" className="text-xs font-medium">GST Number</Label>
                    <Input id="cc-gst" placeholder="22AAAAA0000A1Z5" className={`h-9 text-xs font-mono ${validationErrors.gstNo ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      value={form.gstNo}
                      onChange={e => setForm(f => ({ ...f, gstNo: e.target.value.toUpperCase() }))}
                      onBlur={() => validateField('gstNo', form.gstNo)} />
                    {validationErrors.gstNo && (
                      <p className="text-[10px] text-red-500 font-semibold">{validationErrors.gstNo}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-pan" className="text-xs font-medium">PAN Number</Label>
                      <Input id="cc-pan" placeholder="ABCDE1234F" className={`h-9 text-xs font-mono ${validationErrors.panNo ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        value={form.panNo}
                        onChange={e => setForm(f => ({ ...f, panNo: e.target.value.toUpperCase() }))}
                        onBlur={() => validateField('panNo', form.panNo)} />
                      {validationErrors.panNo && (
                        <p className="text-[10px] text-red-500 font-semibold">{validationErrors.panNo}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-cin" className="text-xs font-medium">CIN Number</Label>
                      <Input id="cc-cin" placeholder="U74999MH2000..." className={`h-9 text-xs font-mono ${validationErrors.cinNo ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                        value={form.cinNo}
                        onChange={e => setForm(f => ({ ...f, cinNo: e.target.value.toUpperCase() }))}
                        onBlur={() => validateField('cinNo', form.cinNo)} />
                      {validationErrors.cinNo && (
                        <p className="text-[10px] text-red-500 font-semibold">{validationErrors.cinNo}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Column 3: Contact & Address ── */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1.5">
                    Contact &amp; Address
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="mobileNo" className="text-xs font-medium">Mobile<Req /></Label>
                      <Input id="mobileNo" placeholder="10-digit mobile" className={`h-9 text-xs ${validationErrors.mobileNo ? 'border-red-500 ring-1 ring-red-500' : ''}`} maxLength={10}
                        value={form.mobileNo}
                        onChange={e => setForm(f => ({ ...f, mobileNo: e.target.value.replace(/\D/g, '') }))}
                        onBlur={() => validateField('mobileNo', form.mobileNo)}
                        required />
                      {validationErrors.mobileNo && (
                        <p className="text-[10px] text-red-500 font-semibold">{validationErrors.mobileNo}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-phone" className="text-xs font-medium">Phone</Label>
                      <Input id="cc-phone" placeholder="Landline" className="h-9 text-xs"
                        value={form.phoneNo} onChange={e => setForm(f => ({ ...f, phoneNo: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email Address<Req /></Label>
                    <Input id="email" type="email" placeholder="name@company.com" className={`h-9 text-xs ${validationErrors.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      onBlur={() => validateField('email', form.email)}
                      required />
                    {validationErrors.email && (
                      <p className="text-[10px] text-red-500 font-semibold">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cc-addr" className="text-xs font-medium">Address</Label>
                    <Input id="cc-addr" placeholder="Street / plot number" className="h-9 text-xs"
                      value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-area" className="text-xs font-medium">Area</Label>
                      <Input id="cc-area" placeholder="Area / locality" className="h-9 text-xs"
                        value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-city" className="text-xs font-medium">City</Label>
                      <Input id="cc-city" placeholder="City" className="h-9 text-xs"
                        value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-state" className="text-xs font-medium">State</Label>
                      <Input id="cc-state" placeholder="State" className="h-9 text-xs"
                        value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cc-pin" className="text-xs font-medium">Pincode</Label>
                      <Input id="cc-pin" placeholder="6-digit pin" className="h-9 text-xs" maxLength={6}
                        value={form.pincode}
                        onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bottom: Vehicles Section (full width) ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Linked Vehicles<Req />
                    <span className="ml-2 text-[10px] normal-case font-normal text-muted-foreground/70">
                      (at least 1 vehicle required)
                    </span>
                  </p>
                  {form.vehicles.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{form.vehicles.length} added</Badge>
                  )}
                </div>

                {/* Added vehicles table */}
                <div className="border border-border rounded-lg overflow-hidden flex flex-col h-[280px] shrink-0">
                  {form.vehicles.length > 0 ? (
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-xs table-fixed">
                        <thead className="sticky top-0 bg-muted/60 border-b border-border z-10">
                          <tr className="divide-x divide-border/40">
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[22%]">Vehicle No.</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[15%]">Type</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[16%]">Make</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[16%]">Model</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[13%]">Color</th>
                            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-[13%]">Fuel Type</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {form.vehicles.map(v => {
                            const VIcon = vehicleIcon(v.vehicleType);
                            return (
                              <tr key={v.id} className="hover:bg-muted/10 divide-x divide-border/30">
                                <td className="px-3 py-2 font-mono font-semibold text-foreground truncate">{v.vehicleNumber}</td>
                                <td className="px-3 py-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">
                                    <VIcon className="w-3 h-3" />{v.vehicleType}
                                  </span>
                                </td>
                                <td className="px-3 py-2 truncate">{v.make || '—'}</td>
                                <td className="px-3 py-2 truncate">{v.model || '—'}</td>
                                <td className="px-3 py-2 truncate">{v.color || '—'}</td>
                                <td className="px-3 py-2 truncate">{v.fuelType || '—'}</td>
                                <td className="px-3 py-2 text-center">
                                  <button type="button" onClick={() => removeVehicleRow(v.id)}
                                    className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground py-8">
                      <p className="text-xs">No vehicles added yet — use the form below to add one</p>
                    </div>
                  )}

                  {/* ── Inline Add-Vehicle Row ── */}
                  <div className="border-t border-border bg-muted/10 p-3 shrink-0">
                    <div className="flex items-start gap-2 w-full">
                      {/* Vehicle Number */}
                      <div className="space-y-1 flex-[22] min-w-0">
                        <Label className="text-[11px] font-medium truncate block">
                          Vehicle No.<Req />
                        </Label>
                        <div className="relative">
                          <Input
                            id="vehicleNumber"
                            placeholder="MH-10-BD-3132"
                            className={`h-8 text-xs font-mono pr-8 w-full ${vehicleError ? 'border-red-400' : ''}`}
                            value={newVehicle.vehicleNumber}
                            onChange={e => handleVehicleNumberChange(e.target.value)}
                            maxLength={13}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVehicleRow(); } }}
                          />
                          {newVehicle.vehicleNumber && (
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold ${
                              isValidVehicleNumber(newVehicle.vehicleNumber) ? 'text-green-500' : 'text-amber-500'
                            }`}>
                              {isValidVehicleNumber(newVehicle.vehicleNumber) ? '✓' : '…'}
                            </span>
                          )}
                        </div>
                        {vehicleError && (
                          <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 leading-tight">
                            <AlertCircle className="w-2.5 h-2.5 shrink-0" />{vehicleError}
                          </p>
                        )}
                      </div>

                      {/* Type */}
                      <div className="space-y-1 flex-[15] min-w-0">
                        <Label className="text-[11px] font-medium truncate block">Type</Label>
                        <Select value={newVehicle.vehicleType}
                          onValueChange={(val: any) => setNewVehicle(v => ({ ...v, vehicleType: val }))}>
                          <SelectTrigger className="h-8 text-xs flex items-center w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Car">Car</SelectItem>
                            <SelectItem value="Truck">Truck</SelectItem>
                            <SelectItem value="Bike">Bike</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Make */}
                      <div className="space-y-1 flex-[16] min-w-0">
                        <Label className="text-[11px] font-medium truncate block">Make</Label>
                        <Input placeholder="Tata" className="h-8 text-xs w-full"
                          value={newVehicle.make}
                          onChange={e => setNewVehicle(v => ({ ...v, make: e.target.value }))} />
                      </div>

                      {/* Model */}
                      <div className="space-y-1 flex-[16] min-w-0">
                        <Label className="text-[11px] font-medium truncate block">Model</Label>
                        <Input placeholder="Nexon" className="h-8 text-xs w-full"
                          value={newVehicle.model}
                          onChange={e => setNewVehicle(v => ({ ...v, model: e.target.value }))} />
                      </div>

                      {/* Color */}
                      <div className="space-y-1 flex-[13] min-w-0">
                        <Label className="text-[11px] font-medium truncate block">Color</Label>
                        <Input placeholder="White" className="h-8 text-xs w-full"
                          value={newVehicle.color}
                          onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))} />
                      </div>

                      {/* Fuel Type */}
                      <div className="space-y-1 flex-[13] min-w-0">
                        <Label className="text-[11px] font-medium truncate block">Fuel<Req /></Label>
                        <Select value={newVehicle.fuelType || 'NONE'}
                          onValueChange={(val) => {
                            setNewVehicle(v => ({ ...v, fuelType: val === 'NONE' ? '' : val }));
                          }}>
                          <SelectTrigger className="h-8 text-xs flex items-center w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Select</SelectItem>
                            {fuelProducts.length === 0 ? (
                              <SelectItem value="NO_PRODUCTS" disabled>No products</SelectItem>
                            ) : (
                              fuelProducts.map(prod => (
                                <SelectItem key={prod.id} value={prod.name}>
                                  {prod.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add button (Icon only, no label) */}
                      <div className="space-y-1 w-10 shrink-0 flex flex-col items-center">
                        <div className="text-[11px] font-medium invisible select-none">&nbsp;</div>
                        <Button id="btn-add-vehicle" type="button" size="sm" variant="default" className="h-8 w-8 p-0" title="Add Vehicle" onClick={addVehicleRow}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-border shrink-0 bg-muted/10 flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddEdit(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {!editingCustomer && (
                <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => handleSave(true)}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  Save &amp; Add Another
                </Button>
              )}
              <Button id="btn-save-customer" type="submit" form="customer-form" size="sm" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* ══════════════════════════════════════════════════════════════
          VIEW DIALOG
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="sm:max-w-[850px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" /> Customer Details
            </DialogTitle>
            <DialogDescription>Complete customer profile and linked vehicles</DialogDescription>
          </DialogHeader>

          {viewingCustomer && (
            <div className="space-y-5 py-2 text-sm max-h-[75vh] overflow-y-auto subtle-scrollbar pr-1">

              {/* Profile Card */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
                  {viewingCustomer.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-xl text-foreground truncate">{viewingCustomer.customerName}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      viewingCustomer.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>{viewingCustomer.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium">
                      Code: {viewingCustomer.customerCode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      Contact Person: {viewingCustomer.contactPerson}
                    </span>
                    {viewingCustomer.creditDate && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                        Credit Date: {viewingCustomer.creditDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Credit Details */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Credit Settings</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Credit Limit', value: viewingCustomer.creditLimit ? `₹${Number(viewingCustomer.creditLimit).toLocaleString('en-IN')}` : 'No Limit' },
                    { label: 'Credit Period', value: viewingCustomer.creditPeriod ? `${viewingCustomer.creditPeriod} days` : '0 days' },
                    { label: 'Opening Balance', value: `₹${Number(viewingCustomer.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                    { label: 'Credit Date', value: viewingCustomer.creditDate || '—' }
                  ].map(d => (
                    <div key={d.label} className="p-3 bg-card rounded-xl border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">{d.label}</p>
                      <p className="font-semibold font-mono text-sm text-foreground">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact + Address Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Contact Column */}
                <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-sky-500" /> Contact Info
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Mobile Number</p>
                        <p className="text-xs font-mono font-medium mt-0.5">{viewingCustomer.mobileNo || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Phone (Landline)</p>
                        <p className="text-xs font-mono mt-0.5">{viewingCustomer.phoneNo || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Email Address</p>
                        <p className="text-xs font-medium mt-0.5 truncate max-w-[200px]">{viewingCustomer.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Aadhar Card No.</p>
                        <p className="text-xs font-mono mt-0.5">{viewingCustomer.aadharNo || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Column */}
                <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" /> Address Details
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Street Address</p>
                      <p className="text-xs mt-1 text-foreground leading-normal font-medium">{viewingCustomer.address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Area</p>
                      <p className="text-xs mt-1 text-foreground font-medium">{viewingCustomer.area || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">City</p>
                      <p className="text-xs mt-1 text-foreground font-medium">{viewingCustomer.city || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">State</p>
                      <p className="text-xs mt-1 text-foreground font-medium">{viewingCustomer.state || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground leading-none font-semibold uppercase">Pincode</p>
                      <p className="text-xs font-mono mt-1 text-foreground font-semibold">{viewingCustomer.pincode || '—'}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tax Identifiers Card */}
              <div className="p-4 bg-muted/10 rounded-xl border border-border space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-1.5">
                  <BadgeIndianRupee className="w-4 h-4 text-indigo-500" /> Tax & Business Identifiers
                </p>
                <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                  <div>
                    <span className="font-sans text-[10px] font-semibold text-muted-foreground block uppercase">GST Number</span>
                    <span className="text-foreground font-semibold">{viewingCustomer.gstNo || '—'}</span>
                  </div>
                  <div>
                    <span className="font-sans text-[10px] font-semibold text-muted-foreground block uppercase">PAN Number</span>
                    <span className="text-foreground font-semibold">{viewingCustomer.panNo || '—'}</span>
                  </div>
                  <div>
                    <span className="font-sans text-[10px] font-semibold text-muted-foreground block uppercase">CIN Number</span>
                    <span className="text-foreground font-semibold">{viewingCustomer.cinNo || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicles */}
              {viewingCustomer.vehicles && viewingCustomer.vehicles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Linked Vehicles ({viewingCustomer.vehicles.length})
                  </p>
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          {['Vehicle No.', 'Type', 'Make / Model', 'Color', 'Fuel Used'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {viewingCustomer.vehicles.map((v, index) => {
                          const VIcon = vehicleIcon(v.vehicleType);
                          return (
                            <tr key={v.id || index} className="hover:bg-muted/50 transition-colors">
                              <td className="px-3 py-2 font-mono font-semibold text-foreground">{v.vehicleNumber}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[10px] font-medium text-foreground">
                                  <VIcon className="w-3 h-3 text-muted-foreground" />{v.vehicleType}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-foreground font-medium">{[v.make, v.model].filter(Boolean).join(' ') || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{v.color || '—'}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                  {v.fuelType || '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowView(false); if (viewingCustomer) openEdit(viewingCustomer); }}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button size="sm" onClick={() => setShowView(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
