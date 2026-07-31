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
import {
  FlaskConical,
  Plus,
  Calendar,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Download,
  FileDown,
  CheckSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Loader2,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FuelTestRecord,
  fetchFuelTests,
  createFuelTestApi,
  updateFuelTestApi,
  deleteFuelTestApi,
  fetchNextFuelTestReportNoApi,
  fetchProducts,
  fetchTanks,
  fetchEmployees,
  Employee
} from '../services/api';

const doesTankMatchProduct = (tank: any, productName: string) => {
  if (!tank || !tank.fuelType || !productName) return false;
  const tType = tank.fuelType.toLowerCase();
  const pName = productName.toLowerCase();

  if (tType === pName) return true;

  if (tType === 'petrol' && !pName.includes('diesel')) return true;
  if (tType === 'diesel' && pName.includes('diesel')) return true;

  if (pName === 'petrol' && !tType.includes('diesel')) return true;
  if (pName === 'diesel' && tType.includes('diesel')) return true;

  return false;
};

export function FuelTesting() {
  // ── State variables ──
  const [records, setRecords] = useState<FuelTestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filters & Search ──
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<string>('testDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Master lists
  const [products, setProducts] = useState<any[]>([]);
  const [tanks, setTanks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const defaultProducts = [
    { id: '1', name: 'Petrol (Motor Spirit)' },
    { id: '2', name: 'Diesel (High Speed Diesel)' }
  ];

  const defaultTanks = [
    { id: '1', tankName: 'Tank 1', fuelType: 'Petrol' },
    { id: '2', tankName: 'Tank 2', fuelType: 'Petrol' },
    { id: '3', tankName: 'Tank 3', fuelType: 'Diesel' },
    { id: '4', tankName: 'Tank 4', fuelType: 'Diesel' }
  ];

  const activeProducts = products.length > 0 ? products : defaultProducts;
  const activeTanks = tanks.length > 0 ? tanks : defaultTanks;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Dialogs
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  // Confirm Delete Dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FuelTestRecord | null>(null);

  // Form State
  const [form, setForm] = useState({
    testReportNo: '',
    testDate: new Date().toISOString().split('T')[0],
    testTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    testedBy: '',
    fuelType: 'Petrol' as 'Petrol' | 'Diesel',
    selectedProduct: 'Petrol (Motor Spirit)',
    tankNo: 'Tank 1',
    density: '',
    temperature: '',
    flashPoint: '',
    waterContent: '0.00',
    sediment: '0.00',
    color: 'Clear' as 'Clear' | 'Slightly Turbid' | 'Turbid' | 'Contaminated',
    testResult: 'Pass' as 'Pass' | 'Fail' | 'Warning',
    remarks: '',
    authorizedBy: '',
    approvedBy: '',
    testEquipmentNo: '',
    referenceStandard: 'IS 2796'
  });

  // Load records from backend API
  const loadFuelTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchFuelTests({
        search: searchTerm,
        fuelType: fuelTypeFilter,
        testResult: resultFilter,
        fromDate: fromDateFilter,
        toDate: toDateFilter,
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDir
      });
      setRecords(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fuel test records from server');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, fuelTypeFilter, resultFilter, fromDateFilter, toDateFilter, currentPage, pageSize, sortBy, sortDir]);

  useEffect(() => {
    loadFuelTests();
  }, [loadFuelTests]);

  // Load master products, tanks, & employees on mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [prodRes, tankRes, empRes] = await Promise.all([
          fetchProducts({ size: 1000, category: 'Fuel' }),
          fetchTanks({ size: 1000 }),
          fetchEmployees({ size: 1000, status: 'Active' })
        ]);
        setProducts(prodRes.content);
        setTanks(tankRes.content);
        setEmployees(empRes.content);
      } catch (err) {
        console.error("Failed to load products/tanks/employees data: ", err);
      }
    };
    loadMasterData();
  }, []);

  // Automatically update reference standard based on fuel type
  useEffect(() => {
    if (form.fuelType === 'Petrol') {
      setForm(prev => ({ ...prev, referenceStandard: 'IS 2796' }));
    } else {
      setForm(prev => ({ ...prev, referenceStandard: 'IS 1460' }));
    }
  }, [form.fuelType]);

  // Dynamic Parameter Checking & Auto-Result Warning
  const densityWarning = useMemo(() => {
    const densVal = parseFloat(form.density);
    if (isNaN(densVal)) return '';
    if (form.fuelType === 'Petrol') {
      if (densVal < 720 || densVal > 775) {
        return `Density is out of standard limits for Petrol (Standard: 720 - 775 kg/m³ at 15°C)`;
      }
    } else {
      if (densVal < 820 || densVal > 845) {
        return `Density is out of standard limits for Diesel (Standard: 820 - 845 kg/m³ at 15°C)`;
      }
    }
    return '';
  }, [form.density, form.fuelType]);

  const flashPointWarning = useMemo(() => {
    if (form.fuelType !== 'Diesel') return '';
    const fp = parseFloat(form.flashPoint);
    if (isNaN(fp)) return '';
    if (fp < 52) {
      return `Flash Point is critically low for Diesel (Standard: >= 52°C)`;
    }
    return '';
  }, [form.flashPoint, form.fuelType]);

  const waterWarning = useMemo(() => {
    const water = parseFloat(form.waterContent);
    if (isNaN(water)) return '';
    if (water > 0.05) {
      return `Water content is high (Standard max: 0.05%)`;
    }
    return '';
  }, [form.waterContent]);

  // Stats Computations
  const stats = useMemo(() => {
    const total = totalElements;
    const passed = records.filter(r => r.testResult === 'Pass').length;
    const failed = records.filter(r => r.testResult === 'Fail').length;
    const warnings = records.filter(r => r.testResult === 'Warning').length;

    const densitySum = records.reduce((sum, r) => sum + r.density, 0);
    const avgDensity = records.length > 0 ? (densitySum / records.length).toFixed(1) : '0.0';

    return { total, passed, failed, warnings, avgDensity };
  }, [records, totalElements]);

  // Sort helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return <span className="ml-1 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(records.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const getProductSelectValue = () => {
    const matched = activeProducts.find(p => {
      const isDiesel = p.name.toLowerCase().includes('diesel');
      return form.fuelType === 'Diesel' ? isDiesel : !isDiesel;
    });
    return matched ? matched.name : (form.fuelType === 'Diesel' ? 'Diesel (High Speed Diesel)' : 'Petrol (Motor Spirit)');
  };

  const handleProductChange = (productName: string) => {
    const isDiesel = productName.toLowerCase().includes('diesel');
    const backendVal = isDiesel ? 'Diesel' : 'Petrol';
    const matchingTanks = activeTanks.filter(t => doesTankMatchProduct(t, productName));
    const firstTankName = matchingTanks.length > 0 ? matchingTanks[0].tankName : '';
    setForm(prev => ({
      ...prev,
      fuelType: backendVal,
      selectedProduct: productName,
      tankNo: firstTankName
    }));
  };

  // Form Trigger Handlers
  const handleAddNew = async () => {
    setModalMode('add');
    setActiveRecordId(null);
    const today = new Date().toISOString().split('T')[0];
    let nextReportNo = '';
    try {
      nextReportNo = await fetchNextFuelTestReportNoApi(today);
    } catch {
      nextReportNo = '';
    }

    const defaultProduct = activeProducts.find(p => !p.name.toLowerCase().includes('diesel'))?.name || 'Petrol (Motor Spirit)';
    const matchingTanks = activeTanks.filter(t => doesTankMatchProduct(t, defaultProduct));
    const firstTankName = matchingTanks.length > 0 ? matchingTanks[0].tankName : 'Tank 1';

    setForm({
      testReportNo: nextReportNo,
      testDate: today,
      testTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      testedBy: '',
      fuelType: 'Petrol',
      selectedProduct: defaultProduct,
      tankNo: firstTankName,
      density: '',
      temperature: '',
      flashPoint: '',
      waterContent: '0.00',
      sediment: '0.00',
      color: 'Clear',
      testResult: 'Pass',
      remarks: '',
      authorizedBy: '',
      approvedBy: '',
      testEquipmentNo: '',
      referenceStandard: 'IS 2796'
    });
    setShowModal(true);
  };

  const handleEdit = (record: FuelTestRecord) => {
    setModalMode('edit');
    setActiveRecordId(record.id);
    const matchedTank = activeTanks.find(t => t.tankName === record.tankNo);
    const selectedProd = matchedTank
      ? matchedTank.fuelType
      : (record.fuelType === 'Diesel'
        ? (activeProducts.find(p => p.name.toLowerCase().includes('diesel'))?.name || 'Diesel (High Speed Diesel)')
        : (activeProducts.find(p => !p.name.toLowerCase().includes('diesel'))?.name || 'Petrol (Motor Spirit)'));

    setForm({
      testReportNo: record.testReportNo,
      testDate: record.testDate,
      testTime: record.testTime,
      testedBy: record.testedBy,
      fuelType: record.fuelType,
      selectedProduct: selectedProd,
      tankNo: record.tankNo,
      density: String(record.density),
      temperature: String(record.temperature),
      flashPoint: record.flashPoint != null ? String(record.flashPoint) : '',
      waterContent: String(record.waterContent),
      sediment: String(record.sediment),
      color: record.color,
      testResult: record.testResult,
      remarks: record.remarks,
      authorizedBy: record.authorizedBy,
      approvedBy: record.approvedBy,
      testEquipmentNo: record.testEquipmentNo,
      referenceStandard: record.referenceStandard
    });
    setShowModal(true);
  };

  const handleView = (record: FuelTestRecord) => {
    setModalMode('view');
    setActiveRecordId(record.id);
    const matchedTank = activeTanks.find(t => t.tankName === record.tankNo);
    const selectedProd = matchedTank
      ? matchedTank.fuelType
      : (record.fuelType === 'Diesel'
        ? (activeProducts.find(p => p.name.toLowerCase().includes('diesel'))?.name || 'Diesel (High Speed Diesel)')
        : (activeProducts.find(p => !p.name.toLowerCase().includes('diesel'))?.name || 'Petrol (Motor Spirit)'));

    setForm({
      testReportNo: record.testReportNo,
      testDate: record.testDate,
      testTime: record.testTime,
      testedBy: record.testedBy,
      fuelType: record.fuelType,
      selectedProduct: selectedProd,
      tankNo: record.tankNo,
      density: String(record.density),
      temperature: String(record.temperature),
      flashPoint: record.flashPoint != null ? String(record.flashPoint) : '',
      waterContent: String(record.waterContent),
      sediment: String(record.sediment),
      color: record.color,
      testResult: record.testResult,
      remarks: record.remarks,
      authorizedBy: record.authorizedBy,
      approvedBy: record.approvedBy,
      testEquipmentNo: record.testEquipmentNo,
      referenceStandard: record.referenceStandard
    });
    setShowModal(true);
  };

  const handleDeleteClick = (record: FuelTestRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      setIsSubmitting(true);
      try {
        await deleteFuelTestApi(recordToDelete.id);
        toast.success(`Test report ${recordToDelete.testReportNo || recordToDelete.id} deleted successfully.`);
        setShowDeleteConfirm(false);
        setRecordToDelete(null);
        loadFuelTests();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete fuel test record');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.testedBy || !form.density || !form.temperature) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<FuelTestRecord, 'id'> = {
        testReportNo: form.testReportNo,
        testDate: form.testDate,
        testTime: form.testTime,
        testedBy: form.testedBy,
        fuelType: form.fuelType,
        tankNo: form.tankNo,
        density: parseFloat(form.density),
        temperature: parseFloat(form.temperature),
        flashPoint: form.flashPoint ? parseFloat(form.flashPoint) : undefined,
        waterContent: parseFloat(form.waterContent) || 0,
        sediment: parseFloat(form.sediment) || 0,
        color: form.color,
        testResult: form.testResult,
        remarks: form.remarks,
        authorizedBy: form.authorizedBy,
        approvedBy: form.approvedBy,
        testEquipmentNo: form.testEquipmentNo,
        referenceStandard: form.referenceStandard
      };

      if (modalMode === 'add') {
        const created = await createFuelTestApi(payload);
        toast.success(`Successfully saved test report ${created.testReportNo || created.id}.`);
      } else if (activeRecordId) {
        const updated = await updateFuelTestApi(activeRecordId, payload);
        toast.success(`Successfully updated test report ${updated.testReportNo || updated.id}.`);
      }

      setShowModal(false);
      loadFuelTests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save fuel test report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export handlers
  const handleExportAll = (format: 'csv' | 'excel' | 'pdf') => {
    toast.success(`Exporting all records as ${format.toUpperCase()}...`);
  };

  const handleExportSelected = (format: 'csv' | 'excel' | 'pdf') => {
    toast.success(`Exporting ${selectedIds.size} selected records as ${format.toUpperCase()}...`);
  };

  const getResultBadge = (result: 'Pass' | 'Fail' | 'Warning') => {
    switch (result) {
      case 'Pass':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">Pass</Badge>;
      case 'Fail':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-medium">Fail</Badge>;
      case 'Warning':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">Warning</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Daily Operation - Fuel Testing
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Log, verify, and track daily laboratory testing parameters for Petrol & Diesel products.
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2 shrink-0 shadow-sm" id="btn-add-fuel-test">
          <Plus className="w-4 h-4" /> Add Test Report
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Tests Done</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-emerald-600">{stats.passed}</p>
            <p className="text-xs text-muted-foreground">Passed Standards (Page)</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-amber-600">{stats.warnings + stats.failed}</p>
            <p className="text-xs text-muted-foreground">Alerts / Failures (Page)</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100">
            <Gauge className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{stats.avgDensity} kg/m³</p>
            <p className="text-xs text-muted-foreground">Avg. Density (Page)</p>
          </div>
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search report no, tester, equipment, tank or remarks..."
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

        {/* Fuel Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Fuel</label>
          <Select value={fuelTypeFilter} onValueChange={v => { setFuelTypeFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Fuels</SelectItem>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Result Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Result</label>
          <Select value={resultFilter} onValueChange={v => { setResultFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Results</SelectItem>
              <SelectItem value="Pass">Pass</SelectItem>
              <SelectItem value="Fail">Fail</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
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

      {/* ── Main Tabular Grid ── */}
      <Card className="overflow-hidden border-border rounded-xl bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading fuel test records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <FlaskConical className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No test reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="w-12 text-center p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === records.length && records.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="w-14 text-left px-4 py-3 font-medium text-muted-foreground">S.No</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('testReportNo')}>
                      Report No <SortIcon field="testReportNo" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('testDate')}>
                      Date/Time <SortIcon field="testDate" />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fuel / Tank</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tested By</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Density (kg/m³)</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Temp (°C)</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Water / Sediment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Result</th>
                    <th className="w-32 px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr key={rec.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      <td className="text-center p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(rec.id)}
                          onChange={() => handleSelectOne(rec.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {currentPage * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-semibold text-primary">
                        {rec.testReportNo || `FT-${rec.id}`}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold">{rec.testDate}</span>
                          <span className="text-[10px] text-muted-foreground">{rec.testTime}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold">{rec.fuelType}</span>
                          <span className="text-[10px] text-muted-foreground">{rec.tankNo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {rec.testedBy}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-xs">
                        {rec.density.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {rec.temperature.toFixed(1)}°C
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-col">
                          <span>W: {rec.waterContent}%</span>
                          <span className="text-[10px] text-muted-foreground">S: {rec.sediment}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getResultBadge(rec.testResult)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View" onClick={() => handleView(rec)}>
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit" onClick={() => handleEdit(rec)}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" title="Delete" onClick={() => handleDeleteClick(rec)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 border-t border-border text-xs font-semibold">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-left">
                      Page Total ({records.length} records)
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      Avg: {stats.avgDensity}
                    </td>
                    <td colSpan={4} className="px-4 py-3 text-muted-foreground text-left pl-6">
                      Total Entries: <span className="font-mono text-foreground font-bold">{totalElements}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── Table Footer Pagination ── */}
          {records.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} entries
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
          ADD / EDIT / VIEW DIALOG MODAL
      ════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '95vw', width: '900px', height: '88vh', maxHeight: '88vh' }}
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <FlaskConical className="w-5 h-5 text-primary" />
              {modalMode === 'add' ? 'Record Fuel Quality Test' : modalMode === 'edit' ? 'Edit Quality Test Report' : 'Quality Test Report Details'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {modalMode === 'view' ? 'Review fuel testing parameters against standards.' : 'Input daily laboratory testing parameters to certify product standards.'}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Body Form */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6 space-y-6">

              {/* Row 1: Header Meta */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ft-reportNo" className="text-xs font-medium">Test Report No.</Label>
                  <Input id="ft-reportNo" value={form.testReportNo} readOnly placeholder="Auto-generated" className="h-9 text-xs font-mono bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ft-date" className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</Label>
                  <Input id="ft-date" type="date" value={form.testDate} onChange={e => setForm(p => ({ ...p, testDate: e.target.value }))} disabled={modalMode === 'view'} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ft-time" className="text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Time (IST)</Label>
                  <Input id="ft-time" type="time" value={form.testTime} onChange={e => setForm(p => ({ ...p, testTime: e.target.value }))} disabled={modalMode === 'view'} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ft-tester" className="text-xs font-medium">Tested By <span className="text-red-500 font-bold">*</span></Label>
                  <Input id="ft-tester" placeholder="Staff member name" value={form.testedBy} onChange={e => setForm(p => ({ ...p, testedBy: e.target.value }))} disabled={modalMode === 'view'} className="h-9 text-xs" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Fuel Product Type</Label>
                  <Select
                    value={form.selectedProduct || getProductSelectValue()}
                    onValueChange={v => {
                      handleProductChange(v);
                    }}
                    disabled={modalMode === 'view'}
                  >
                    <SelectTrigger id="ft-fuelType" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProducts.map(p => (
                        <SelectItem key={p.id} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Source Tank</Label>
                  <Select
                    value={form.tankNo}
                    onValueChange={v => setForm(p => ({ ...p, tankNo: v }))}
                    disabled={modalMode === 'view'}
                  >
                    <SelectTrigger id="ft-tankNo" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTanks
                        .filter(t => doesTankMatchProduct(t, form.selectedProduct || getProductSelectValue()))
                        .map(t => (
                          <SelectItem key={t.id} value={t.tankName}>
                            {t.tankName} ({t.fuelType})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 font-mono">
                  <Label htmlFor="ft-refStandard" className="text-xs font-medium">Reference Code / Standard</Label>
                  <Input id="ft-refStandard" value={form.referenceStandard} disabled className="h-9 text-xs bg-muted" />
                </div>
              </div>

              {/* Parameter Specifications Section */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Test Parameters</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Density Input */}
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="ft-density" className="text-xs font-medium">Density @ 15°C (kg/m³) <span className="text-red-500 font-bold">*</span></Label>
                    <Input
                      id="ft-density"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 745.0"
                      value={form.density}
                      onChange={e => setForm(p => ({ ...p, density: e.target.value }))}
                      onWheel={e => e.currentTarget.blur()}
                      disabled={modalMode === 'view'}
                      className={`h-9 text-xs font-mono ${densityWarning ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
                      required
                    />
                    {densityWarning && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-start gap-1 mt-1 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{densityWarning}</span>
                      </span>
                    )}
                  </div>

                  {/* Temperature Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ft-temp" className="text-xs font-medium">Measured Temp (°C) <span className="text-red-500 font-bold">*</span></Label>
                    <Input
                      id="ft-temp"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 25.0"
                      value={form.temperature}
                      onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))}
                      onWheel={e => e.currentTarget.blur()}
                      disabled={modalMode === 'view'}
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  {/* Flash Point Input (Only for Diesel) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ft-flash" className="text-xs font-medium flex items-center justify-between">
                      <span>Flash Point (°C)</span>
                      {form.fuelType === 'Petrol' && <span className="text-[10px] text-muted-foreground font-normal">(N/A for Petrol)</span>}
                    </Label>
                    <Input
                      id="ft-flash"
                      type="number"
                      placeholder={form.fuelType === 'Diesel' ? 'Standard >= 52°C' : 'N/A'}
                      value={form.fuelType === 'Diesel' ? form.flashPoint : ''}
                      onChange={e => setForm(p => ({ ...p, flashPoint: e.target.value }))}
                      onWheel={e => e.currentTarget.blur()}
                      disabled={modalMode === 'view' || form.fuelType === 'Petrol'}
                      className={`h-9 text-xs font-mono ${flashPointWarning ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
                    />
                    {flashPointWarning && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-start gap-1 mt-1 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{flashPointWarning}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Water Content */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ft-water" className="text-xs font-medium">Water Content (%)</Label>
                    <Input
                      id="ft-water"
                      type="number"
                      step="0.001"
                      value={form.waterContent}
                      onChange={e => setForm(p => ({ ...p, waterContent: e.target.value }))}
                      onWheel={e => e.currentTarget.blur()}
                      disabled={modalMode === 'view'}
                      className={`h-9 text-xs font-mono ${waterWarning ? 'border-amber-400 focus-visible:ring-amber-400' : ''}`}
                    />
                    {waterWarning && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-start gap-1 mt-1 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{waterWarning}</span>
                      </span>
                    )}
                  </div>

                  {/* Sediment Content */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ft-sediment" className="text-xs font-medium">Sediment (%)</Label>
                    <Input
                      id="ft-sediment"
                      type="number"
                      step="0.001"
                      value={form.sediment}
                      onChange={e => setForm(p => ({ ...p, sediment: e.target.value }))}
                      onWheel={e => e.currentTarget.blur()}
                      disabled={modalMode === 'view'}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  {/* Appearance Color Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Appearance & Color</Label>
                    <Select
                      value={form.color}
                      onValueChange={v => setForm(p => ({ ...p, color: v as any }))}
                      disabled={modalMode === 'view'}
                    >
                      <SelectTrigger id="ft-color" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Clear">Clear / Transparent</SelectItem>
                        <SelectItem value="Slightly Turbid">Slightly Turbid</SelectItem>
                        <SelectItem value="Turbid">Turbid / Cloudy</SelectItem>
                        <SelectItem value="Contaminated">Contaminated / Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Signatures & Certification details */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Signatures & Verification</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ft-equipment" className="text-xs font-medium">Test Hydrometer / Equipment No.</Label>
                    <Input id="ft-equipment" placeholder="e.g. EQ-PET-08" value={form.testEquipmentNo} onChange={e => setForm(p => ({ ...p, testEquipmentNo: e.target.value }))} disabled={modalMode === 'view'} className="h-9 text-xs font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ft-authorized" className="text-xs font-medium">Authorized Signature By</Label>
                    {modalMode === 'view' ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-xs">{form.authorizedBy || '-'}</div>
                    ) : (
                      <Select value={form.authorizedBy} onValueChange={v => setForm(prev => ({ ...prev, authorizedBy: v }))}>
                        <SelectTrigger id="ft-authorized" className="h-9 text-xs">
                          <SelectValue placeholder={employees.length === 0 ? 'No employees' : '-- Select Employee --'} />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.length === 0 ? (
                            <SelectItem value="-" disabled>No active employees found.</SelectItem>
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
                    <Label htmlFor="ft-approved" className="text-xs font-medium">Approved By</Label>
                    {modalMode === 'view' ? (
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-xs">{form.approvedBy || '-'}</div>
                    ) : (
                      <Select value={form.approvedBy} onValueChange={v => setForm(prev => ({ ...prev, approvedBy: v }))}>
                        <SelectTrigger id="ft-approved" className="h-9 text-xs">
                          <SelectValue placeholder={employees.length === 0 ? 'No employees' : '-- Select Employee --'} />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.length === 0 ? (
                            <SelectItem value="-" disabled>No active employees found.</SelectItem>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="ft-remarks" className="text-xs font-medium">Remarks / Recommendations</Label>
                    <Textarea id="ft-remarks" placeholder="Add observations, standard discrepancies or corrective actions..." value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} disabled={modalMode === 'view'} rows={3} className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-blue-500/70 dark:text-blue-400/60 font-semibold">Standard Certification Result</Label>
                    <Select
                      value={form.testResult}
                      onValueChange={v => setForm(p => ({ ...p, testResult: v as any }))}
                      disabled={modalMode === 'view'}
                    >
                      <SelectTrigger id="ft-testResult" className="h-9 text-xs font-medium border-blue-200/30 text-blue-600/70 dark:text-blue-400/75 bg-blue-50/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pass">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Pass - Certified Standards</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="Warning">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                            <span>Warning - Borderline Tolerance</span>
                          </span>
                        </SelectItem>
                        <SelectItem value="Fail">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                            <span>Fail - Substandard Quality</span>
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <DialogFooter className="px-6 py-4 border-t border-border shrink-0 bg-muted/40">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="text-xs h-9">
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {modalMode !== 'view' && (
                <Button type="submit" disabled={isSubmitting} className="text-xs h-9 bg-primary gap-2">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {modalMode === 'add' ? 'Save Test Report' : 'Save Changes'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-base">
              <ShieldAlert className="w-5 h-5" /> Delete Test Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to permanently delete fuel quality test report <strong>{recordToDelete?.testReportNo || recordToDelete?.id}</strong>? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={isSubmitting} onClick={confirmDelete} className="gap-2">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
