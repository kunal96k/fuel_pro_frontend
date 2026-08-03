import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Users, Calendar as CalendarIcon, Save, History,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2,
  UserCheck, RefreshCw, ClipboardList, Fuel, CheckCircle2
} from 'lucide-react';
import { subDays } from 'date-fns';
import { toast } from 'sonner';
import {
  Employee, Shift,
  EmployeeAssignment, NozzleAssignmentPayload,
  fetchEmployees, fetchShifts,
  fetchEmployeeAssignments, saveEmployeeAssignments,
  fetchAssignmentHistory, formatDateToDMY,
  fetchMpdsAll, API_BASE_URL
} from '../services/api';

// ----- Types for MPD (read from MPDMaster state via localStorage-compatible interface) -----
interface LocalNozzle {
  id: string;
  nozzleName: string;
  fuelType: string;
  connectedTank: string;
}
interface LocalMPD {
  id: string;
  mpdName: string;
  numberOfNozzles: number;
  nozzles: LocalNozzle[];
}

// ---- Draft assignment state: mpdId -> nozzleId -> { employeeId, status } ----
type AssignmentDraft = Record<string, Record<string, { employeeId: string; status: string }>>;

// ---- Fuel type color helper ----
function fuelBadge(fuel: string) {
  const lower = (fuel || '').toLowerCase();
  if (lower.includes('petrol') || lower.includes('gasoline'))
    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (lower.includes('diesel'))
    return 'bg-amber-100 text-amber-700 border-amber-300';
  if (lower.includes('cng') || lower.includes('lpg'))
    return 'bg-sky-100 text-sky-700 border-sky-300';
  return 'bg-purple-100 text-purple-700 border-purple-300';
}

// ---- Avatar initials ----
function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getPhotoUrl(photo: string | null | undefined) {
  if (!photo) return undefined;
  if (photo.startsWith('http')) return photo;
  return `${API_BASE_URL}/employees/photo/${photo}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function nDaysAgoStr(n: number) {
  return subDays(new Date(), n).toISOString().split('T')[0];
}

export function EmployeeAssign() {
  // ---- Master data ----
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [mpds, setMpds] = useState<LocalMPD[]>([]);

  // ---- Selected date + shift (main view) ----
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');

  // ---- Loaded assignments from backend ----
  const [currentAssignments, setCurrentAssignments] = useState<EmployeeAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // ---- Assign modal ----
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignModalDate, setAssignModalDate] = useState<string>(todayStr());
  const [loadingModalAssignments, setLoadingModalAssignments] = useState(false);
  const [draft, setDraft] = useState<AssignmentDraft>({});
  const [saving, setSaving] = useState(false);

  // ---- History modal ----
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFromDate, setHistoryFromDate] = useState(nDaysAgoStr(30));
  const [historyToDate, setHistoryToDate] = useState(todayStr());
  const [historyShiftId, setHistoryShiftId] = useState<string>('ALL');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRecords, setHistoryRecords] = useState<EmployeeAssignment[]>([]);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalElements, setHistoryTotalElements] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Helper: check if all nozzles in an MPD are closed in the draft state
  const isMpdClosed = (mpdId: string) => {
    const nozzles = draft[mpdId];
    if (!nozzles) return false;
    const values = Object.values(nozzles);
    if (values.length === 0) return false;
    return values.every(v => v.status === 'Closed');
  };

  // Helper: toggle all nozzles in an MPD between Active and Closed in draft
  const handleToggleMpdOperational = (mpdId: string, operational: boolean) => {
    setDraft(prev => {
      const updatedMpd = { ...(prev[mpdId] || {}) };
      const mpdObj = mpds.find(m => m.id === mpdId);
      if (mpdObj) {
        for (const nozzle of mpdObj.nozzles) {
          updatedMpd[nozzle.id] = {
            employeeId: '',
            status: operational ? 'Active' : 'Closed'
          };
        }
      }
      return {
        ...prev,
        [mpdId]: updatedMpd
      };
    });
  };

  // ---- Load master data ----
  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, shiftRes, mpdRes] = await Promise.all([
          fetchEmployees({ size: 1000, status: 'Active' }),
          fetchShifts({ size: 100 }),
          fetchMpdsAll()
        ]);
        setEmployees(empRes.content);
        setShifts(shiftRes.content);
        setMpds(mpdRes);
        if (shiftRes.content.length > 0) {
          setSelectedShiftId(shiftRes.content[0].id);
        }
      } catch {
        toast.error('Failed to load master data');
      }
    };
    load();
  }, []);


  // ---- Load assignments for selected date + shift ----
  const loadAssignments = useCallback(async () => {
    if (!selectedDate || !selectedShiftId) return;
    setLoadingAssignments(true);
    try {
      const data = await fetchEmployeeAssignments(selectedDate, selectedShiftId);
      setCurrentAssignments(data);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  }, [selectedDate, selectedShiftId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // ---- Open assign modal — pre-populate date ----
  const openAssignModal = () => {
    setAssignModalDate(selectedDate);
    setShowAssignModal(true);
  };

  // Load draft assignments inside the modal when date or shift changes
  useEffect(() => {
    if (!showAssignModal || !assignModalDate || !selectedShiftId) return;
    let active = true;
    const loadModalAssignments = async () => {
      setLoadingModalAssignments(true);
      try {
        const data = await fetchEmployeeAssignments(assignModalDate, selectedShiftId);
        if (!active) return;
        const initDraft: AssignmentDraft = {};
        for (const mpd of mpds) {
          initDraft[mpd.id] = {};
          for (const nozzle of mpd.nozzles) {
            const existing = data.find(
              a => a.mpdId === mpd.id && a.nozzleId === nozzle.id
            );
            initDraft[mpd.id][nozzle.id] = {
              employeeId: existing?.employeeId || '',
              status: existing?.status || (assignModalDate < todayStr() ? 'Completed' : 'Active'),
            };
          }
        }
        setDraft(initDraft);
      } catch {
        toast.error('Failed to load assignments for selected modal date');
      } finally {
        if (active) setLoadingModalAssignments(false);
      }
    };
    loadModalAssignments();
    return () => { active = false; };
  }, [showAssignModal, assignModalDate, selectedShiftId, mpds]);

  // ---- Conflict detection in draft (client side) ----
  function conflictingMpdFor(empId: string, currentMpdId: string, currentNozzleId: string): string | null {
    if (!empId) return null;
    for (const [mpdId, nozzles] of Object.entries(draft)) {
      if (mpdId === currentMpdId) continue;
      for (const [nozzleId, obj] of Object.entries(nozzles)) {
        if (obj.employeeId === empId && !(mpdId === currentMpdId && nozzleId === currentNozzleId)) {
          const conflictMpd = mpds.find(m => m.id === mpdId);
          return conflictMpd?.mpdName || mpdId;
        }
      }
    }
    return null;
  }

  // ---- Save assignments ----
  const handleSave = async () => {
    if (!selectedShiftId) {
      toast.warning('Please select a shift first');
      return;
    }

    // Build payload
    const payload: NozzleAssignmentPayload[] = [];
    for (const mpd of mpds) {
      for (const nozzle of mpd.nozzles) {
        const item = draft[mpd.id]?.[nozzle.id];
        payload.push({
          mpdId: mpd.id,
          mpdName: mpd.mpdName,
          nozzleId: nozzle.id,
          nozzleName: nozzle.nozzleName,
          fuelType: nozzle.fuelType,
          employeeId: item?.employeeId || null,
          status: item?.status || 'Active',
        });
      }
    }

    setSaving(true);
    try {
      await saveEmployeeAssignments(assignModalDate, selectedShiftId, payload);
      toast.success('Assignments saved successfully!');
      setShowAssignModal(false);
      setSelectedDate(assignModalDate); // navigate main view to saved date
      await loadAssignments();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  // ---- Load history ----
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchAssignmentHistory({
        fromDate: historyFromDate,
        toDate: historyToDate,
        shiftId: historyShiftId !== 'ALL' ? historyShiftId : undefined,
        page: historyPage,
        size: 20,
      });
      setHistoryRecords(res.content);
      setHistoryTotalPages(res.totalPages);
      setHistoryTotalElements(res.totalElements);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }, [historyFromDate, historyToDate, historyShiftId, historyPage]);

  useEffect(() => {
    if (showHistoryModal) loadHistory();
  }, [showHistoryModal, loadHistory]);

  // ---- Derive summary rows from currentAssignments ----
  // Group by employee: show each employee once with their MPD + nozzles
  const assignedEmpIds = [...new Set(currentAssignments.filter(a => a.employeeId).map(a => a.employeeId!))]
  const summaryRows = assignedEmpIds.map(empId => {
    const rows = currentAssignments.filter(a => a.employeeId === empId);
    const emp = employees.find(e => e.id === empId);
    const empName = emp?.name || rows[0]?.employeeName || `Employee #${empId}`;
    const empCode = emp?.employeeCode || rows[0]?.employeeCode || '-';
    const empDesignation = emp?.designation || rows[0]?.employeeDesignation || '-';
    const empPhoto = emp?.photo || rows[0]?.employeePhoto || null;
    const mpdName = rows[0]?.mpdName || rows[0]?.mpdId || '-';
    const nozzles = rows.map(r => r.nozzleName || r.nozzleId).join(', ');
    const status = rows[0]?.status || 'Active';
    return { empId, emp, empName, empCode, empDesignation, empPhoto, mpdName, nozzles, shiftName: rows[0]?.shiftName, rows, status };
  });

  const selectedShift = shifts.find(s => s.id === selectedShiftId);
  const unassignedNozzles = currentAssignments.filter(a => !a.employeeId && a.status !== 'Closed').length;
  const closedMpdNames = [...new Set(currentAssignments.filter(a => a.status === 'Closed').map(a => a.mpdName || a.mpdId))];

  return (
    <div className="p-8 space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Employee Assignment</h1>
          <p className="text-muted-foreground">
            Assign employees to MPD nozzles per shift and date
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setHistoryPage(0); setShowHistoryModal(true); }}>
            <History className="w-4 h-4" />
            History
          </Button>
          <Button size="sm" className="gap-2" onClick={openAssignModal} disabled={!selectedShiftId}>
            <Users className="w-4 h-4" />
            Assign Employees
          </Button>
        </div>
      </div>

      {/* ---- Date + Shift Selectors ---- */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <label className="text-sm font-medium text-muted-foreground">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-36 h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          <label className="text-sm font-medium text-muted-foreground">Shift</label>
          <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
            <SelectTrigger className="w-52 h-9">
              <SelectValue placeholder="Select shift…" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.shiftName} ({s.startTime}–{s.endTime})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ---- Stat Pills ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Attendants Assigned"
          value={assignedEmpIds.length}
          icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
          accent="emerald"
        />
        <StatCard
          label="Active Nozzles"
          value={currentAssignments.filter(a => a.status !== 'Closed').length}
          icon={<Fuel className="w-5 h-5 text-sky-500" />}
          accent="sky"
        />
        <StatCard
          label="Unassigned Nozzles"
          value={unassignedNozzles}
          icon={<AlertTriangle className={`w-5 h-5 ${unassignedNozzles > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />}
          accent={unassignedNozzles > 0 ? 'amber' : 'gray'}
        />
        <StatCard
          label="Closed MPDs"
          value={closedMpdNames.length}
          icon={<AlertTriangle className="w-5 h-5 text-slate-400" />}
          accent="gray"
        />
      </div>

      {/* ---- Current Assignments Table ---- */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">
              Duty Records: {formatDateToDMY(selectedDate)} — {selectedShift ? `${selectedShift.shiftName} (${selectedShift.startTime}–${selectedShift.endTime})` : 'No shift selected'}
            </span>
          </div>
          {currentAssignments.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
              {currentAssignments.length} nozzle{currentAssignments.length !== 1 ? 's' : ''} configured
            </span>
          )}
        </div>

        {loadingAssignments ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Loading duty records...
          </div>
        ) : currentAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">No duty assignments recorded for this date &amp; shift</p>
            {mpds.length === 0 ? (
              <p className="text-xs text-amber-500">Please configure MPDs in MPD Master first.</p>
            ) : (
              <Button size="sm" onClick={openAssignModal} className="mt-1 gap-2">
                <Users className="w-4 h-4" />
                Assign Employees Now
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="w-16 text-left p-4 font-medium text-muted-foreground">S.No</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Code</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Designation</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">MPD</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Assigned Nozzles</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaryRows.length > 0 ? summaryRows.map((row, idx) => (
                  <tr key={row.empId} className="hover:bg-muted/30 transition-colors">
                    <td className="w-16 p-4 font-medium text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 text-xs">
                          <AvatarImage src={getPhotoUrl(row.empPhoto)} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                            {initials(row.empName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{row.empName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-foreground">{row.empCode}</td>
                    <td className="p-4 text-muted-foreground">{row.empDesignation}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground font-mono">{row.mpdName}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {row.rows.map(r => (
                          <span key={r.nozzleId} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${fuelBadge(r.fuelType)}`}>
                            {r.nozzleName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Completed' ? 'bg-slate-500/10 text-slate-500' :
                          row.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                            row.status === 'On Break' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-green-500/10 text-green-500'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )) : null}

                {/* Unassigned nozzle rows */}
                {currentAssignments.filter(a => !a.employeeId && a.status !== 'Closed').map((a, idx) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors bg-amber-500/5">
                    <td className="w-16 p-4 font-medium text-muted-foreground">
                      {summaryRows.length + idx + 1}
                    </td>
                    <td className="p-4 text-muted-foreground italic">Unassigned</td>
                    <td className="p-4 text-muted-foreground">—</td>
                    <td className="p-4 text-muted-foreground">—</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground font-mono">{a.mpdName || a.mpdId}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${fuelBadge(a.fuelType)}`}>
                        {a.nozzleName || a.nozzleId}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                        Unassigned
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Closed MPDs rows */}
                {closedMpdNames.map((name, idx) => (
                  <tr key={`closed-${name}`} className="hover:bg-muted/30 transition-colors text-muted-foreground">
                    <td className="w-16 p-4 font-medium text-muted-foreground">
                      {summaryRows.length + currentAssignments.filter(a => !a.employeeId && a.status !== 'Closed').length + idx + 1}
                    </td>
                    <td className="p-4 italic">Closed / Not Working</td>
                    <td className="p-4">—</td>
                    <td className="p-4">—</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground font-mono">{name}</span>
                    </td>
                    <td className="p-4">—</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Closed for Shift
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          ASSIGN EMPLOYEES MODAL
         ====================================================== */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '1200px', width: '92vw', height: '90vh', maxHeight: '90vh' }}
        >
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-5 h-5 text-blue-600" />
              Assign Employees
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-5">
            {/* Modal Date Selector */}
            <div className="bg-muted/30 border border-blue-100 dark:border-border rounded-lg p-3.5 flex flex-wrap items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-semibold text-muted-foreground">Assigning Date:</label>
              <input
                type="date"
                value={assignModalDate}
                onChange={e => setAssignModalDate(e.target.value)}
                className="w-36 h-8 rounded border border-blue-200 focus:border-blue-400 bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/20 font-medium"
              />
              {loadingModalAssignments && (
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Loading assignments...
                </span>
              )}
            </div>

            {mpds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Fuel className="w-12 h-12 opacity-20 text-blue-600" />
                <p className="text-sm font-medium">No MPDs configured</p>
                <p className="text-xs">Please add MPDs in the MPD Master section first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {mpds.map(mpd => (
                  <div key={mpd.id} className="space-y-3 border border-border rounded-xl p-4 bg-card shadow-sm">
                    {/* MPD Header Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-blue-600" />
                        <Badge variant="secondary" className="text-sm px-2.5 py-0.5 bg-secondary text-secondary-foreground font-semibold">
                          {mpd.mpdName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border">
                          <input
                            id={`op-${mpd.id}`}
                            type="checkbox"
                            checked={!isMpdClosed(mpd.id)}
                            onChange={(e) => handleToggleMpdOperational(mpd.id, e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-border text-blue-600 focus:ring-blue-400/50 cursor-pointer"
                          />
                          <label htmlFor={`op-${mpd.id}`} className="text-xs font-medium text-muted-foreground select-none cursor-pointer">
                            Active
                          </label>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {mpd.numberOfNozzles} nozzles
                        </span>
                      </div>
                    </div>

                    {/* Nozzle rows */}
                    <div className="grid gap-2.5 pt-1">
                      {mpd.nozzles.map(nozzle => {
                        const isClosed = isMpdClosed(mpd.id);
                        const selectedEmpId = draft[mpd.id]?.[nozzle.id]?.employeeId || '';
                        const selectedStatus = draft[mpd.id]?.[nozzle.id]?.status || 'Active';
                        const conflict = conflictingMpdFor(selectedEmpId, mpd.id, nozzle.id);

                        const takenInOtherMpds = new Set<string>();
                        for (const [mId, nozzles] of Object.entries(draft)) {
                          if (mId === mpd.id) continue;
                          Object.values(nozzles).forEach(obj => { if (obj.employeeId) takenInOtherMpds.add(obj.employeeId); });
                        }

                        const isPetrol = nozzle.fuelType?.toLowerCase().includes('petrol') || nozzle.fuelType?.toLowerCase().includes('gasoline');

                        return (
                          <div key={nozzle.id} className={`flex items-center gap-3 p-2.5 border border-border/70 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors ${isClosed ? 'opacity-50' : ''}`}>
                            <div className="text-xs font-semibold w-20 shrink-0 text-foreground">{nozzle.nozzleName}</div>
                            <Badge
                              variant="outline"
                              className={`text-[11px] px-2 shrink-0 font-medium ${isPetrol
                                  ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800'
                                  : 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800'
                                }`}
                            >
                              {nozzle.fuelType || 'Fuel'}
                            </Badge>

                            <div className="flex-1 min-w-[160px]">
                              <Select
                                value={selectedEmpId || 'NONE'}
                                disabled={isClosed}
                                onValueChange={(val) => {
                                  setDraft(prev => ({
                                    ...prev,
                                    [mpd.id]: {
                                      ...(prev[mpd.id] || {}),
                                      [nozzle.id]: {
                                        employeeId: val === 'NONE' ? '' : val,
                                        status: prev[mpd.id]?.[nozzle.id]?.status || 'Active'
                                      }
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger className={`h-8 text-xs border border-blue-200 focus:border-blue-400 ${conflict ? 'border-red-400 focus:ring-red-400/30' : ''}`}>
                                  <SelectValue placeholder={isClosed ? '— Closed —' : 'Select employee'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NONE">
                                    <span className="text-muted-foreground italic">— Unassigned —</span>
                                  </SelectItem>
                                  {employees.map(emp => {
                                    const isInOtherMpd = takenInOtherMpds.has(emp.id) && emp.id !== selectedEmpId;
                                    return (
                                      <SelectItem
                                        key={emp.id}
                                        value={emp.id}
                                        disabled={isInOtherMpd}
                                        className={isInOtherMpd ? 'opacity-40 line-through' : ''}
                                      >
                                        <span className="flex items-center gap-1.5">
                                          {emp.name}
                                          {isInOtherMpd && <span className="text-[10px] text-red-400">(assigned elsewhere)</span>}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>

                              {conflict && (
                                <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1 font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  Already assigned to {conflict}
                                </p>
                              )}
                            </div>

                            {/* Status Dropdown */}
                            <div className="w-28 shrink-0">
                              <Select
                                value={selectedStatus}
                                disabled={isClosed}
                                onValueChange={(val) => {
                                  setDraft(prev => ({
                                    ...prev,
                                    [mpd.id]: {
                                      ...(prev[mpd.id] || {}),
                                      [nozzle.id]: {
                                        employeeId: selectedEmpId,
                                        status: val
                                      }
                                    }
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs border border-blue-200 focus:border-blue-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="On Break">On Break</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0 bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[100px]" onClick={handleSave} disabled={saving || mpds.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          HISTORY MODAL
         ====================================================== */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent
          className="flex flex-col overflow-hidden p-0"
          style={{ maxWidth: '95vw', width: '95vw', height: '92vh', maxHeight: '92vh' }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Employee Assignment Duty Records
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">From</label>
              <input
                type="date"
                value={historyFromDate}
                onChange={e => { setHistoryFromDate(e.target.value); setHistoryPage(0); }}
                className="w-32 h-8 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">To</label>
              <input
                type="date"
                value={historyToDate}
                onChange={e => { setHistoryToDate(e.target.value); setHistoryPage(0); }}
                className="w-32 h-8 rounded-md border border-border bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Shift</label>
              <Select value={historyShiftId} onValueChange={v => { setHistoryShiftId(v); setHistoryPage(0); }}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Shifts</SelectItem>
                  {shifts.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.shiftName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" className="ml-auto gap-1.5 h-8" onClick={() => { setHistoryPage(0); loadHistory(); }}>
              {loadingHistory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Apply
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading history…
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <History className="w-10 h-10 opacity-20" />
                <p className="text-sm">No records in selected range.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border z-10">
                  <tr>
                    <th className="w-14 text-center px-3 py-3 font-medium text-muted-foreground">S.No</th>
                    <th className="w-32 text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Shift</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">MPD</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nozzle</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fuel</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((r, idx) => (
                    <tr key={r.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <td className="w-14 text-center px-3 py-3 font-semibold text-muted-foreground text-xs">
                        {historyPage * 20 + idx + 1}
                      </td>
                      <td className="w-32 px-5 py-3 font-mono text-xs">{formatDateToDMY(r.assignDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{r.shiftName}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.mpdName || r.mpdId}</td>
                      <td className="px-4 py-3 text-xs">{r.nozzleName || r.nozzleId}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${fuelBadge(r.fuelType)}`}>
                          {r.fuelType || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.employeeId ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getPhotoUrl(r.employeePhoto)} />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {initials(r.employeeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{r.employeeName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${r.status === 'Completed' ? 'text-slate-500' :
                            r.status === 'Pending' ? 'text-amber-500' :
                              r.status === 'On Break' ? 'text-blue-500' :
                                'text-emerald-600'
                          }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {r.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20 shrink-0">
            <span className="text-xs text-muted-foreground">
              Page {historyPage + 1} of {historyTotalPages} &nbsp;·&nbsp; {historyTotalElements.toLocaleString()} records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                className="h-7 px-2 gap-1"
                disabled={historyPage === 0 || loadingHistory}
                onClick={() => setHistoryPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono px-2">{historyPage + 1}</span>
              <Button
                variant="outline" size="sm"
                className="h-7 px-2 gap-1"
                disabled={historyPage >= historyTotalPages - 1 || loadingHistory}
                onClick={() => setHistoryPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Stat Card helper component ----
function StatCard({ label, value, icon, accent }: {
  label: string; value: number; icon: React.ReactNode; accent: string;
}) {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30',
    sky: 'bg-sky-50 dark:bg-sky-950/30',
    amber: 'bg-amber-50 dark:bg-amber-950/30',
    gray: 'bg-muted/30',
  };
  return (
    <div className={`${bg[accent] || bg.gray} border border-border rounded-xl px-5 py-4 flex items-center gap-4`}>
      <div className="p-2 rounded-lg bg-background border border-border">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}