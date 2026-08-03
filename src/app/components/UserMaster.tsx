import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User, Shield, Eye, EyeOff, Search, ArrowUpDown, ChevronLeft, ChevronRight, Lock, Unlock, KeyRound, LogIn, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { fetchUsers, createUserApi, updateUserApi, deleteUserApi, toggleUserLockApi, resetUserPasswordApi, UserAccount } from '../services/api';

interface UserPermissions {
  master: {
    tank: boolean;
    product: boolean;
    mpd: boolean;
    employee: boolean;
    shifts: boolean;
    user: boolean;
    vehicles: boolean;
  };
  dailyOperation: {
    employeeAssign: boolean;
    cashCollection: boolean;
    creditSales: boolean;
    ownUsage: boolean;
    fuelTesting: boolean;
  };
  sales: {
    fuelSale: boolean;
    oilSale: boolean;
  };
  purchase: {
    fuelPurchase: boolean;
    oilPurchase: boolean;
    tankerLoad: boolean;
  };
  vouchers: {
    expenses: boolean;
    payment: boolean;
    receipt: boolean;
  };
  reports: {
    viewReports: boolean;
    exportReports: boolean;
  };
  settings: {
    viewSettings: boolean;
    editSettings: boolean;
  };
}

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  permissions: UserPermissions;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  master: { tank: true, product: true, mpd: true, employee: true, shifts: true, user: true, vehicles: true },
  dailyOperation: { employeeAssign: true, cashCollection: true, creditSales: true, ownUsage: true, fuelTesting: true },
  sales: { fuelSale: true, oilSale: true },
  purchase: { fuelPurchase: true, oilPurchase: true, tankerLoad: true },
  vouchers: { expenses: true, payment: true, receipt: true },
  reports: { viewReports: true, exportReports: true },
  settings: { viewSettings: true, editSettings: true },
};



export function UserMaster() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination & Filter states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // View modal
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Reset password modal
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    isActive: true,
  });
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchUsers({
        page,
        size: pageSize,
        search,
        role: roleFilter,
        sortBy,
        sortDir,
      });

      const parsedUsers: UserData[] = response.content.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        phone: u.phone,
        isActive: u.isActive,
        isLocked: Boolean((u as any).isLocked),
        lastLoginAt: (u as any).lastLoginAt || null,
        lastLoginIp: (u as any).lastLoginIp || null,
        permissions: u.permissionsJson ? JSON.parse(u.permissionsJson) : DEFAULT_PERMISSIONS,
      }));

      setUsers(parsedUsers);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load users from API:', err);
      setUsers([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, search, roleFilter, sortBy, sortDir]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val);
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
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'Operator',
      phone: '',
      isActive: true,
    });
    setPermissions(DEFAULT_PERMISSIONS);
    setEditingUser(null);
    setShowAddDialog(true);
  };

  const handleEdit = (user: UserData) => {
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    });
    setPermissions(user.permissions);
    setEditingUser(user);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserApi(id);
      } catch (err) {
        console.warn('API delete failed');
      }
      loadUsers();
    }
  };

  const handleView = (user: UserData) => {
    setViewingUser(user);
    setShowViewDialog(true);
  };

  const handleToggleLock = async (user: UserData) => {
    const action = user.isLocked ? 'Unlock' : 'Lock';
    if (!confirm(`${action} account for ${user.name}?`)) return;
    try {
      await toggleUserLockApi(user.id);
      toast.success(`Account ${action.toLowerCase()}ed successfully`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action.toLowerCase()} account`);
    }
  };

  const handleOpenResetPassword = (user: UserData) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setShowNewPassword(false);
    setShowResetDialog(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    try {
      await resetUserPasswordApi(resetPasswordUser.id, newPassword);
      toast.success(`Password reset for ${resetPasswordUser.name}`);
      setShowResetDialog(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const toggleUserStatus = async (user: UserData) => {
    try {
      await updateUserApi(user.id, {
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: !user.isActive,
        permissionsJson: JSON.stringify(user.permissions),
      });
    } catch (err) {
      console.warn('API status update failed');
    }
    loadUsers();
  };

  const handleRoleChange = (role: string) => {
    setFormData({ ...formData, role });
  };

  const updatePermission = (section: keyof UserPermissions, key: string, value: boolean) => {
    setPermissions({
      ...permissions,
      [section]: {
        ...permissions[section],
        [key]: value,
      },
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.role) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.warning('Please enter a valid email address');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      toast.warning('Please enter a valid 10-digit phone number');
      return;
    }

    // --- Client-side uniqueness pre-checks ---
    const currentId = editingUser?.id;

    const duplicateUsername = users.find(
      u => u.username.toLowerCase() === formData.username.trim().toLowerCase() && u.id !== currentId
    );
    if (duplicateUsername) {
      toast.warning(`Username "${formData.username.trim()}" is already taken. Please choose a different username.`, {
        duration: 4000,
      });
      return;
    }

    const duplicateEmail = users.find(
      u => u.email.toLowerCase() === formData.email.trim().toLowerCase() && u.id !== currentId
    );
    if (duplicateEmail) {
      toast.warning(`Email "${formData.email.trim()}" is already registered. Please use a different email address.`, {
        duration: 4000,
      });
      return;
    }

    if (formData.phone.trim()) {
      const duplicatePhone = users.find(
        u => u.phone === formData.phone.trim() && u.id !== currentId
      );
      if (duplicatePhone) {
        toast.warning(`Phone number "${formData.phone.trim()}" is already in use. Please enter a different number.`, {
          duration: 4000,
        });
        return;
      }
    }
    // --- End uniqueness checks ---

    const payload = {
      name: formData.name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      role: formData.role,
      phone: formData.phone.trim(),
      isActive: formData.isActive,
      permissionsJson: JSON.stringify(permissions),
    };

    try {
      if (editingUser) {
        await updateUserApi(editingUser.id, payload);
        toast.success('User account updated successfully');
      } else {
        await createUserApi(payload);
        toast.success('User account created successfully');
      }
      setShowAddDialog(false);
      loadUsers();
    } catch (err: any) {
      // Backend duplicate errors shown as warnings, not generic errors
      const msg: string = err.message || 'Failed to save user account';
      const isDuplicate = msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already in use');
      if (isDuplicate) {
        toast.warning(msg, { duration: 4000 });
      } else {
        toast.error(msg);
      }
    }
  };


  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">User Master</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user name, username, email, phone..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Operator">Operator</SelectItem>
                <SelectItem value="Cashier">Cashier</SelectItem>
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

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th
                  onClick={() => handleSortToggle('name')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Name
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('username')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Username
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-left p-4 font-medium">Email</th>
                <th
                  onClick={() => handleSortToggle('role')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Role
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-left p-4 font-medium">Phone</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No users matching criteria found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4">
                      <span className="font-mono text-sm">{user.username}</span>
                    </td>
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Admin' ? 'bg-purple-500/10 text-purple-500' :
                        user.role === 'Manager' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{user.phone}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => handleView(user)}
                          className="p-1.5 hover:bg-sky-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-sky-500" />
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        {/* Lock / Unlock */}
                        <button
                          onClick={() => handleToggleLock(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isLocked
                              ? 'hover:bg-amber-500/10 text-amber-500'
                              : 'hover:bg-slate-500/10 text-slate-400'
                          }`}
                          title={user.isLocked ? 'Unlock Account' : 'Lock Account'}
                        >
                          {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        {/* Reset Password */}
                        <button
                          onClick={() => handleOpenResetPassword(user)}
                          className="p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4 text-purple-500" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id)}
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
            Showing {totalElements === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} users
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

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user account information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Operator">Operator</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? 'Update' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── View Details Dialog ─────────────────────────────── */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-2">
              {/* Profile header */}
              <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-border">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {viewingUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{viewingUser.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">@{viewingUser.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewingUser.role === 'Admin' ? 'bg-purple-500/10 text-purple-500' :
                      viewingUser.role === 'Manager' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      <Shield className="w-3 h-3" />{viewingUser.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewingUser.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {viewingUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {viewingUser.isLocked && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium truncate">{viewingUser.email}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm font-medium">{viewingUser.phone || '—'}</p>
                </div>
              </div>

              {/* Last login */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5" /> Session Info
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm font-medium">
                      {viewingUser.lastLoginAt && !viewingUser.lastLoginAt.startsWith('password_reset')
                        ? new Date(viewingUser.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" /> IP Address</p>
                    <p className="text-sm font-medium font-mono">{viewingUser.lastLoginIp || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {viewingUser && (
              <Button variant="outline" onClick={() => { setShowViewDialog(false); handleEdit(viewingUser); }}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ───────────────────────────── */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} className="bg-purple-600 hover:bg-purple-700">
              <KeyRound className="w-4 h-4 mr-2" /> Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
