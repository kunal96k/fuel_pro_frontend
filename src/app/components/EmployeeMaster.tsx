import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User, Upload, X, Search, ArrowUpDown, ChevronLeft, ChevronRight, Briefcase, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchEmployees, createEmployeeApi, updateEmployeeApi, deleteEmployeeApi, Employee, fetchDesignations, API_BASE_URL, fetchNextEmployeeCode, formatDateToDMY } from '../services/api';
import { toast } from 'sonner';

export function EmployeeMaster() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination & Search states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('Active');

  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [designations, setDesignations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    employeeCode: '',
    pan: '',
    aadhar: '',
    esicNumber: '',
    pfNumber: '',
    contact: '',
    email: '',
    photo: '',
    designation: '',
    joiningDate: '',
    dateOfTermination: '',
    status: 'Active',
  });

  const loadDesignations = async () => {
    try {
      const data = await fetchDesignations();
      setDesignations(data);
    } catch (err) {
      console.error('Failed to load designations:', err);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetchEmployees({
        page,
        size: pageSize,
        search,
        sortBy,
        sortDir,
        status: statusFilter,
      });
      setEmployees(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load employees from API:', err);
      setEmployees([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDesignations();
  }, [page, pageSize, search, sortBy, sortDir, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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

  const handleAdd = async () => {
    let nextCode = 'Fetching...';
    try {
      const codeRes = await fetchNextEmployeeCode();
      nextCode = codeRes.code;
    } catch (err) {
      console.error('Failed to fetch next employee code:', err);
      nextCode = '';
    }

    setFormData({
      name: '',
      employeeCode: nextCode,
      pan: '',
      aadhar: '',
      esicNumber: '',
      pfNumber: '',
      contact: '',
      email: '',
      photo: '',
      designation: '',
      joiningDate: '',
      dateOfTermination: '',
      status: 'Active',
    });
    setEditingEmployee(null);
    setShowAddDialog(true);
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      name: employee.name,
      employeeCode: employee.employeeCode,
      pan: employee.pan,
      aadhar: formatAadhar(employee.aadhar || ''),
      esicNumber: employee.esicNumber || '',
      pfNumber: employee.pfNumber || '',
      contact: employee.contact,
      email: employee.email,
      photo: employee.photo || '',
      designation: employee.designation || '',
      joiningDate: employee.joiningDate || '',
      dateOfTermination: employee.dateOfTermination || '',
      status: employee.status || 'Active',
    });
    setEditingEmployee(employee);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployeeApi(id);
        toast.success('Employee deleted successfully!');
      } catch (err) {
        console.warn('API delete failed, updating UI locally');
        toast.error('Failed to delete employee');
      }
      loadEmployees();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, photo: '' });
  };

  // Helper formatting for input typed values
  const formatAadhar = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 12; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatPan = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.joiningDate || !formData.aadhar || !formData.contact) {
      toast.error('Please fill in required fields (Name, Joining Date, Aadhar, Contact)');
      return;
    }

    if (formData.name.trim().length > 50) {
      toast.error('Employee Name cannot exceed 50 characters');
      return;
    }

    if (formData.dateOfTermination && formData.dateOfTermination < formData.joiningDate) {
      toast.warning('Warning: Date of termination cannot be before joining date');
      return;
    }

    const panClean = formData.pan.trim().toUpperCase();
    if (panClean && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean)) {
      toast.error('Invalid PAN Card format (should be like ABCDE1234F)');
      return;
    }

    const aadharClean = formData.aadhar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(aadharClean)) {
      toast.error('Aadhar Card must be exactly 12 digits');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      employeeCode: formData.employeeCode,
      pan: panClean,
      aadhar: aadharClean,
      esicNumber: formData.esicNumber.trim(),
      pfNumber: formData.pfNumber.trim(),
      contact: formData.contact.trim(),
      email: formData.email.trim(),
      photo: formData.photo,
      designation: formData.designation.trim(),
      joiningDate: formData.joiningDate,
      dateOfTermination: formData.dateOfTermination || null,
      status: formData.status as 'Active' | 'Inactive',
    };

    try {
      if (editingEmployee) {
        await updateEmployeeApi(editingEmployee.id, payload);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployeeApi(payload);
        toast.success('Employee created successfully!');
      }
      setShowAddDialog(false);
      loadEmployees();
      loadDesignations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save employee records.');
    }
  };

  const getPhotoSrc = (photo: string | undefined) => {
    if (!photo) return null;
    if (photo.startsWith('data:image/')) return photo;
    return `${API_BASE_URL}/employees/photo/${photo}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Employee Master</h1>
          <p className="text-muted-foreground">Manage employee records, dynamic designations, and statuses</p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start md:self-auto">
          <Plus className="w-4 h-4" />
          Add New Employee
        </Button>
      </div>

      {/* Filters, Search & Settings */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employee name, code, contact..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="statusFilter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Status:</Label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
              <SelectTrigger id="statusFilter" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active Only</SelectItem>
                <SelectItem value="Inactive">Inactive Only</SelectItem>
                <SelectItem value="ALL">All Employees</SelectItem>
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
                <th className="text-left p-4 font-medium w-16">Photo</th>
                <th
                  onClick={() => handleSortToggle('employeeCode')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Employee Code
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('name')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Name
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-left p-4 font-medium">Designation</th>
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="w-36 text-left p-4 font-medium">Joining Date</th>
                <th className="w-40 text-left p-4 font-medium">Termination Date</th>
                <th className="text-left p-4 font-medium">PAN</th>
                <th className="text-left p-4 font-medium">Aadhar</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground">
                    No employees matching criteria found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border">
                        {employee.photo ? (
                          <img src={getPhotoSrc(employee.photo)!} alt={employee.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm font-semibold text-primary">{employee.employeeCode}</span>
                    </td>
                    <td className="p-4 font-medium">{employee.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{employee.designation || '-'}</td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{employee.contact}</div>
                        {employee.email && (
                          <div className="text-muted-foreground text-xs">{employee.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="w-36 p-4 text-sm font-medium">{formatDateToDMY(employee.joiningDate)}</td>
                    <td className="w-40 p-4 text-sm text-muted-foreground">{formatDateToDMY(employee.dateOfTermination)}</td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-semibold">{employee.pan || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs">{formatAadhar(employee.aadhar || '') || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        employee.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-red-500/15 text-red-600'
                      }`}>
                        {employee.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Offset Pagination Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {totalElements === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} employees
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Update employee record information' : 'Configure a new employee file in the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Photo Upload */}
            <div className="grid gap-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center overflow-hidden border border-border">
                  {formData.photo ? (
                    <img src={getPhotoSrc(formData.photo)!} alt="Employee" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-2">
                  <label htmlFor="photo-upload">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => document.getElementById('photo-upload')?.click()}>
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </Button>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  {formData.photo && (
                    <Button type="button" variant="outline" size="icon" onClick={handleRemovePhoto}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <span className={`text-[10px] font-mono ${formData.name.length >= 50 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                    {formData.name.length}/50 chars
                  </span>
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  maxLength={50}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name (max 50 chars)"
                />
                {formData.name.length >= 50 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Maximum limit of 50 characters reached.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Employee Code <span className="text-red-500">*</span></Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  disabled
                  readOnly
                  placeholder="Auto-generated on save"
                  className="bg-muted font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="joiningDate">Joining Date <span className="text-red-500">*</span></Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateOfTermination">Date of Termination</Label>
                <Input
                  id="dateOfTermination"
                  type="date"
                  value={formData.dateOfTermination}
                  onChange={(e) => setFormData({ ...formData, dateOfTermination: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Select or type designation"
                  list="designation-suggestions"
                />
                <datalist id="designation-suggestions">
                  {designations.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact Number <span className="text-red-500">*</span></Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pan">PAN Number</Label>
                <Input
                  id="pan"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: formatPan(e.target.value) })}
                  placeholder="Enter PAN number"
                  maxLength={10}
                  className="font-mono uppercase"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aadhar">Aadhar Number <span className="text-red-500">*</span></Label>
                <Input
                  id="aadhar"
                  value={formData.aadhar}
                  onChange={(e) => setFormData({ ...formData, aadhar: formatAadhar(e.target.value) })}
                  placeholder="Enter Aadhar number"
                  maxLength={14}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="esicNumber">ESIC Number</Label>
                <Input
                  id="esicNumber"
                  value={formData.esicNumber}
                  onChange={(e) => setFormData({ ...formData, esicNumber: e.target.value.toUpperCase() })}
                  placeholder="Enter ESIC number"
                  className="font-mono uppercase"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pfNumber">PF Number</Label>
                <Input
                  id="pfNumber"
                  value={formData.pfNumber}
                  onChange={(e) => setFormData({ ...formData, pfNumber: e.target.value.toUpperCase() })}
                  placeholder="Enter PF number"
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              {editingEmployee && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingEmployee ? 'Update' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
