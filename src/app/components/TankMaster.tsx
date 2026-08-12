import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchTanks, createTankApi, updateTankApi, deleteTankApi, Tank, fetchProducts, Product } from '../services/api';
import { toast } from 'sonner';



export function TankMaster() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [fuelProducts, setFuelProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination, Filter, Search, Sort states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Dialog & Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [formData, setFormData] = useState({
    tankName: '',
    fuelType: '',
    capacity: '',
    openingQuantity: '',
  });

  const loadTanks = async () => {
    setLoading(true);
    try {
      const response = await fetchTanks({
        page,
        size: pageSize,
        search,
        fuelType: fuelTypeFilter,
        sortBy,
        sortDir,
      });
      setTanks(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load tanks from API:', err);
      setTanks([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadFuelProducts = async () => {
    try {
      const response = await fetchProducts({ size: 1000, category: 'Fuel' });
      const fuels = response.content.filter(p => p.category?.toLowerCase() === 'fuel');
      setFuelProducts(fuels);
    } catch (err) {
      console.error('Failed to load products for fuel types:', err);
    }
  };

  useEffect(() => {
    loadFuelProducts();
  }, []);

  useEffect(() => {
    loadTanks();
  }, [page, pageSize, search, fuelTypeFilter, sortBy, sortDir]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleFuelFilterChange = (val: string) => {
    setFuelTypeFilter(val);
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
      tankName: '',
      fuelType: '',
      capacity: '',
      openingQuantity: '',
    });
    setEditingTank(null);
    setShowAddDialog(true);
  };

  const handleEdit = (tank: Tank) => {
    setFormData({
      tankName: tank.tankName,
      fuelType: tank.fuelType,
      capacity: tank.capacity.toString(),
      openingQuantity: tank.openingQuantity.toString(),
    });
    setEditingTank(tank);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('⚠️ WARNING: Deleting this tank will soft-delete it to preserve its historical dip readings, but all active nozzles connected to this tank will be removed from the MPD configuration.\n\nAre you sure you want to delete this tank?')) {
      try {
        await deleteTankApi(id);
        toast.success('Tank deleted successfully.');
        loadTanks();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete tank. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.tankName || !formData.fuelType || !formData.capacity || !formData.openingQuantity) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.tankName.trim().length > 50) {
      toast.error('Tank name cannot exceed 50 characters!');
      return;
    }

    const duplicate = tanks.find(
      t => t.tankName.trim().toLowerCase() === formData.tankName.trim().toLowerCase() &&
        (!editingTank || t.id !== editingTank.id)
    );
    if (duplicate) {
      toast.warning(`Tank with name "${formData.tankName}" already exists!`);
      return;
    }

    const tankPayload = {
      tankName: formData.tankName,
      fuelType: formData.fuelType,
      capacity: parseFloat(formData.capacity),
      openingQuantity: parseFloat(formData.openingQuantity),
    };

    if (editingTank) {
      try {
        await updateTankApi(editingTank.id, tankPayload);
        toast.success('Tank updated successfully!');
      } catch (err) {
        console.warn('API update failed, updating UI locally');
        toast.error('Failed to update tank.');
      }
    } else {
      try {
        await createTankApi(tankPayload);
        toast.success('Tank created successfully!');
      } catch (err) {
        console.warn('API create failed, updating UI locally');
        toast.error('Failed to create tank.');
      }
    }

    setShowAddDialog(false);
    loadTanks();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">Tank Master</h1>
          <p className="text-muted-foreground">Manage fuel tanks installed in the fuel station</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Tank
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tank name or fuel type..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select value={fuelTypeFilter} onValueChange={handleFuelFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Fuel Types</SelectItem>
                {fuelProducts.map((prod) => (
                  <SelectItem key={prod.id} value={prod.name}>
                    {prod.name}
                  </SelectItem>
                ))}
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
                  onClick={() => handleSortToggle('tankName')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Tank Name
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('fuelType')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Fuel Type
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('capacity')}
                  className="text-right p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Capacity (L)
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('openingQuantity')}
                  className="text-right p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Opening Quantity (L)
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-right p-4 font-medium">Available (%)</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading tanks...
                  </td>
                </tr>
              ) : tanks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No tanks matching criteria found
                  </td>
                </tr>
              ) : (
                tanks.map((tank) => {
                  const availablePercent = tank.capacity > 0
                    ? ((tank.openingQuantity / tank.capacity) * 100).toFixed(1)
                    : '0';
                  return (
                    <tr key={tank.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{tank.tankName}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tank.fuelType?.toLowerCase().includes('petrol') ? 'bg-green-500/10 text-green-500' :
                          tank.fuelType?.toLowerCase().includes('diesel') ? 'bg-blue-500/10 text-blue-500' :
                            'bg-purple-500/10 text-purple-500'
                          }`}>
                          {tank.fuelType}
                        </span>
                      </td>
                      <td className="p-4 text-right">{formatNumber(tank.capacity)}</td>
                      <td className="p-4 text-right">{formatNumber(tank.openingQuantity)}</td>
                      <td className="p-4 text-right">
                        <span className={`font-medium ${parseFloat(availablePercent) < 20 ? 'text-red-500' :
                          parseFloat(availablePercent) < 50 ? 'text-amber-500' :
                            'text-green-500'
                          }`}>
                          {availablePercent}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(tank)}
                            className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(tank.id)}
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
            Showing {totalElements === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} tanks
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTank ? 'Edit Tank' : 'Add New Tank'}</DialogTitle>
            <DialogDescription>
              {editingTank ? 'Update tank information' : 'Add a new fuel tank to the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tankName">Tank Name <span className="text-red-500">*</span></Label>
                <span className={`text-[11px] font-mono ${formData.tankName.length >= 50 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  {formData.tankName.length}/50 chars
                </span>
              </div>
              <Input
                id="tankName"
                value={formData.tankName}
                maxLength={50}
                onChange={(e) => setFormData({ ...formData, tankName: e.target.value })}
                placeholder="Enter tank name (max 50 chars)"
              />
              {formData.tankName.length >= 50 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Maximum limit of 50 characters reached.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fuelType">Fuel Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
              >
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelProducts.length === 0 ? (
                    <SelectItem value="NO_PRODUCTS" disabled>
                      No fuel products found
                    </SelectItem>
                  ) : (
                    fuelProducts.map((prod) => (
                      <SelectItem key={prod.id} value={prod.name}>
                        {prod.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity (Litres) <span className="text-red-500">*</span></Label>
              <Input
                id="capacity"
                type="number"
                step="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Enter capacity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="openingQuantity">Opening Quantity (Litres) <span className="text-red-500">*</span></Label>
              <Input
                id="openingQuantity"
                type="number"
                step="1"
                value={formData.openingQuantity}
                onChange={(e) => setFormData({ ...formData, openingQuantity: e.target.value })}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Enter opening quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTank ? 'Update' : 'Add Tank'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
