import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Sun, Moon, Sunset, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchShifts, createShiftApi, updateShiftApi, deleteShiftApi, Shift } from '../services/api';
import { toast } from 'sonner';



export function ShiftsMaster() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination, Search, Filter, Sort states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    shiftName: '',
    startTime: '',
    endTime: '',
    shiftType: '',
    description: '',
  });

  const loadShifts = async () => {
    setLoading(true);
    try {
      const response = await fetchShifts({
        page,
        size: pageSize,
        search,
        shiftType: shiftTypeFilter,
        sortBy,
        sortDir,
      });
      setShifts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load shifts from API:', err);
      setShifts([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [page, pageSize, search, shiftTypeFilter, sortBy, sortDir]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleShiftTypeFilterChange = (val: string) => {
    setShiftTypeFilter(val);
    setPage(0);
  };

  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleAdd = () => {
    setFormData({
      shiftName: '',
      startTime: '',
      endTime: '',
      shiftType: '',
      description: '',
    });
    setEditingShift(null);
    setShowAddDialog(true);
  };

  const handleEdit = (shift: Shift) => {
    setFormData({
      shiftName: shift.shiftName,
      startTime: shift.startTime,
      endTime: shift.endTime,
      shiftType: shift.shiftType,
      description: shift.description || '',
    });
    setEditingShift(shift);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      try {
        await deleteShiftApi(id);
      } catch (err) {
        console.warn('API delete failed');
      }
      loadShifts();
    }
  };

  const handleSave = async () => {
    if (!formData.shiftName || !formData.startTime || !formData.endTime || !formData.shiftType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const duplicate = shifts.find(
      s => s.shiftName.trim().toLowerCase() === formData.shiftName.trim().toLowerCase() &&
      (!editingShift || s.id !== editingShift.id)
    );
    if (duplicate) {
      toast.warning(`Shift with name "${formData.shiftName}" already exists!`);
      return;
    }

    const payload = {
      shiftName: formData.shiftName,
      startTime: formData.startTime,
      endTime: formData.endTime,
      shiftType: formData.shiftType as 'Morning' | 'Afternoon' | 'Night',
      description: formData.description,
    };

    if (editingShift) {
      try {
        await updateShiftApi(editingShift.id, payload);
        toast.success('Shift updated successfully!');
      } catch (err) {
        console.warn('API update failed', err);
        toast.error('Failed to update shift.');
        return;
      }
    } else {
      try {
        await createShiftApi(payload);
        toast.success('Shift created successfully!');
      } catch (err) {
        console.warn('API create failed', err);
        toast.error('Failed to create shift.');
        return;
      }
    }

    setShowAddDialog(false);
    loadShifts();
  };

  const getShiftIcon = (shiftType: string) => {
    switch (shiftType) {
      case 'Morning':
        return Sun;
      case 'Afternoon':
        return Sunset;
      case 'Night':
        return Moon;
      default:
        return Sun;
    }
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'Morning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'Afternoon':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'Night':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">Shifts Master</h1>
          <p className="text-muted-foreground">Manage shift timings and configurations</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Shift
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search shift name, description..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select value={shiftTypeFilter} onValueChange={handleShiftTypeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Shift Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Shift Types</SelectItem>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Afternoon">Afternoon</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(0); }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th
                  onClick={() => handleSortToggle('shiftName')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Shift Name
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('shiftType')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Type
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-left p-4 font-medium">Start Time</th>
                <th className="text-left p-4 font-medium">End Time</th>
                <th className="text-left p-4 font-medium">Duration</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading shifts...
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No shifts matching criteria found
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => {
                  const ShiftIcon = getShiftIcon(shift.shiftType);
                  return (
                    <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{shift.shiftName}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getShiftColor(shift.shiftType)}`}>
                          <ShiftIcon className="w-3.5 h-3.5" />
                          {shift.shiftType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{formatTime(shift.startTime)}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{formatTime(shift.endTime)}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-sm">{calculateDuration(shift.startTime, shift.endTime)}</span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{shift.description || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(shift)}
                            className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Offset Pagination Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {totalElements === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} shifts
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm font-medium px-2">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingShift ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
            <DialogDescription>
              {editingShift ? 'Update shift configuration' : 'Configure a new shift for the fuel station'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shiftName">Shift Name <span className="text-red-500">*</span></Label>
              <Input
                id="shiftName"
                value={formData.shiftName}
                onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                placeholder="Enter shift name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shiftType">Shift Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.shiftType}
                onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
              >
                <SelectTrigger id="shiftType">
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time <span className="text-red-500">*</span></Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time <span className="text-red-500">*</span></Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            {formData.startTime && formData.endTime && (
              <div className="px-3 py-2 bg-muted/50 rounded-lg border border-border">
                <div className="text-sm">
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-medium">{calculateDuration(formData.startTime, formData.endTime)}</span>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingShift ? 'Update' : 'Add Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
