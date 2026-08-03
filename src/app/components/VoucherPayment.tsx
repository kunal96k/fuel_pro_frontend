import React from 'react';
import { Plus, Eye, Edit, Trash2, Check, Search, Download, IndianRupee } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

type PaymentAgainst = 'Fuel Purchase' | 'Oil Purchase' | 'Credit Expense';
type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

interface PaymentRecord {
  id: string;
  voucherNumber: string;
  voucherDate: string;
  paymentAgainst: PaymentAgainst;
  partyName: string;
  referenceInvoice: string;
  referenceDate: string;
  invoiceAmount: number;
  previouslyPaid: number;
  amountPaid: number;
  balance: number;
  paymentMode: string;
  bankName: string;
  chequeNumber: string;
  chequeDate: string;
  transactionRef: string;
  narration: string;
  status: PaymentStatus;
}

const paymentModes = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Bank Transfer'];

const mockParties: Record<PaymentAgainst, string[]> = {
  'Fuel Purchase': ['BPCL Mumbai Depot', 'HPCL Pune Supply', 'Indian Oil Corporation', 'Nayara Energy'],
  'Oil Purchase': ['Castrol India Ltd.', 'Shell Lubricants', 'Gulf Oil Corporation', 'Bharat Shell'],
  'Credit Expense': ['Maharashtra State Electricity Board', 'Patil Properties Pvt. Ltd.', 'SecureGuard Services', 'Sharma Engineering Works'],
};

const mockPayments: PaymentRecord[] = [
  {
    id: 'PAY-2024-001',
    voucherNumber: 'VCH/PAY/2024/001',
    voucherDate: '2024-03-22',
    paymentAgainst: 'Fuel Purchase',
    partyName: 'BPCL Mumbai Depot',
    referenceInvoice: 'BPCL/2024/03/4521',
    referenceDate: '2024-03-18',
    invoiceAmount: 425000.00,
    previouslyPaid: 0,
    amountPaid: 425000.00,
    balance: 0,
    paymentMode: 'RTGS',
    bankName: 'State Bank of India',
    chequeNumber: '',
    chequeDate: '',
    transactionRef: 'RTGS2024032201',
    narration: 'Payment against fuel invoice BPCL/2024/03/4521',
    status: 'Paid',
  },
  {
    id: 'PAY-2024-002',
    voucherNumber: 'VCH/PAY/2024/002',
    voucherDate: '2024-03-25',
    paymentAgainst: 'Oil Purchase',
    partyName: 'Castrol India Ltd.',
    referenceInvoice: 'CASTROL/INV/2024/0089',
    referenceDate: '2024-03-20',
    invoiceAmount: 85000.00,
    previouslyPaid: 0,
    amountPaid: 50000.00,
    balance: 35000.00,
    paymentMode: 'NEFT',
    bankName: 'HDFC Bank',
    chequeNumber: '',
    chequeDate: '',
    transactionRef: 'NEFT2024032501',
    narration: 'Partial payment against oil purchase invoice',
    status: 'Partial',
  },
  {
    id: 'PAY-2024-003',
    voucherNumber: 'VCH/PAY/2024/003',
    voucherDate: '2024-03-28',
    paymentAgainst: 'Credit Expense',
    partyName: 'Sharma Engineering Works',
    referenceInvoice: 'INV/MAINT/2024/089',
    referenceDate: '2024-03-18',
    invoiceAmount: 14160.00,
    previouslyPaid: 0,
    amountPaid: 14160.00,
    balance: 0,
    paymentMode: 'Cheque',
    bankName: 'HDFC Bank',
    chequeNumber: '004522',
    chequeDate: '2024-03-28',
    transactionRef: '',
    narration: 'Full payment for pump maintenance',
    status: 'Paid',
  },
];

const emptyForm = (): Omit<PaymentRecord, 'id'> => ({
  voucherNumber: '',
  voucherDate: new Date().toISOString().split('T')[0],
  paymentAgainst: 'Fuel Purchase',
  partyName: '',
  referenceInvoice: '',
  referenceDate: '',
  invoiceAmount: 0,
  previouslyPaid: 0,
  amountPaid: 0,
  balance: 0,
  paymentMode: 'Cash',
  bankName: '',
  chequeNumber: '',
  chequeDate: '',
  transactionRef: '',
  narration: '',
  status: 'Paid',
});

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const statusColor: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Pending: 'bg-red-100 text-red-700 border-red-200',
};

const againstColor: Record<string, string> = {
  'Fuel Purchase': 'bg-orange-100 text-orange-700',
  'Oil Purchase': 'bg-blue-100 text-blue-700',
  'Credit Expense': 'bg-purple-100 text-purple-700',
};

export function VoucherPayment() {
  const [records, setRecords] = React.useState<PaymentRecord[]>(mockPayments);
  const [showForm, setShowForm] = React.useState(false);
  const [viewRecord, setViewRecord] = React.useState<PaymentRecord | null>(null);
  const [editRecord, setEditRecord] = React.useState<PaymentRecord | null>(null);
  const [search, setSearch] = React.useState('');
  const [filterAgainst, setFilterAgainst] = React.useState('all');
  const [form, setForm] = React.useState(emptyForm());

  const nextVoucherNo = () => `VCH/PAY/2024/${String(records.length + 1).padStart(3, '0')}`;

  const openNew = () => {
    setEditRecord(null);
    setForm({ ...emptyForm(), voucherNumber: nextVoucherNo() });
    setShowForm(true);
  };

  const openEdit = (rec: PaymentRecord) => {
    setEditRecord(rec);
    setForm({ ...rec });
    setShowForm(true);
  };

  // Recompute balance whenever invoice amount, previously paid, or amount paid changes
  React.useEffect(() => {
    const bal = form.invoiceAmount - form.previouslyPaid - form.amountPaid;
    const status: PaymentStatus = bal <= 0 ? 'Paid' : form.amountPaid > 0 ? 'Partial' : 'Pending';
    setForm(p => ({ ...p, balance: Math.max(0, bal), status }));
  }, [form.invoiceAmount, form.previouslyPaid, form.amountPaid]);

  const handleSave = () => {
    if (editRecord) {
      setRecords(prev => prev.map(r => r.id === editRecord.id ? { ...form, id: editRecord.id } : r));
    } else {
      setRecords(prev => [{ ...form, id: `PAY-2024-${String(records.length + 1).padStart(3, '0')}` }, ...prev]);
    }
    setShowForm(false);
  };

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.partyName.toLowerCase().includes(search.toLowerCase()) ||
      r.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.referenceInvoice.toLowerCase().includes(search.toLowerCase());
    const matchAgainst = filterAgainst === 'all' || r.paymentAgainst === filterAgainst;
    return matchSearch && matchAgainst;
  });

  const totals = {
    invoice: filtered.reduce((s, r) => s + r.invoiceAmount, 0),
    paid: filtered.reduce((s, r) => s + r.amountPaid, 0),
    balance: filtered.reduce((s, r) => s + r.balance, 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Vouchers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Payments made to parties against fuel purchase, oil purchase, and credit expenses</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />New Payment</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Invoice Value', value: totals.invoice, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Total Paid', value: totals.paid, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Outstanding Balance', value: totals.balance, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-lg p-4 ${color}`}>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="text-2xl font-bold mt-1">{fmtINR(value)}</p>
            <p className="text-xs opacity-60 mt-0.5">{filtered.length} records</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search party, voucher, invoice…" className="pl-9" />
        </div>
        <Select value={filterAgainst} onValueChange={setFilterAgainst}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Fuel Purchase">Fuel Purchase</SelectItem>
            <SelectItem value="Oil Purchase">Oil Purchase</SelectItem>
            <SelectItem value="Credit Expense">Credit Expense</SelectItem>
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
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Payment Against</th>
                <th className="px-4 py-3 text-left">Party Name</th>
                <th className="px-4 py-3 text-left">Ref. Invoice</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-right">Invoice Amt</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-muted-foreground text-sm">No payment records found</td></tr>
              )}
              {filtered.map(rec => (
                <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{rec.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm">{new Date(rec.voucherDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${againstColor[rec.paymentAgainst]}`}>{rec.paymentAgainst}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{rec.partyName}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{rec.referenceInvoice}</td>
                  <td className="px-4 py-3 text-sm">{rec.paymentMode}</td>
                  <td className="px-4 py-3 text-sm text-right">{fmtINR(rec.invoiceAmount)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{fmtINR(rec.amountPaid)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-500">{rec.balance > 0 ? fmtINR(rec.balance) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[rec.status]}`}>{rec.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewRecord(rec)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(rec)} className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => setRecords(p => p.filter(r => r.id !== rec.id))} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/30 border-t font-semibold text-sm">
                  <td colSpan={6} className="px-4 py-3 text-muted-foreground">Total ({filtered.length} records)</td>
                  <td className="px-4 py-3 text-right">{fmtINR(totals.invoice)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{fmtINR(totals.paid)}</td>
                  <td className="px-4 py-3 text-right text-red-500">{fmtINR(totals.balance)}</td>
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
            <DialogTitle>{editRecord ? 'Edit Payment Voucher' : 'New Payment Voucher'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-2 px-1">
            {/* Voucher Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Voucher Number</Label>
                <Input value={form.voucherNumber} onChange={e => setForm(p => ({ ...p, voucherNumber: e.target.value }))} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Voucher Date</Label>
                <Input type="date" value={form.voucherDate} onChange={e => setForm(p => ({ ...p, voucherDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Against</Label>
                <Select value={form.paymentAgainst} onValueChange={v => setForm(p => ({ ...p, paymentAgainst: v as PaymentAgainst, partyName: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fuel Purchase">Fuel Purchase</SelectItem>
                    <SelectItem value="Oil Purchase">Oil Purchase</SelectItem>
                    <SelectItem value="Credit Expense">Credit Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Party & Invoice */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Party Name</Label>
                <Select value={form.partyName} onValueChange={v => setForm(p => ({ ...p, partyName: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>
                    {mockParties[form.paymentAgainst].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reference Invoice / Bill No.</Label>
                <Input value={form.referenceInvoice} onChange={e => setForm(p => ({ ...p, referenceInvoice: e.target.value }))} placeholder="Invoice number being paid against" />
              </div>
              <div className="space-y-1.5">
                <Label>Reference Invoice Date</Label>
                <Input type="date" value={form.referenceDate} onChange={e => setForm(p => ({ ...p, referenceDate: e.target.value }))} />
              </div>
            </div>

            {/* Amount Details */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Amount Details</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Invoice Total (₹)</Label>
                  <Input type="number" value={form.invoiceAmount || ''} onChange={e => setForm(p => ({ ...p, invoiceAmount: parseFloat(e.target.value) || 0 }))} onWheel={(e) => e.currentTarget.blur()} className="text-right" />
                </div>
                <div className="space-y-1.5">
                  <Label>Previously Paid (₹)</Label>
                  <Input type="number" value={form.previouslyPaid || ''} onChange={e => setForm(p => ({ ...p, previouslyPaid: parseFloat(e.target.value) || 0 }))} onWheel={(e) => e.currentTarget.blur()} className="text-right" />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Paid Now (₹)</Label>
                  <Input type="number" value={form.amountPaid || ''} onChange={e => setForm(p => ({ ...p, amountPaid: parseFloat(e.target.value) || 0 }))} onWheel={(e) => e.currentTarget.blur()} className="text-right font-semibold" />
                </div>
                <div className="space-y-1.5">
                  <Label>Balance (₹)</Label>
                  <Input value={fmtINR(form.balance)} readOnly className={`text-right font-semibold ${form.balance > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`} />
                </div>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Mode</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Mode of Payment</Label>
                  <Select value={form.paymentMode} onValueChange={v => setForm(p => ({ ...p, paymentMode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{paymentModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. State Bank of India" />
                </div>
                {form.paymentMode === 'Cheque' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Cheque Number</Label>
                      <Input value={form.chequeNumber} onChange={e => setForm(p => ({ ...p, chequeNumber: e.target.value }))} className="font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cheque Date</Label>
                      <Input type="date" value={form.chequeDate} onChange={e => setForm(p => ({ ...p, chequeDate: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Transaction / Reference No.</Label>
                    <Input value={form.transactionRef} onChange={e => setForm(p => ({ ...p, transactionRef: e.target.value }))} className="font-mono" placeholder="UTR / NEFT / RTGS ref" />
                  </div>
                )}
              </div>
            </div>

            {/* Narration */}
            <div className="space-y-1.5">
              <Label>Narration</Label>
              <Textarea value={form.narration} onChange={e => setForm(p => ({ ...p, narration: e.target.value }))} rows={2} placeholder="Payment narration / description…" />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}><Check className="h-4 w-4 mr-1" />{editRecord ? 'Update' : 'Save'} Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Voucher — {viewRecord.voucherNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Voucher Date', value: new Date(viewRecord.voucherDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { label: 'Payment Against', value: viewRecord.paymentAgainst },
                  { label: 'Party Name', value: viewRecord.partyName },
                  { label: 'Status', value: viewRecord.status },
                ].map(({ label, value }) => (
                  <div key={label} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-4 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Reference</p>
                <div className="flex justify-between border-b pb-1.5"><span className="text-muted-foreground">Invoice No.</span><span className="font-mono">{viewRecord.referenceInvoice}</span></div>
                {viewRecord.referenceDate && <div className="flex justify-between border-b pb-1.5"><span className="text-muted-foreground">Invoice Date</span><span>{new Date(viewRecord.referenceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>}
              </div>

              <div className="border rounded-lg divide-y">
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Invoice Total</span><span className="font-medium">{fmtINR(viewRecord.invoiceAmount)}</span></div>
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Previously Paid</span><span>{fmtINR(viewRecord.previouslyPaid)}</span></div>
                <div className="flex justify-between px-4 py-2.5 bg-emerald-50"><span className="font-medium text-emerald-700">Paid Now</span><span className="font-bold text-emerald-700">{fmtINR(viewRecord.amountPaid)}</span></div>
                <div className="flex justify-between px-4 py-2.5 bg-red-50"><span className="font-medium text-red-700">Balance</span><span className="font-bold text-red-700">{viewRecord.balance > 0 ? fmtINR(viewRecord.balance) : 'Fully Paid'}</span></div>
              </div>

              <div className="border rounded-lg p-4 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Payment Details</p>
                {[
                  { label: 'Mode', value: viewRecord.paymentMode },
                  viewRecord.bankName ? { label: 'Bank', value: viewRecord.bankName } : null,
                  viewRecord.chequeNumber ? { label: 'Cheque No.', value: viewRecord.chequeNumber } : null,
                  viewRecord.chequeDate ? { label: 'Cheque Date', value: new Date(viewRecord.chequeDate).toLocaleDateString('en-GB') } : null,
                  viewRecord.transactionRef ? { label: 'Transaction Ref.', value: viewRecord.transactionRef } : null,
                ].filter(Boolean).map(item => item && (
                  <div key={item.label} className="flex justify-between border-b pb-1.5 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono">{item.value}</span>
                  </div>
                ))}
              </div>

              {viewRecord.narration && (
                <div className="border rounded-lg p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Narration</p>
                  <p>{viewRecord.narration}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
