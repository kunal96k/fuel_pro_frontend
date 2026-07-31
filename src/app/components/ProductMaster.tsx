import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { fetchProducts, createProductApi, updateProductApi, deleteProductApi, Product } from '../services/api';
import { toast } from 'sonner';



export function ProductMaster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination, Search, Filter, Sort states
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Dialog & Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    hsnCode: '',
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetchProducts({
        page,
        size: pageSize,
        search,
        category: categoryFilter,
        sortBy,
        sortDir,
      });
      setProducts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load products from API:', err);
      setProducts([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, pageSize, search, categoryFilter, sortBy, sortDir]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
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
      category: '',
      unit: 'Litre',
      hsnCode: '',
    });
    setEditingProduct(null);
    setShowAddDialog(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      hsnCode: product.hsnCode,
    });
    setEditingProduct(product);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('⚠️ WARNING: Deleting this product will soft-delete it and its associated tanks to preserve rate and dip history, but active nozzles connected to those tanks will be removed from the MPD configuration.\n\nAre you sure you want to delete this product?')) {
      try {
        await deleteProductApi(id);
        toast.success('Product deleted successfully.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete product.');
      }
      loadProducts();
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.unit) {
      toast.error('Please fill in all required fields');
      return;
    }

    const duplicate = products.find(
      p => p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
      (!editingProduct || p.id !== editingProduct.id)
    );
    if (duplicate) {
      toast.warning(`Product with name "${formData.name}" already exists!`);
      return;
    }

    const productPayload = {
      name: formData.name,
      category: formData.category as 'Fuel' | 'Oil & Lubes',
      unit: formData.unit,
      hsnCode: formData.hsnCode,
    };

    if (editingProduct) {
      try {
        await updateProductApi(editingProduct.id, productPayload);
        toast.success('Product updated successfully!');
      } catch (err) {
        console.warn('API update failed, updating UI locally');
        toast.error('Failed to update product.');
      }
    } else {
      try {
        await createProductApi(productPayload);
        toast.success('Product created successfully!');
      } catch (err) {
        console.warn('API create failed, updating UI locally');
        toast.error('Failed to create product.');
      }
    }

    setShowAddDialog(false);
    loadProducts();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-2">Product Master</h1>
          <p className="text-muted-foreground">Manage fuel types and oil & lubricants products</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Product
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product name, unit, HSN..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="Oil & Lubes">Oil & Lubes</SelectItem>
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
                  onClick={() => handleSortToggle('name')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Product Name
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('category')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Category
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('unit')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Unit
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('hsnCode')}
                  className="text-left p-4 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    HSN Code
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No products matching criteria found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.category === 'Fuel' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">{product.unit}</td>
                    <td className="p-4 font-mono text-sm">{product.hsnCode}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
            Showing {totalElements === 0 ? 0 : page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} products
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
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Add a new product to the system'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fuel">Fuel</SelectItem>
                  <SelectItem value="Oil & Lubes">Oil & Lubes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit <span className="text-red-500">*</span></Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Litre">Litre</SelectItem>
                  <SelectItem value="Piece">Piece</SelectItem>
                  <SelectItem value="Carton">Carton</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="Enter HSN Code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? 'Update' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
