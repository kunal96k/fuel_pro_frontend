import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  IndianRupee,
  Plus,
  Calendar,
  Clock,
  User,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  Package,
  Download,
  FileDown,
  CheckSquare,
  ChevronDown,
  Check
} from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface CreditSalesRecord {
  id: string;
  date: string;
  customer: string;
  slipNo: string;
  productType: string;
  quantity: number;
  saleTime: string;
  totalAmount: number;
  status: 'completed' | 'pending' | 'verified';
}

export function CreditSales() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [truckNumbers, setTruckNumbers] = useState<string[]>([
    'MH-12-AB-1234',
    'DL-01-CD-5678',
    'KA-03-EF-9012',
    'TN-09-GH-3456',
    'GJ-27-IJ-7890'
  ]);
  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    customer: '',
    voucherNo: '',
    slipNo: '',
    productType: '',
    quantity: '',
    ratePerUnit: '',
    totalAmount: '',
    mpd: '',
    nozzle: '',
    truckNumber: '',
    date: '',
    time: ''
  });

  // Customer list
  const customers = [
    'Sharma Transport',
    'ABC Logistics',
    'Patel Industries',
    'XYZ Logistics',
    'Gupta Industries',
    'Singh Transport Co.',
    'Kumar & Sons',
    'Reddy Logistics'
  ];

  // MPD list
  const mpdList = ['MPD-001', 'MPD-002', 'MPD-003', 'MPD-004'];

  // Nozzle list
  const nozzleList = ['Nozzle-1', 'Nozzle-2', 'Nozzle-3', 'Nozzle-4', 'Nozzle-5', 'Nozzle-6'];

  // Fuel rates (should match the rates from Sidebar)
  const fuelRates: { [key: string]: number } = {
    'Diesel': 92.75,
    'Petrol': 105.50,
    'Premium': 110.00,
    'Engine Oil': 450.00,
    'Lubricant': 380.00
  };

  // Generate next voucher number
  const generateVoucherNumber = () => {
    const lastRecord = records.length > 0 ? records[0] : null;
    let lastNumber = 0;
    
    if (lastRecord && lastRecord.id.startsWith('CS')) {
      lastNumber = parseInt(lastRecord.id.substring(2)) || 0;
    }
    
    const nextNumber = lastNumber + 1;
    return `CS${String(nextNumber).padStart(5, '0')}`;
  };

  // Auto-set date and time when dialog opens
  React.useEffect(() => {
    if (showAddForm) {
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        voucherNo: generateVoucherNumber(),
        slipNo: '',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        ratePerUnit: ''
      }));
    }
  }, [showAddForm]);

  // Mock data for credit sales records
  const records: CreditSalesRecord[] = [
    {
      id: 'CS-2024-045',
      date: '2024-03-05',
      customer: 'Sharma Transport',
      slipNo: 'SLIP-2024-045',
      productType: 'Diesel',
      quantity: 500,
      saleTime: '14:15',
      totalAmount: 45000.00,
      status: 'completed'
    },
    {
      id: 'CS-2024-044',
      date: '2024-03-05',
      customer: 'ABC Logistics',
      slipNo: 'SLIP-2024-044',
      productType: 'Petrol',
      quantity: 300,
      saleTime: '12:30',
      totalAmount: 30000.00,
      status: 'verified'
    },
    {
      id: 'CS-2024-043',
      date: '2024-03-05',
      customer: 'Patel Industries',
      slipNo: 'SLIP-2024-043',
      productType: 'Diesel',
      quantity: 750,
      saleTime: '10:20',
      totalAmount: 67500.00,
      status: 'verified'
    },
    {
      id: 'CS-2024-042',
      date: '2024-03-04',
      customer: 'Kumar Enterprises',
      slipNo: 'SLIP-2024-042',
      productType: 'Diesel',
      quantity: 600,
      saleTime: '16:10',
      totalAmount: 54000.00,
      status: 'verified'
    },
    {
      id: 'CS-2024-041',
      date: '2024-03-04',
      customer: 'Singh Motors',
      slipNo: 'SLIP-2024-041',
      productType: 'Petrol',
      quantity: 400,
      saleTime: '14:45',
      totalAmount: 40000.00,
      status: 'verified'
    },
    {
      id: 'CS-2024-040',
      date: '2024-03-04',
      customer: 'Mehta Transport',
      slipNo: 'SLIP-2024-040',
      productType: 'Diesel',
      quantity: 550,
      saleTime: '11:15',
      totalAmount: 49500.00,
      status: 'verified'
    },
    {
      id: 'CS-2024-039',
      date: '2024-03-03',
      customer: 'Verma Logistics',
      slipNo: 'SLIP-2024-039',
      productType: 'Diesel',
      quantity: 650,
      saleTime: '15:05',
      totalAmount: 58500.00,
      status: 'verified'
    },
    {
      id: 'CS-2024-038',
      date: '2024-03-03',
      customer: 'Gupta Industries',
      slipNo: 'SLIP-2024-038',
      productType: 'Petrol',
      quantity: 350,
      saleTime: '09:40',
      totalAmount: 35000.00,
      status: 'verified'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return `${formattedDate}, ${time}`;
  };

  const filteredRecords = records.filter(record => 
    record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.slipNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort records in descending order (newest first)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    // Create full date-time objects for accurate comparison
    const dateTimeA = new Date(`${a.date}T${a.saleTime}`);
    const dateTimeB = new Date(`${b.date}T${b.saleTime}`);
    
    // Sort descending (newest first)
    return dateTimeB.getTime() - dateTimeA.getTime();
  });

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Get current time
    const now = new Date();
    const saleTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    // Add new truck number to list if it doesn't exist
    if (formData.truckNumber && !truckNumbers.includes(formData.truckNumber)) {
      setTruckNumbers([...truckNumbers, formData.truckNumber]);
    }
    
    // Handle form submission here
    console.log('Form submitted:', {
      ...formData,
      saleTime
    });
    
    setShowAddForm(false);
    setFormData({
      customer: '',
      voucherNo: '',
      slipNo: '',
      productType: '',
      quantity: '',
      ratePerUnit: '',
      totalAmount: '',
      mpd: '',
      nozzle: '',
      truckNumber: '',
      date: '',
      time: ''
    });
  };

  // Auto-update rate when product type changes
  React.useEffect(() => {
    if (formData.productType && fuelRates[formData.productType]) {
      setFormData(prev => ({
        ...prev,
        ratePerUnit: fuelRates[formData.productType].toFixed(2)
      }));
    }
  }, [formData.productType]);

  const calculateAmount = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.ratePerUnit) || 0;
    const total = quantity * rate;
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  };

  const handleQuantityChange = (value: string) => {
    setFormData({...formData, quantity: value, totalAmount: ''});
  };

  const handleTotalAmountChange = (value: string) => {
    setFormData({...formData, totalAmount: value, quantity: ''});
  };

  const getDisplayTotal = () => {
    if (formData.totalAmount) {
      const total = parseFloat(formData.totalAmount) || 0;
      return Math.round(total * 100) / 100; // Round to 2 decimal places
    }
    return calculateAmount();
  };

  const getDisplayQuantity = () => {
    if (formData.quantity) {
      return formData.quantity;
    }
    // Calculate quantity from total amount if total is entered
    if (formData.totalAmount && formData.ratePerUnit) {
      const total = parseFloat(formData.totalAmount) || 0;
      const rate = parseFloat(formData.ratePerUnit) || 0;
      if (rate > 0) {
        return (total / rate).toFixed(2);
      }
    }
    return '';
  };

  const handleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecords.size === paginatedRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(paginatedRecords.map(r => r.id)));
    }
  };

  const handleExportAll = () => {
    console.log('Exporting all records:', sortedRecords);
    // Implement export logic here
    alert('Exporting all records...');
  };

  const handleExportSelected = () => {
    const selectedData = sortedRecords.filter(r => selectedRecords.has(r.id));
    console.log('Exporting selected records:', selectedData);
    // Implement export logic here
    if (selectedRecords.size === 0) {
      alert('Please select records to export');
    } else {
      alert(`Exporting ${selectedRecords.size} selected record(s)...`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credit Sales</p>
                  <h3 className="mt-1">₹3,80,000</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Slips</p>
                  <h3 className="mt-1">48</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <h3 className="mt-1">40</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Sale</p>
                  <h3 className="mt-1">₹52,450</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by slip, customer, or product..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleExportAll}>
              <FileDown className="w-4 h-4 mr-2" />
              Export All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportSelected}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Export Selected {selectedRecords.size > 0 && `(${selectedRecords.size})`}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Records List */}
      <Card>
        <CardContent className="pt-6">
          {/* Table Header */}
          <div className="grid grid-cols-[50px_60px_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b bg-muted/30 text-sm font-bold text-muted-foreground">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedRecords.size === paginatedRecords.length && paginatedRecords.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>S.No</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Customer</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto hover:bg-muted">
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>Slip No</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto hover:bg-muted">
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Product</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto hover:bg-muted">
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Date & Time</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto hover:bg-muted">
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <IndianRupee className="w-4 h-4" />
              <span>Total Amount</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2 hover:bg-muted">
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="w-28 text-center">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-0">
            {paginatedRecords.map((record, index) => (
              <div 
                key={record.id}
                className="grid grid-cols-[50px_60px_1fr_1fr_1fr_1fr_1fr_auto] gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors items-center"
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedRecords.has(record.id)}
                    onChange={() => handleSelectRecord(record.id)}
                    className="w-4 h-4 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="font-semibold text-muted-foreground">
                  {startIndex + index + 1}
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {record.customer.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{record.customer}</span>
                </div>
                
                <div className="font-medium text-foreground">{record.slipNo}</div>
                
                <div className="font-medium text-foreground">{record.productType}</div>
                
                <div className="font-medium text-foreground">{formatDateTime(record.date, record.saleTime)}</div>
                
                <div className="font-semibold text-blue-600 text-right">{formatCurrency(record.totalAmount)}</div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No credit sales records found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Click "Add New" to create your first record'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {sortedRecords.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedRecords.length)} of {sortedRecords.length} entries
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Credit Sale Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Add New Credit Sale</DialogTitle>
            <DialogDescription className="sr-only">
              Enter the credit sale details below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Voucher Number, Slip Number, Date & Time Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voucherNo">Voucher Number</Label>
                  <Input
                    id="voucherNo"
                    placeholder="CS00001"
                    value={formData.voucherNo}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slipNo">Slip Number</Label>
                  <Input
                    id="slipNo"
                    placeholder="SLIP-2024-001"
                    value={formData.slipNo}
                    onChange={(e) => setFormData({...formData, slipNo: e.target.value})}
                    required
                    className="border border-blue-200 focus:border-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Customer Name and Truck Number side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Select 
                    value={formData.customer} 
                    onValueChange={(value) => setFormData({...formData, customer: value})}
                  >
                    <SelectTrigger id="customer" className="border border-blue-200 focus:border-blue-400">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="truckNumber">Truck Number</Label>
                  <Popover open={showTruckDropdown} onOpenChange={setShowTruckDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={showTruckDropdown}
                        className="w-full justify-between border border-blue-200 focus:border-blue-400 hover:bg-transparent"
                      >
                        {formData.truckNumber || "Select or type truck number"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search or type new truck number..." 
                          value={formData.truckNumber}
                          onValueChange={(value) => setFormData({...formData, truckNumber: value.toUpperCase()})}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-sm">
                              <p className="mb-2">No truck number found.</p>
                              <Button
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  if (formData.truckNumber) {
                                    setShowTruckDropdown(false);
                                  }
                                }}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add "{formData.truckNumber}"
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {truckNumbers.map((truck) => (
                              <CommandItem
                                key={truck}
                                value={truck}
                                onSelect={() => {
                                  setFormData({...formData, truckNumber: truck});
                                  setShowTruckDropdown(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.truckNumber === truck ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {truck}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Product, Rate, Quantity and Total in one row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select 
                    value={formData.productType} 
                    onValueChange={(value) => setFormData({...formData, productType: value})}
                  >
                    <SelectTrigger id="productType" className="border border-blue-200 focus:border-blue-400">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Engine Oil">Engine Oil</SelectItem>
                      <SelectItem value="Lubricant">Lubricant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ratePerUnit" className="text-right block">Rate per Unit (₹)</Label>
                  <Input
                    id="ratePerUnit"
                    type="text"
                    placeholder="0.00"
                    value={formData.ratePerUnit ? parseFloat(formData.ratePerUnit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    disabled
                    className="bg-muted text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-right block">Quantity (Liters)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={getDisplayQuantity()}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="border border-blue-200 focus:border-blue-400 text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount" className="text-right block">Total Amount (₹)</Label>
                  <Input
                    id="totalAmount"
                    type="text"
                    placeholder="0.00"
                    value={
                      formData.totalAmount 
                        ? parseFloat(formData.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : (formData.quantity ? getDisplayTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      handleTotalAmountChange(value);
                    }}
                    className="border border-blue-200 focus:border-blue-400 font-semibold text-right"
                  />
                </div>
              </div>

              {/* MPD and Nozzle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpd">MPD</Label>
                  <Select 
                    value={formData.mpd} 
                    onValueChange={(value) => setFormData({...formData, mpd: value})}
                  >
                    <SelectTrigger id="mpd" className="border border-blue-200 focus:border-blue-400">
                      <SelectValue placeholder="Select MPD" />
                    </SelectTrigger>
                    <SelectContent>
                      {mpdList.map(mpd => (
                        <SelectItem key={mpd} value={mpd}>{mpd}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nozzle">Nozzle</Label>
                  <Select 
                    value={formData.nozzle} 
                    onValueChange={(value) => setFormData({...formData, nozzle: value})}
                  >
                    <SelectTrigger id="nozzle" className="border border-blue-200 focus:border-blue-400">
                      <SelectValue placeholder="Select nozzle" />
                    </SelectTrigger>
                    <SelectContent>
                      {nozzleList.map(nozzle => (
                        <SelectItem key={nozzle} value={nozzle}>{nozzle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}