import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  IndianRupee,
  Plus,
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  Download,
  FileDown,
  CheckSquare,
  Loader2,
  CalendarDays,
  Coins,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  fetchEmployees,
  fetchCashCollections,
  fetchCashCollectionStats,
  createCashCollection,
  updateCashCollection,
  deleteCashCollection,
  formatDateToDMY,
  Employee,
  CashCollectionRecord,
  CashCollectionStats,
  API_BASE_URL,
  fetchMpdsAll,
  fetchShiftsAll,
  fetchEmployeeAssignments,
  ShiftMaster,
  EmployeeAssignment
} from '../services/api';
import { toast } from 'sonner';
import { getActiveShiftNameFromMaster } from './FuelSaleForm';
import { resolveMpdNameFromList, isStrictMpdMatch, isSameShift } from '../utils/mpdUtils';

export interface CashCollectionProps {
  isEmbedded?: boolean;
  prefilledMpdName?: string;
  onCloseModal?: () => void;
  onTotalChange?: (total: number) => void;
  selectedDate?: string;
  selectedShift?: string;
  scopeMode?: 'shift' | 'day' | 'overall';
}

export function CashCollection({
  isEmbedded = false,
  prefilledMpdName = '',
  onCloseModal,
  onTotalChange,
  selectedDate,
  selectedShift,
  scopeMode = 'overall'
}: CashCollectionProps = {}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mpds, setMpds] = useState<any[]>([]);
  const [shifts, setShifts] = useState<ShiftMaster[]>([]);
  const [dutyAssignments, setDutyAssignments] = useState<EmployeeAssignment[]>([]);
  const [records, setRecords] = useState<CashCollectionRecord[]>([]);
  const [stats, setStats] = useState<CashCollectionStats>({
    totalAmount: 0,
    totalEntries: 0,
    avgCollection: 0
  });

  const [loading, setLoading] = useState(false);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [loadingDuty, setLoadingDuty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for API
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Checkbox selections for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Dialogs state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<CashCollectionRecord | null>(null);

  // Form states
  const [formRecord, setFormRecord] = useState<any>({
    date: new Date().toISOString().slice(0, 10),
    shift: '',
    shiftId: '',
    employeeId: '',
    employeeName: '',
    dutyNozzle: '',
    shiftTiming: '',
    depositAmount: '',
    notes: '',
    notes500: 0,
    notes200: 0,
    notes100: 0,
    notes50: 0,
    notes20: 0,
    notes10: 0,
    coins: 0.0
  });

  // Calculate form totals
  const calculateFormTotal = () => {
    return (
      (Number((formRecord as any).notes500 || 0) * 500) +
      (Number((formRecord as any).notes200 || 0) * 200) +
      (Number((formRecord as any).notes100 || 0) * 100) +
      (Number((formRecord as any).notes50 || 0) * 50) +
      (Number((formRecord as any).notes20 || 0) * 20) +
      (Number((formRecord as any).notes10 || 0) * 10) +
      (Number((formRecord as any).coins || 0) || 0)
    );
  };

  // Load master data once on mount
  useEffect(() => {
    async function loadMaster() {
      setLoadingMaster(true);
      try {
        const [empData, mpdData, shiftData] = await Promise.all([
          fetchEmployees({ size: 1000, status: 'Active' }),
          fetchMpdsAll(),
          fetchShiftsAll()
        ]);
        setEmployees(empData?.content || []);
        setMpds(mpdData || []);
        setShifts(shiftData || []);
      } catch (err: any) {
        console.error('Failed to load master data for CashCollection:', err);
      } finally {
        setLoadingMaster(false);
      }
    }
    loadMaster();
  }, []);

  // Fetch duty assignments for current date & shift whenever form date or shiftId changes
  useEffect(() => {
    if (!formRecord.date || !formRecord.shiftId) return;
    const loadDuty = async () => {
      setLoadingDuty(true);
      try {
        const dutyRes = await fetchEmployeeAssignments(formRecord.date, formRecord.shiftId);
        setDutyAssignments(dutyRes);
      } catch {
        setDutyAssignments([]);
      } finally {
        setLoadingDuty(false);
      }
    };
    loadDuty();
  }, [formRecord.date, formRecord.shiftId]);

  // ── Prefilled MPD Resolution Effect ──
  const [resolvedMpdName, setResolvedMpdName] = useState(() => resolveMpdNameFromList(prefilledMpdName, mpds));

  useEffect(() => {
    if (prefilledMpdName) {
      setResolvedMpdName(resolveMpdNameFromList(prefilledMpdName, mpds));
    }
  }, [prefilledMpdName, mpds]);

  const isAssignmentForMpd = useCallback((d: any, targetMpdId: string) => {
    if (!targetMpdId || !d) return false;
    if (String(d.mpdId) === String(targetMpdId)) return true;

    const selectedMpd = mpds.find(m => String(m.id) === String(targetMpdId) || m.mpdName.toLowerCase() === targetMpdId.toLowerCase());
    if (selectedMpd) {
      if (d.mpdName && isStrictMpdMatch(d.mpdName, selectedMpd.mpdName)) return true;
      if (d.nozzle?.mpd?.name && isStrictMpdMatch(d.nozzle.mpd.name, selectedMpd.mpdName)) return true;
      if (d.nozzle?.mpd?.id && String(d.nozzle.mpd.id) === String(selectedMpd.id)) return true;
    }

    if (d.mpdName && isStrictMpdMatch(d.mpdName, targetMpdId)) return true;
    return false;
  }, [mpds]);

  const availableEmployees = useMemo(() => {
    const activeMpdId = formRecord.mpdId || (resolvedMpdName ? mpds.find(m => isStrictMpdMatch(m.mpdName, resolvedMpdName))?.id : '');

    let list = employees;
    if (activeMpdId) {
      const mpdDutyAssignments = dutyAssignments.filter(d => d.employeeId && isAssignmentForMpd(d, String(activeMpdId)));
      const assignedEmpIds = new Set(mpdDutyAssignments.map(d => String(d.employeeId)));

      if (assignedEmpIds.size > 0) {
        list = employees.filter(e => assignedEmpIds.has(String(e.id)));
      }
    } else if (dutyAssignments.length > 0) {
      const dutyEmpIds = new Set(dutyAssignments.map(d => String(d.employeeId)).filter(Boolean));
      if (dutyEmpIds.size > 0) {
        list = employees.filter(e => dutyEmpIds.has(String(e.id)));
      }
    }

    const seen = new Set();
    return list.filter(e => {
      const id = String(e.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [employees, dutyAssignments, formRecord.mpdId, resolvedMpdName, mpds, isAssignmentForMpd]);

  useEffect(() => {
    if (formRecord.mpdId && availableEmployees.length > 0) {
      const isCurrentEmpInList = availableEmployees.some(e => String(e.id) === String(formRecord.employeeId));
      if (!isCurrentEmpInList && availableEmployees.length > 0) {
        setFormRecord((prev: any) => ({ ...prev, employeeId: String(availableEmployees[0].id) }));
      }
    }
  }, [formRecord.mpdId, availableEmployees]);

  // Fetch paginated collections + stats
  const loadData = useCallback(async () => {
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
        search: searchTerm,
        shift: shiftFilter,
        fromDate: activeFromDate || undefined,
        toDate: activeToDate || undefined,
        sortBy,
        sortDir
      };

      const recordsRes = await fetchCashCollections(fetchParams);

      let filteredContent = recordsRes.content;
      if (isEmbedded && resolvedMpdName) {
        let filtered = recordsRes.content.filter(r => {
          const mpdStr = r.mpdName || (r as any).mpd || (r as any).mpdId || (r as any).dispenser || '';
          const mpdOk = isStrictMpdMatch(mpdStr, resolvedMpdName);
          const shiftOk = (scopeMode === 'shift' && selectedShift)
            ? (!r.shift || isSameShift(r.shift, selectedShift))
            : true;
          return mpdOk && shiftOk;
        });

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
        setTotalPages(recordsRes.totalPages);
        setTotalElements(recordsRes.totalElements);
      }

      // Fetch stats
      const statsRes = await fetchCashCollectionStats({
        search: searchTerm,
        shift: shiftFilter,
        fromDate: activeFromDate || undefined,
        toDate: activeToDate || undefined
      });

      // Calculate stats based on filtered results if embedded
      if (isEmbedded && resolvedMpdName) {
        const allRecordsRes = await fetchCashCollections({
          page: 0,
          size: 100000,
          search: searchTerm,
          shift: shiftFilter,
          mpd: resolvedMpdName,
          fromDate: activeFromDate || undefined,
          toDate: activeToDate || undefined,
          sortBy,
          sortDir
        });
        let allFiltered = allRecordsRes.content.filter(r => {
          const mpdStr = r.mpdName || (r as any).mpd || (r as any).mpdId || (r as any).dispenser || '';
          const mpdOk = isStrictMpdMatch(mpdStr, resolvedMpdName);
          const shiftOk = (scopeMode === 'shift' && selectedShift)
            ? (!r.shift || isSameShift(r.shift, selectedShift))
            : true;
          return mpdOk && shiftOk;
        });
        const totalAmount = allFiltered.reduce((sum, r) => sum + (r.depositAmount || 0), 0);
        const totalEntries = allFiltered.length;
        setStats({
          totalAmount,
          totalEntries,
          avgCollection: totalEntries > 0 ? (totalAmount / totalEntries) : 0
        });
      } else {
        setStats(statsRes);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch cash collection records');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, shiftFilter, fromDateFilter, toDateFilter, sortBy, sortDir, isEmbedded, resolvedMpdName, scopeMode, selectedDate, selectedShift]);

  // Trigger reload on filter/page/sort changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (onTotalChange) {
      const sum = isEmbedded && stats.totalAmount !== undefined ? stats.totalAmount : records.reduce((acc, curr) => acc + (curr.depositAmount || 0), 0);
      onTotalChange(sum);
    }
  }, [records, stats, isEmbedded, onTotalChange]);

  useEffect(() => {
    if (isEmbedded && resolvedMpdName) {
      setCurrentPage(0);
    }
  }, [isEmbedded, resolvedMpdName]);

  // Denomination input change handler
  const handleDenominationChange = (field: string, value: string) => {
    const num = parseFloat(value) || 0;
    setFormRecord((prev: any) => ({
      ...prev,
      [field]: num < 0 ? 0 : num
    }));
  };

  // Indian Rupee currency format helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Init Form for New Entry
  const handleAddNewClick = () => {
    setModalMode('add');
    setActiveRecordId(null);

    let defaultMpdId = '';
    const targetMpdName = resolvedMpdName || prefilledMpdName;
    if (targetMpdName && mpds.length > 0) {
      const matchNumber = targetMpdName.match(/\d+/);
      const targetNum = matchNumber ? matchNumber[0] : '';
      const found = mpds.find(m =>
        m.mpdName.toLowerCase() === targetMpdName.toLowerCase() ||
        (targetNum && m.mpdName.match(/\d+/)?.[0] === targetNum)
      );
      if (found) {
        defaultMpdId = found.id;
      }
    }

    let defaultShiftId = '';
    let defaultShiftName = '';
    if (shifts.length > 0) {
      let matchedShift = null;
      if (selectedShift) {
        matchedShift = shifts.find(s =>
          s.shiftName.toLowerCase() === selectedShift.toLowerCase() ||
          selectedShift.toLowerCase().includes(s.shiftName.toLowerCase()) ||
          s.shiftName.toLowerCase().includes(selectedShift.toLowerCase())
        );
      }
      if (!matchedShift) {
        const activeShiftName = getActiveShiftNameFromMaster(shifts);
        matchedShift = shifts.find(s => s.shiftName === activeShiftName) || shifts[0];
      }
      if (matchedShift) {
        defaultShiftId = matchedShift.id;
        defaultShiftName = `${matchedShift.shiftName} (${matchedShift.startTime}-${matchedShift.endTime})`;
      }
    }

    let autoEmpId = '';
    if (defaultMpdId && dutyAssignments.length > 0) {
      const duty = dutyAssignments.find(d => String(d.mpdId) === String(defaultMpdId) && d.employeeId);
      if (duty && duty.employeeId) autoEmpId = duty.employeeId;
    }

    setFormRecord({
      date: selectedDate || new Date().toISOString().slice(0, 10),
      shift: defaultShiftName,
      shiftId: defaultShiftId,
      employeeId: autoEmpId,
      mpdId: defaultMpdId,
      depositTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      notes500: 0,
      notes200: 0,
      notes100: 0,
      notes50: 0,
      notes20: 0,
      notes10: 0,
      coins: 0.0
    });
    setShowAddEditModal(true);
  };

  // Auto-fill missing shiftId, mpdId, employeeId on formRecord when master data loads
  useEffect(() => {
    setFormRecord((prev: any) => {
      let updated = false;
      const next = { ...prev };

      if (!next.shiftId && shifts.length > 0) {
        let matchedShift = null;
        if (selectedShift) {
          matchedShift = shifts.find(s =>
            s.shiftName.toLowerCase() === selectedShift.toLowerCase() ||
            selectedShift.toLowerCase().includes(s.shiftName.toLowerCase()) ||
            s.shiftName.toLowerCase().includes(selectedShift.toLowerCase())
          );
        }
        if (!matchedShift) {
          const activeShiftName = getActiveShiftNameFromMaster(shifts);
          matchedShift = shifts.find(s => s.shiftName === activeShiftName) || shifts[0];
        }
        if (matchedShift) {
          next.shiftId = matchedShift.id;
          next.shift = `${matchedShift.shiftName} (${matchedShift.startTime}-${matchedShift.endTime})`;
          updated = true;
        }
      }

      const targetMpdName = resolvedMpdName || prefilledMpdName;
      if (!next.mpdId && targetMpdName && mpds.length > 0) {
        const matchNumber = targetMpdName.match(/\d+/);
        const targetNum = matchNumber ? matchNumber[0] : '';
        const found = mpds.find(m =>
          m.mpdName.toLowerCase() === targetMpdName.toLowerCase() ||
          (targetNum && m.mpdName.match(/\d+/)?.[0] === targetNum)
        );
        if (found) {
          next.mpdId = found.id;
          updated = true;
        }
      }

      if (!next.employeeId && next.mpdId && dutyAssignments.length > 0) {
        const duty = dutyAssignments.find(d => String(d.mpdId) === String(next.mpdId) && d.employeeId);
        if (duty && duty.employeeId) {
          next.employeeId = duty.employeeId;
          updated = true;
        }
      }

      if (selectedDate && next.date !== selectedDate) {
        next.date = selectedDate;
        updated = true;
      }

      return updated ? next : prev;
    });
  }, [shifts, mpds, dutyAssignments, selectedShift, prefilledMpdName, resolvedMpdName, selectedDate]);

  // Init Form for Editing
  const handleEditClick = (record: CashCollectionRecord) => {
    setModalMode('edit');
    setActiveRecordId(record.id);
    const matchingShift = shifts.find(s => record.shift && record.shift.includes(s.shiftName));
    setFormRecord({
      date: record.date,
      shift: record.shift || '',
      shiftId: matchingShift ? matchingShift.id : '',
      employeeId: record.employeeId,
      mpdId: record.mpdId,
      depositTime: record.depositTime,
      notes500: record.notes500,
      notes200: record.notes200,
      notes100: record.notes100,
      notes50: record.notes50,
      notes20: record.notes20,
      notes10: record.notes10,
      coins: record.coins
    });
    setShowAddEditModal(true);
  };

  // Init Form for Viewing
  const handleViewClick = (record: CashCollectionRecord) => {
    setModalMode('view');
    setActiveRecordId(record.id);
    const matchingShift = shifts.find(s => record.shift && record.shift.includes(s.shiftName));
    setFormRecord({
      date: record.date,
      shift: record.shift || '',
      shiftId: matchingShift ? matchingShift.id : '',
      employeeId: record.employeeId,
      mpdId: record.mpdId,
      depositTime: record.depositTime,
      notes500: record.notes500,
      notes200: record.notes200,
      notes100: record.notes100,
      notes50: record.notes50,
      notes20: record.notes20,
      notes10: record.notes10,
      coins: record.coins
    });
    setShowAddEditModal(true);
  };

  // Init Delete Dialog
  const handleDeleteClick = (record: CashCollectionRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  // Confirm and delete entry
  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteCashCollection(recordToDelete.id);
      toast.success('Collection record deleted successfully');
      setShowDeleteConfirm(false);
      setRecordToDelete(null);

      // Update selected records set
      const newSelected = new Set(selectedIds);
      newSelected.delete(recordToDelete.id);
      setSelectedIds(newSelected);

      // Adjust page if necessary
      if (records.length === 1 && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      } else {
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete collection entry');
    }
  };

  // Save or Update Entry
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecord.shift) {
      toast.warning('Please select an operational shift');
      return;
    }
    if (!formRecord.mpdId) {
      toast.warning('Please select an MPD dispenser');
      return;
    }
    if (!formRecord.employeeId) {
      toast.warning('Please select an assigned employee');
      return;
    }

    const selectedEmp = employees.find(emp => emp.id === formRecord.employeeId);
    const selectedMpd = mpds.find(m => m.id === formRecord.mpdId);

    const payload = {
      date: formRecord.date,
      shift: formRecord.shift,
      employeeId: formRecord.employeeId,
      employeeName: selectedEmp ? selectedEmp.name : '',
      mpdId: formRecord.mpdId,
      mpdName: selectedMpd ? selectedMpd.mpdName : formRecord.mpdId,
      depositTime: formRecord.depositTime,
      depositAmount: calculateFormTotal(),
      notes500: formRecord.notes500,
      notes200: formRecord.notes200,
      notes100: formRecord.notes100,
      notes50: formRecord.notes50,
      notes20: formRecord.notes20,
      notes10: formRecord.notes10,
      coins: Number(formRecord.coins) || 0.0
    };

    setSaving(true);
    try {
      if (modalMode === 'add') {
        await createCashCollection(payload);
        toast.success('Cash collection added successfully!');
      } else if (modalMode === 'edit' && activeRecordId) {
        await updateCashCollection(activeRecordId, payload);
        toast.success('Cash collection updated successfully!');
      }
      setShowAddEditModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save cash collection');
    } finally {
      setSaving(false);
    }
  };

  // Select all checkboxes helper for current page
  const handleSelectAll = () => {
    const currentPageIds = records.map(r => r.id);
    const allCurrentSelected = currentPageIds.every(id => selectedIds.has(id));
    const newSelected = new Set(selectedIds);
    if (allCurrentSelected) {
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      currentPageIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  // Select single row checkbox helper
  const handleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // CSV Exporter helper
  const downloadCSV = (data: CashCollectionRecord[]) => {
    const headers = ['Record ID', 'Date', 'Employee', 'MPD', 'Deposit Time', 'Deposit Amount', '500 Note Count', '200 Note Count', '100 Note Count', '50 Note Count', '20 Note Count', '10 Note Count', 'Coins Value'];
    const rows = data.map(r => [
      r.id,
      formatDateToDMY(r.date),
      r.employeeName,
      r.mpdName,
      r.depositTime,
      r.depositAmount,
      r.notes500,
      r.notes200,
      r.notes100,
      r.notes50,
      r.notes20,
      r.notes10,
      r.coins
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cash_collections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel XLS Exporter helper
  const downloadXLS = (data: CashCollectionRecord[]) => {
    const formattedGenDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Cash Collections</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <h2>Cash Collection Report</h2>
        <p>Report Date: ${formattedGenDate}</p>
        <p>Total Records: ${data.length}</p>
        <table border="1">
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th>Record ID</th>
            <th>Date</th>
            <th>Deposit Time</th>
            <th>Employee Name</th>
            <th>MPD Dispenser</th>
            <th>500 Notes</th>
            <th>200 Notes</th>
            <th>100 Notes</th>
            <th>50 Notes</th>
            <th>20 Notes</th>
            <th>10 Notes</th>
            <th>Coins Value</th>
            <th>Total Amount</th>
          </tr>
    `;
    data.forEach(r => {
      html += `
        <tr>
          <td>${r.id}</td>
          <td>${formatDateToDMY(r.date)}</td>
          <td>${r.depositTime}</td>
          <td>${r.employeeName}</td>
          <td>${r.mpdName}</td>
          <td>${r.notes500}</td>
          <td>${r.notes200}</td>
          <td>${r.notes100}</td>
          <td>${r.notes50}</td>
          <td>${r.notes20}</td>
          <td>${r.notes10}</td>
          <td>${r.coins}</td>
          <td>${r.depositAmount}</td>
        </tr>
      `;
    });
    html += `
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cash_collections_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exporter helper
  const downloadPDF = (data: CashCollectionRecord[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to generate PDFs.');
      return;
    }

    const formattedGenDate = formatDateToDMY(new Date().toISOString().slice(0, 10));
    const formattedGenTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    let rowsHtml = '';
    data.forEach((r, idx) => {
      rowsHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace;">${r.id}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${formatDateToDMY(r.date)} (${r.depositTime})</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 500;">${r.employeeName}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.mpdName}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; text-align: right; font-weight: bold; color: #1d4ed8;">₹${r.depositAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html>
      <head>
        <title>Cash Collection Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 24px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 24px; }
          .title { font-size: 22px; font-weight: 700; color: #1e3a8a; margin: 0; }
          .meta { font-size: 12px; color: #64748b; text-align: right; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #f8fafc; padding: 10px 8px; border: 1px solid #cbd5e1; font-weight: 600; text-align: left; color: #334155; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Cash Collection Report</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Fuel Station Operations</p>
          </div>
          <div class="meta">
            <p style="margin: 0;"><strong>Report Date:</strong> ${formattedGenDate}</p>
            <p style="margin: 2px 0 0 0;"><strong>Generation Time:</strong> ${formattedGenTime}</p>
            <p style="margin: 2px 0 0 0;"><strong>Total Records:</strong> ${data.length}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">S.No</th>
              <th style="width: 120px;">Record ID</th>
              <th>Date & Time</th>
              <th>Employee</th>
              <th>MPD</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          This report is a system generated document. Generated on ${formattedGenDate} at ${formattedGenTime}.
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportAll = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const allRes = await fetchCashCollections({
        size: 10000,
        search: searchTerm,
        shift: shiftFilter,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });
      if (format === 'csv') {
        downloadCSV(allRes.content);
      } else if (format === 'excel') {
        downloadXLS(allRes.content);
      } else if (format === 'pdf') {
        downloadPDF(allRes.content);
      }
      toast.success(`Successfully exported all matching records to ${format.toUpperCase()}!`);
    } catch {
      toast.error('Failed to export records');
    }
  };

  const handleExportSelected = async (format: 'csv' | 'excel' | 'pdf') => {
    if (selectedIds.size === 0) {
      toast.warning('Please select at least one record to export');
      return;
    }
    try {
      // Fetch matching data across all pages to gather selected records across multi-page selection
      const allRes = await fetchCashCollections({
        size: 10000,
        search: searchTerm,
        shift: shiftFilter,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        sortBy,
        sortDir
      });

      const selectedData = allRes.content.filter(r => selectedIds.has(r.id));

      if (selectedData.length === 0) {
        toast.warning('Selected records are no longer available in the current filter range');
        return;
      }

      if (format === 'csv') {
        downloadCSV(selectedData);
      } else if (format === 'excel') {
        downloadXLS(selectedData);
      } else if (format === 'pdf') {
        downloadPDF(selectedData);
      }
      toast.success(`Successfully exported ${selectedData.length} selected records across pages to ${format.toUpperCase()}!`);
    } catch {
      toast.error('Failed to export selected records');
    }
  };

  // Sort toggle helper
  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  return (
    <div className={isEmbedded ? "space-y-4" : "p-8"}>
      {/* Header */}
      {isEmbedded ? (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Employee Deposits - {resolvedMpdName}</h3>
          <Button onClick={handleAddNewClick} className="bg-purple-600 hover:bg-purple-700 gap-1.5">
            <Plus className="w-4 h-4" />
            Log Collection
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-2">Cash Collection</h1>
            <p className="text-muted-foreground">Log shift cash collections and denomination splits</p>
          </div>
          <Button onClick={handleAddNewClick} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Log Collection
          </Button>
        </div>
      )}

      {/* Stats Summary Cards */}
      {!isEmbedded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-muted-foreground">Total Collection</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{stats.totalEntries}</p>
              <p className="text-xs text-muted-foreground">Total Logs</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{formatCurrency(stats.avgCollection)}</p>
              <p className="text-xs text-muted-foreground">Average Collection</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {!isEmbedded && (
        <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Employee, MPD name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
              />
            </div>

            {/* Date Filter Range */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">From</label>
              <input
                type="date"
                value={fromDateFilter}
                onChange={e => { setFromDateFilter(e.target.value); setCurrentPage(0); }}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">To</label>
              <input
                type="date"
                value={toDateFilter}
                onChange={e => { setToDateFilter(e.target.value); setCurrentPage(0); }}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Shift Filter */}
            <div className="w-36">
              <Select value={shiftFilter} onValueChange={v => { setShiftFilter(v); setCurrentPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Shifts</SelectItem>
                  {shifts.map(s => {
                    const val = `${s.shiftName} (${s.startTime}-${s.endTime})`;
                    return (
                      <SelectItem key={s.id} value={val}>
                        {s.shiftName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export Options */}
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

      {/* Main Records Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading collection data…
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <IndianRupee className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No cash collection records found</p>
              <p className="text-xs text-muted-foreground">
                {searchTerm || fromDateFilter || toDateFilter
                  ? 'Try relaxing search or filter inputs.'
                  : 'Log shift collections to initialize logs.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {!isEmbedded && (
                    <th className="w-12 text-center p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === records.length && records.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer align-middle rounded border-border"
                      />
                    </th>
                  )}
                  <th className="w-16 text-left p-4 font-medium">S.No</th>
                  <th className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSortToggle('date')}>
                    <div className="flex items-center gap-1.5">
                      Date & Time
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium">Shift</th>
                  <th className="text-left p-4 font-medium">MPD</th>
                  <th className="text-left p-4 font-medium">Employee</th>
                  <th className="text-right p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSortToggle('depositAmount')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      Amount
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record, index) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    {!isEmbedded && (
                      <td className="w-12 text-center p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => handleSelectRecord(record.id)}
                          className="w-4 h-4 cursor-pointer align-middle rounded border-border"
                        />
                      </td>
                    )}
                    <td className="w-16 p-4 font-medium text-muted-foreground">
                      {currentPage * pageSize + index + 1}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-mono text-sm">{formatDateToDMY(record.date)}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {record.depositTime}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/50 border border-border">
                        {record.shift ? record.shift.split(' ')[0] : 'Morning'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground font-mono">
                        {record.mpdName}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 text-xs">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {record.employeeName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{record.employeeName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-foreground font-mono text-base">
                      {formatCurrency(record.depositAmount)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewClick(record)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                          title="View split details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit entry"
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete entry"
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
                  <td colSpan={isEmbedded ? 4 : 5} className="p-4 text-left font-semibold">
                    Page Total ({records.length} logs)
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-foreground text-base">
                    {formatCurrency(records.reduce((acc, curr) => acc + (curr.depositAmount || 0), 0))}
                  </td>
                  <td className="p-4 text-muted-foreground text-left">
                    Overall Total: <span className="font-mono text-foreground font-bold">{formatCurrency(stats.totalAmount)}</span> ({stats.totalEntries} entries)
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Table Footer Pagination */}
        {records.length > 0 && (
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

      {/* Add / Edit / View Dialog (Spacious two-column layout style matching Employee Assignment dialog content size overrides) */}
      <Dialog open={showAddEditModal} onOpenChange={setShowAddEditModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '90vw', width: '850px', height: '88vh', maxHeight: '88vh' }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="w-5 h-5 text-primary" />
              {modalMode === 'add' ? `Log New Cash Collection (${resolvedMpdName || 'MPD'})` : modalMode === 'edit' ? 'Edit Cash Collection Log' : 'View Collection Details'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Side: Metadata select items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">Collection Metadata</h3>

                  <div className="space-y-1.5">
                    <Label htmlFor="colDate" className="text-xs font-medium">
                      Collection Date <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="colDate"
                      type="date"
                      value={formRecord.date}
                      onChange={e => setFormRecord((prev: any) => ({
                        ...prev,
                        date: e.target.value,
                        mpdId: '',
                        employeeId: ''
                      }))}
                      disabled={modalMode === 'view'}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="colShift" className="text-xs font-medium">
                      Operational Shift <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={formRecord.shiftId || 'NONE'}
                      onValueChange={(val) => {
                        const sObj = shifts.find(s => s.id === val);
                        const sName = sObj ? `${sObj.shiftName} (${sObj.startTime}-${sObj.endTime})` : (val === 'NONE' ? '' : val);
                        setFormRecord((prev: any) => ({
                          ...prev,
                          shiftId: val === 'NONE' ? '' : val,
                          shift: sName,
                          mpdId: '',
                          employeeId: ''
                        }));
                      }}
                      disabled={modalMode === 'view'}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="-- Select Shift --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select Shift --</SelectItem>
                        {shifts.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.shiftName} ({s.startTime} - {s.endTime})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="colMpd" className="text-xs font-medium">
                      MPD Dispenser <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Select
                      value={formRecord.mpdId || 'NONE'}
                      onValueChange={(val) => {
                        const mpdVal = val === 'NONE' ? '' : val;
                        // Search for assigned attendant from duty roster for selected MPD
                        let autoEmpId = '';
                        if (mpdVal && dutyAssignments.length > 0) {
                          const duty = dutyAssignments.find(d => String(d.mpdId) === String(mpdVal) && d.employeeId);
                          if (duty && duty.employeeId) autoEmpId = duty.employeeId;
                        }
                        setFormRecord((prev: any) => ({
                          ...prev,
                          mpdId: mpdVal,
                          employeeId: autoEmpId || prev.employeeId
                        }));
                      }}
                      disabled={modalMode === 'view' || (isEmbedded && !!resolvedMpdName)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="-- Select MPD --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- Select MPD --</SelectItem>
                        {mpds.map(m => {
                          const isAssigned = dutyAssignments.some(d => String(d.mpdId) === String(m.id) && d.employeeId);
                          return (
                            <SelectItem key={m.id} value={m.id}>
                              {m.mpdName} {isAssigned ? '• (Active Duty)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="colEmployee" className="text-xs font-medium">
                      Assigned Employee <span className="text-red-500 font-bold">*</span>
                    </Label>
                    {loadingMaster || loadingDuty ? (
                      <div className="h-9 flex items-center text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin mr-1.5" /> Loading roster...</div>
                    ) : (
                      <Select
                        value={formRecord.employeeId || 'NONE'}
                        onValueChange={(val) => setFormRecord((prev: any) => ({ ...prev, employeeId: val === 'NONE' ? '' : val }))}
                        disabled={modalMode === 'view'}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="-- Select Employee --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">-- Select Employee --</SelectItem>
                          {availableEmployees.map(emp => {
                            const isAttendantForMpd = dutyAssignments.some(d => String(d.employeeId) === String(emp.id) && isAssignmentForMpd(d, formRecord.mpdId));
                            return (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name} ({emp.employeeCode || emp.id}) {isAttendantForMpd ? '• (Assigned Attendant)' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="colTime" className="text-xs font-medium">
                      Deposit Time <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input
                      id="colTime"
                      type="time"
                      value={formRecord.depositTime}
                      onChange={e => setFormRecord((prev: any) => ({ ...prev, depositTime: e.target.value }))}
                      disabled={modalMode === 'view'}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Right Side: Notes splits */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1.5">Denomination Splits</h3>

                  <div className="border rounded-lg overflow-hidden bg-muted/10">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/40 text-muted-foreground">
                          <th className="text-left p-2 font-medium">Note Split</th>
                          <th className="text-center p-2 font-medium w-24">Count</th>
                          <th className="text-right p-2 font-medium">Calculated Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">₹500</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-center text-xs"
                              value={formRecord.notes500 || ''}
                              onChange={(e) => handleDenominationChange('notes500', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{(formRecord.notes500 * 500).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">₹200</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-center text-xs"
                              value={formRecord.notes200 || ''}
                              onChange={(e) => handleDenominationChange('notes200', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{(formRecord.notes200 * 200).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">₹100</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-center text-xs"
                              value={formRecord.notes100 || ''}
                              onChange={(e) => handleDenominationChange('notes100', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{(formRecord.notes100 * 100).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">₹50</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-center text-xs"
                              value={formRecord.notes50 || ''}
                              onChange={(e) => handleDenominationChange('notes50', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{(formRecord.notes50 * 50).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">₹20</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-center text-xs"
                              value={formRecord.notes20 || ''}
                              onChange={(e) => handleDenominationChange('notes20', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{(formRecord.notes20 * 20).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">₹10</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-center text-xs"
                              value={formRecord.notes10 || ''}
                              onChange={(e) => handleDenominationChange('notes10', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{(formRecord.notes10 * 10).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="hover:bg-muted/10">
                          <td className="p-2 font-medium">Coins Value</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="h-7 text-center text-xs"
                              value={formRecord.coins || ''}
                              onChange={(e) => handleDenominationChange('coins', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              disabled={modalMode === 'view'}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">₹{Number(formRecord.coins || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Dynamic Total calculation Display */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-center justify-between">
                    <span className="font-semibold text-blue-900 text-xs">Total Deposit Amount:</span>
                    <span className="text-xl font-bold text-blue-600 font-mono">
                      ₹{calculateFormTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0 bg-muted/20">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddEditModal(false)}>
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {modalMode !== 'view' && (
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2 min-w-[100px]" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Saving…' : modalMode === 'edit' ? 'Save Changes' : 'Log Collection'}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Collection Log Entry?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Are you sure you want to permanently delete this cash collection log? This action is irreversible and will remove the logged denominations record.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 p-3 rounded-lg border border-border text-xs space-y-1">
            <p><span className="font-semibold">Employee:</span> {recordToDelete?.employeeName}</p>
            <p><span className="font-semibold">Date:</span> {recordToDelete && formatDateToDMY(recordToDelete.date)} at {recordToDelete?.depositTime}</p>
            <p><span className="font-semibold">Amount:</span> {recordToDelete && formatCurrency(recordToDelete.depositAmount)}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowDeleteConfirm(false); setRecordToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
