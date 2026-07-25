import React from 'react';
import { Plus, Eye, Edit, Trash2, Check, Search, Filter, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

interface ExpenseRecord {
  id: string;
  voucherNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  voucherDate: string;
  partyName: string;
  expenseType: string;
  description: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: string;
  isCreditPurchase: boolean;
  creditDueDate: string;
  bankName: string;
  chequeNumber: string;
  referenceNumber: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  remarks: string;
}

const expenseTypes = [
  'Electricity Bill',
  'Water Bill',
  'Rent',
  'Salary & Wages',
  'Fuel for Generator',
  'Maintenance & Repairs',
  'Stationary & Printing',
  'Telephone & Internet',
  'Security Services',
  'Cleaning & Housekeeping',
  'Transport & Freight',
  'Advertisement',
  'Bank Charges',
  'Professional Fees',
  'Insurance',
  'Vehicle Maintenance',
  'Equipment Purchase',
  'Other',
];

const paymentModes = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Credit Card', 'Debit Card'];

const mockExpenses: ExpenseRecord[] = [
  {
    id: 'EXP-2024-001',
    voucherNumber: 'VCH/EXP/2024/001',
    invoiceNumber: 'MSEB/2024/03/5678',
    invoiceDate: '2024-03-15',
    voucherDate: '2024-03-20',
    partyName: 'Maharashtra State Electricity Board',
    expenseType: 'Electricity Bill',
    description: 'Monthly electricity bill for March 2024',
    amount: 18500.00,
    gstAmount: 0,
    totalAmount: 18500.00,
    paymentMode: 'NEFT',
    isCreditPurchase: false,
    creditDueDate: '',
    bankName: 'State Bank of India',
    chequeNumber: '',
    referenceNumber: 'NEFT202403201234',
    status: 'Paid',
    remarks: '',
  },
  {
    id: 'EXP-2024-002',
    voucherNumber: 'VCH/EXP/2024/002',
    invoiceNumber: 'INV/MAINT/2024/089',
    invoiceDate: '2024-03-18',
    voucherDate: '2024-03-22',
    partyName: 'Sharma Engineering Works',
    expenseType: 'Maintenance & Repairs',
    description: 'Pump maintenance and seal replacement for MPD-2',
    amount: 12000.00,
    gstAmount: 2160.00,
    totalAmount: 14160.00,
    paymentMode: 'Cheque',
    isCreditPurchase: false,
    creditDueDate: '',
    bankName: 'HDFC Bank',
    chequeNumber: '004521',
    referenceNumber: '',
    status: 'Paid',
    remarks: 'GST @ 18%',
  },
  {
    id: 'EXP-2024-003',
    voucherNumber: 'VCH/EXP/2024/003',
    invoiceNumber: 'RENT/2024/03',
    invoiceDate: '2024-03-01',
    voucherDate: '2024-03-05',
    partyName: 'Patil Properties Pvt. Ltd.',
    expenseType: 'Rent',
    description: 'Monthly premises rent for March 2024',
    amount: 45000.00,
    gstAmount: 8100.00,
    totalAmount: 53100.00,
    paymentMode: 'NEFT',
    isCreditPurchase: false,
    creditDueDate: '',
    bankName: 'State Bank of India',
    chequeNumber: '',
    referenceNumber: 'NEFT202403051001',
    status: 'Paid',
    remarks: '',
  },
  {
    id: 'EXP-2024-004',
    voucherNumber: 'VCH/EXP/2024/004',
    invoiceNumber: 'INV/SEC/2024/031',
    invoiceDate: '2024-03-31',
    voucherDate: '2024-03-31',
    partyName: 'SecureGuard Services',
    expenseType: 'Security Services',
    description: 'Security personnel charges for March 2024',
    amount: 22000.00,
    gstAmount: 3960.00,
    totalAmount: 25960.00,
    paymentMode: 'Cash',
    isCreditPurchase: true,
    creditDueDate: '2024-04-10',
    bankName: '',
    chequeNumber: '',
    referenceNumber: '',
    status: 'Pending',
    remarks: 'Payment due on 10 April',
  },
];

const emptyForm = (): Omit<ExpenseRecord, 'id'> => ({
  voucherNumber: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  voucherDate: new Date().toISOString().split('T')[0],
  partyName: '',
  expenseType: '',
  description: '',
  amount: 0,
  gstAmount: 0,
  totalAmount: 0,
  paymentMode: 'Cash',
  isCreditPurchase: false,
  creditDueDate: '',
  bankName: '',
  chequeNumber: '',
  referenceNumber: '',
  status: 'Paid',
  remarks: '',
});

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const statusColor: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Overdue: 'bg-red-100 text-red-700 border-red-200',
};

export function Expenses() {
  const [records, setRecords] = React.useState<ExpenseRecord[]>(mockExpenses);
  const [showForm, setShowForm] = React.useState(false);
  const [viewRecord, setViewRecord] = React.useState<ExpenseRecord | null>(null);
  const [editRecord, setEditRecord] = React.useState<ExpenseRecord | null>(null);
  const [search, setSearch] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [form, setForm] = React.useState(emptyForm());

  const nextVoucherNo = () => {
    const n = records.length + 1;
    return `VCH/EXP/2024/${String(n).padStart(3, '0')}`;
  };

  const openNew = () => {
    setEditRecord(null);
    setForm({ ...emptyForm(), voucherNumber: nextVoucherNo() });
    setShowForm(true);
  };

  const openEdit = (rec: ExpenseRecord) => {
    setEditRecord(rec);
    setForm({ ...rec });
    setShowForm(true);
  };

  const computeTotal = (amount: number, gst: number) => amount + gst;

  React.useEffect(() => {
    setForm(p => ({ ...p, totalAmount: computeTotal(p.amount, p.gstAmount) }));
  }, [form.amount, form.gstAmount]);

  const handleSave = () => {
    if (editRecord) {
      setRecords(prev => prev.map(r => r.id === editRecord.id ? { ...form, id: editRecord.id } : r));
    } else {
      const newRec: ExpenseRecord = {
        ...form,
        id: `EXP-2024-${String(records.length + 1).padStart(3, '0')}`,
      };
      setRecords(prev => [newRec, ...prev]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const filtered = records.filter(r => {
    const matchSearch = search === '' ||
      r.partyName.toLowerCase().includes(search.toLowerCase()) ||
      r.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.expenseType.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.expenseType === filterType;
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totals = {
    amount: filtered.reduce((s, r) => s + r.amount, 0),
    gst: filtered.reduce((s, r) => s + r.gstAmount, 0),
    total: filtered.reduce((s, r) => s + r.totalAmount, 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Record and track all operational expenses with voucher details</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />New Expense</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Expenses', value: totals.total, sub: `${filtered.length} records`, color: 'bg-rose-50 border-rose-200 text-rose-700' },
          { label: 'GST Paid', value: totals.gst, sub: 'Input tax credit eligible', color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Net Amount', value: totals.amount, sub: 'Before GST', color: 'bg-blue-50 border-blue-200 text-blue-700' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={`border rounded-lg p-4 ${color}`}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="text-2xl font-bold mt-1">{fmtINR(value)}</p>
            <p className="text-xs opacity-70 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by party, voucher, type…" className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {expenseTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Voucher No.</th>
                <th className="px-4 py-3 text-left">Invoice No.</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Party Name</th>
                <th className="px-4 py-3 text-left">Expense Type</th>
                <th className="px-4 py-3 text-left">Payment Mode</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground text-sm">No expense records found</td></tr>
              )}
              {filtered.map(rec => (
                <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{rec.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium">{rec.invoiceNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm">{new Date(rec.voucherDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-sm font-medium">{rec.partyName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{rec.expenseType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      {rec.isCreditPurchase && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Credit</span>}
                      {rec.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{fmtINR(rec.amount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600">{rec.gstAmount > 0 ? fmtINR(rec.gstAmount) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{fmtINR(rec.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[rec.status]}`}>{rec.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewRecord(rec)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(rec)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(rec.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/30 border-t font-semibold text-sm">
                  <td colSpan={6} className="px-4 py-3 text-muted-foreground">Total ({filtered.length} records)</td>
                  <td className="px-4 py-3 text-right">{fmtINR(totals.amount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmtINR(totals.gst)}</td>
                  <td className="px-4 py-3 text-right">{fmtINR(totals.total)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editRecord ? 'Edit Expense' : 'New Expense Voucher'}</DialogTitle>
            <DialogDescription>Record an expense with payment or credit purchase details.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-2 px-1">
            {/* Voucher Info */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Voucher Number</Label>
                <Input value={form.voucherNumber} onChange={e => setForm(p => ({ ...p, voucherNumber: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Voucher Date</Label>
                <Input type="date" value={form.voucherDate} onChange={e => setForm(p => ({ ...p, voucherDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice / Bill Number</Label>
                <Input value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} placeholder="e.g. MSEB/2024/001" />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Date</Label>
                <Input type="date" value={form.invoiceDate} onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))} />
              </div>
            </div>

            {/* Party & Expense Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name of Party / Vendor</Label>
                <Input value={form.partyName} onChange={e => setForm(p => ({ ...p, partyName: e.target.value }))} placeholder="e.g. MSEB, Sharma Electricals…" />
              </div>
              <div className="space-y-1.5">
                <Label>Type of Expense</Label>
                <Select value={form.expenseType} onValueChange={v => setForm(p => ({ ...p, expenseType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                  <SelectContent>{expenseTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description of the expense…" />
              </div>
            </div>

            {/* Amount */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Amount Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} onWheel={(e) => e.currentTarget.blur()} className="text-right" />
                </div>
                <div className="space-y-1.5">
                  <Label>GST Amount (₹)</Label>
                  <Input type="number" value={form.gstAmount || ''} onChange={e => setForm(p => ({ ...p, gstAmount: parseFloat(e.target.value) || 0 }))} onWheel={(e) => e.currentTarget.blur()} className="text-right" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total Amount (₹)</Label>
                  <Input value={fmtINR(form.totalAmount)} readOnly className="text-right font-semibold bg-muted/30" />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Details</h4>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="creditPurchase" checked={form.isCreditPurchase} onChange={e => setForm(p => ({ ...p, isCreditPurchase: e.target.checked }))} className="h-4 w-4" />
                  <label htmlFor="creditPurchase" className="text-sm font-medium text-purple-700">Credit Purchase</label>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Payment Mode</Label>
                  <Select value={form.paymentMode} onValueChange={v => setForm(p => ({ ...p, paymentMode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.isCreditPurchase && (
                  <div className="space-y-1.5">
                    <Label>Credit Due Date</Label>
                    <Input type="date" value={form.creditDueDate} onChange={e => setForm(p => ({ ...p, creditDueDate: e.target.value }))} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as ExpenseRecord['status'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.paymentMode !== 'Cash' && form.paymentMode !== 'UPI' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Bank Name</Label>
                    <Input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. HDFC Bank" />
                  </div>
                  {form.paymentMode === 'Cheque' && (
                    <div className="space-y-1.5">
                      <Label>Cheque Number</Label>
                      <Input value={form.chequeNumber} onChange={e => setForm(p => ({ ...p, chequeNumber: e.target.value }))} className="font-mono" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Reference / Transaction Number</Label>
                    <Input value={form.referenceNumber} onChange={e => setForm(p => ({ ...p, referenceNumber: e.target.value }))} className="font-mono" />
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={2} placeholder="Any additional notes…" />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}><Check className="h-4 w-4 mr-1" />{editRecord ? 'Update' : 'Save'} Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Expense Voucher — {viewRecord.voucherNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Voucher Date', value: new Date(viewRecord.voucherDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { label: 'Invoice Number', value: viewRecord.invoiceNumber || '—' },
                  { label: 'Invoice Date', value: viewRecord.invoiceDate ? new Date(viewRecord.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Status', value: viewRecord.status },
                ].map(({ label, value }) => (
                  <div key={label} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Party / Vendor</span><span className="font-semibold">{viewRecord.partyName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expense Type</span><span className="font-medium">{viewRecord.expenseType}</span></div>
                {viewRecord.description && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Description</span><span className="max-w-xs text-right">{viewRecord.description}</span></div>}
              </div>

              <div className="border rounded-lg divide-y text-sm">
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Net Amount</span><span className="font-medium">{fmtINR(viewRecord.amount)}</span></div>
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">GST Amount</span><span className="font-medium text-orange-600">{fmtINR(viewRecord.gstAmount)}</span></div>
                <div className="flex justify-between px-4 py-2.5 bg-muted/20 font-semibold"><span>Total Amount</span><span>{fmtINR(viewRecord.totalAmount)}</span></div>
              </div>

              <div className="border rounded-lg p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Payment Details</p>
                {[
                  { label: 'Mode', value: viewRecord.paymentMode },
                  viewRecord.isCreditPurchase ? { label: 'Credit Purchase', value: 'Yes' } : null,
                  viewRecord.creditDueDate ? { label: 'Due Date', value: new Date(viewRecord.creditDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : null,
                  viewRecord.bankName ? { label: 'Bank', value: viewRecord.bankName } : null,
                  viewRecord.chequeNumber ? { label: 'Cheque No.', value: viewRecord.chequeNumber } : null,
                  viewRecord.referenceNumber ? { label: 'Reference No.', value: viewRecord.referenceNumber } : null,
                ].filter(Boolean).map((item) => item && (
                  <div key={item.label} className="flex justify-between border-b pb-1.5 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium font-mono text-xs">{item.value}</span>
                  </div>
                ))}
              </div>

              {viewRecord.remarks && (
                <div className="border rounded-lg p-3 bg-muted/20 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                  <p>{viewRecord.remarks}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
