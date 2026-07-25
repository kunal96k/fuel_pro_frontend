import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Car, Truck, Bike, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { fetchVehicles, createVehicleApi, updateVehicleApi, deleteVehicleApi, Vehicle, formatDateToDMY } from '../services/api';



export function VehiclesMaster() {
  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination & Filter states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expiredInsuranceFilter, setExpiredInsuranceFilter] = useState<boolean>(false);
  const [expiredPucFilter, setExpiredPucFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    make: '',
    model: '',
    year: '',
    fuelType: '',
    capacity: '',
    mileage: '',
    color: '',
    chassisNumber: '',
    engineNumber: '',
    insuranceExpiry: '',
    pucExpiry: '',
    status: 'Active',
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetchVehicles({
        page,
        size: pageSize,
        search,
        vehicleType: vehicleTypeFilter,
        status: statusFilter,
        expiredInsurance: expiredInsuranceFilter,
        expiredPuc: expiredPucFilter,
        sortBy,
        sortDir,
      });
      setVehicles(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load vehicles from API:', err);
      setVehicles([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [page, pageSize, search, vehicleTypeFilter, statusFilter, expiredInsuranceFilter, expiredPucFilter, sortBy, sortDir]);

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

  const handleAdd = () => {
    setFormData({
      vehicleNumber: '',
      vehicleType: '',
      make: '',
      model: '',
      year: '',
      fuelType: '',
      capacity: '',
      mileage: '',
      color: '',
      chassisNumber: '',
      engineNumber: '',
      insuranceExpiry: '',
      pucExpiry: '',
      status: 'Active',
    });
    setEditingVehicle(null);
    setShowAddDialog(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType,
      capacity: vehicle.capacity,
      mileage: vehicle.mileage,
      color: vehicle.color,
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      insuranceExpiry: vehicle.insuranceExpiry,
      pucExpiry: vehicle.pucExpiry,
      status: vehicle.status,
    });
    setEditingVehicle(vehicle);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicleApi(id);
      } catch (err) {
        console.warn('API delete failed');
      }
      loadVehicles();
    }
  };

  const handleSave = async () => {
    if (!formData.vehicleNumber.trim() || !formData.vehicleType || !formData.make.trim() || !formData.model.trim()) {
      toast.warning('Please fill in all required fields');
      return;
    }

    const payload = {
      vehicleNumber: formData.vehicleNumber.trim(),
      vehicleType: formData.vehicleType,
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: formData.year.trim(),
      fuelType: formData.fuelType,
      capacity: formData.capacity,
      mileage: formData.mileage,
      color: formData.color.trim(),
      chassisNumber: formData.chassisNumber.trim(),
      engineNumber: formData.engineNumber.trim(),
      insuranceExpiry: formData.insuranceExpiry,
      pucExpiry: formData.pucExpiry,
      status: formData.status,
    };

    try {
      if (editingVehicle) {
        await updateVehicleApi(editingVehicle.id, payload);
        toast.success('Vehicle updated successfully');
      } else {
        await createVehicleApi(payload);
        toast.success('Vehicle created successfully');
      }
      setShowAddDialog(false);
      loadVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vehicle');
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'Car':
        return Car;
      case 'Truck':
        return Truck;
      case 'Bike':
        return Bike;
      default:
        return Car;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">Vehicles Master</h1>
          <p className="text-muted-foreground">Manage station fleet and customer vehicle records</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Vehicle
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vehicle number, make, model, chassis..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <div className="w-40">
            <Select value={vehicleTypeFilter} onValueChange={(v) => { setVehicleTypeFilter(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={statusFilter} onValueChange={(s) => { setStatusFilter(s); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 border-l border-border pl-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
              <Checkbox
                id="expired-insurance-checkbox"
                checked={expiredInsuranceFilter}
                onCheckedChange={(checked) => {
                  setExpiredInsuranceFilter(!!checked);
                  setPage(0);
                }}
              />
              <span className={expiredInsuranceFilter ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                Expired Insurance
              </span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
              <Checkbox
                id="expired-puc-checkbox"
                checked={expiredPucFilter}
                onCheckedChange={(checked) => {
                  setExpiredPucFilter(!!checked);
                  setPage(0);
                }}
              />
              <span className={expiredPucFilter ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                Expired PUC
              </span>
            </label>
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
                  onClick={() => handleSortToggle('vehicleNumber')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Vehicle Number
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('vehicleType')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Type
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-left p-4 font-medium">Make & Model</th>
                <th className="text-left p-4 font-medium">Fuel Type</th>
                <th className="text-left p-4 font-medium">Chassis / Engine</th>
                <th className="text-left p-4 font-medium">Expiries</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No vehicles matching criteria found
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => {
                  const VehicleIcon = getVehicleIcon(vehicle.vehicleType);
                  return (
                    <tr key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono font-medium">{vehicle.vehicleNumber}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                          <VehicleIcon className="w-3.5 h-3.5" />
                          {vehicle.vehicleType}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        {vehicle.make} {vehicle.model} ({vehicle.year || '-'})
                      </td>
                      <td className="p-4 text-sm">{vehicle.fuelType}</td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        <div>C: {vehicle.chassisNumber || '-'}</div>
                        <div>E: {vehicle.engineNumber || '-'}</div>
                      </td>
                      <td className="p-4 text-xs space-y-1">
                        <div className={isExpired(vehicle.insuranceExpiry) ? 'text-red-600 font-medium flex items-center gap-1.5' : 'text-muted-foreground'}>
                          <span>Ins: {formatDateToDMY(vehicle.insuranceExpiry)}</span>
                          {isExpired(vehicle.insuranceExpiry) && (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Expired</span>
                          )}
                        </div>
                        <div className={isExpired(vehicle.pucExpiry) ? 'text-red-600 font-medium flex items-center gap-1.5' : 'text-muted-foreground'}>
                          <span>PUC: {formatDateToDMY(vehicle.pucExpiry)}</span>
                          {isExpired(vehicle.pucExpiry) && (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Expired</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vehicle.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                          vehicle.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
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
            Showing {totalElements === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} vehicles
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
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            <DialogDescription>
              {editingVehicle ? 'Update vehicle details' : 'Add a new vehicle to the station records'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicleNumber">Vehicle Number <span className="text-red-500">*</span></Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="Enter vehicle number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicleType">Vehicle Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(val) => setFormData({ ...formData, vehicleType: val })}
                >
                  <SelectTrigger id="vehicleType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="make">Make <span className="text-red-500">*</span></Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Enter make"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model <span className="text-red-500">*</span></Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Enter model"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Manufacturing Year</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="Enter manufacturing year"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Input
                  id="fuelType"
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  placeholder="Enter fuel type"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Tank Capacity</Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Enter tank capacity"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="chassisNumber">Chassis Number</Label>
                <Input
                  id="chassisNumber"
                  value={formData.chassisNumber}
                  onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                  placeholder="Enter chassis number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="engineNumber">Engine Number</Label>
                <Input
                  id="engineNumber"
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                  placeholder="Enter engine number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pucExpiry">PUC Expiry Date</Label>
                <Input
                  id="pucExpiry"
                  type="date"
                  value={formData.pucExpiry}
                  onChange={(e) => setFormData({ ...formData, pucExpiry: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingVehicle ? 'Update' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
