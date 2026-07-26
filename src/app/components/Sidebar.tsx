import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  TrendingUp,
  ClipboardList,
  IndianRupee,
  FileText, 
  Workflow, 
  BarChart3, 
  CreditCard, 
  Shield, 
  Settings,
  Building2,
  ChevronDown,
  ChevronRight,
  FileBarChart,
  Sun,
  Moon,
  Fuel,
  Droplets,
  Database
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { fetchShifts, Shift, fetchProducts, Product, fetchTanks, Tank } from '../services/api';
import { toast } from 'sonner';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-blue-500' },
  {
    id: 'master',
    label: 'Master',
    icon: Database,
    iconColor: 'text-teal-500',
    children: [
      { id: 'product', label: 'Product' },
      { id: 'tank', label: 'Tank' },
      { id: 'mpd', label: 'MPD' },
      { id: 'employee', label: 'Employee' },
      { id: 'shifts', label: 'Shifts' },
      { id: 'user', label: 'User' },
      { id: 'vehicles', label: 'Vehicles' },
    ]
  },
  { 
    id: 'daily-operation', 
    label: 'Daily Operation', 
    icon: ClipboardList,
    iconColor: 'text-orange-500',
    children: [
      { id: 'employee-assign', label: 'Employee Assign' },
      { id: 'cash-collection', label: 'Cash Collection' },
      { id: 'credit-sales', label: 'Credit Sales' },
      { id: 'own-usage', label: 'Own Usage' },
      { id: 'fuel-testing', label: 'Fuel Testing' },
    ]
  },
  { 
    id: 'sales', 
    label: 'Sales', 
    icon: TrendingUp,
    iconColor: 'text-green-500',
    children: [
      { id: 'fuel-sale', label: 'Fuel Sale' },
      { id: 'oil-sale', label: 'Oil Sale' },
    ]
  },
  { 
    id: 'purchase', 
    label: 'Purchase', 
    icon: ShoppingCart,
    iconColor: 'text-purple-500',
    children: [
      { id: 'fuel-purchase', label: 'Fuel Purchase' },
      { id: 'oil-purchase', label: 'Oil Purchase' },
      { id: 'tanker-load', label: 'Tanker Load' },
    ]
  },
  {
    id: 'vouchers',
    label: 'Vouchers',
    icon: IndianRupee,
    iconColor: 'text-rose-500',
    children: [
      { id: 'expenses', label: 'Expenses' },
      { id: 'payment', label: 'Payment' },
      { id: 'receipt', label: 'Receipt' },
    ]
  },
  { id: 'density', label: 'Density', icon: Droplets, iconColor: 'text-sky-500' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, iconColor: 'text-violet-500' },
  { id: 'templates', label: 'Templates', icon: FileText, iconColor: 'text-cyan-500' },
  { id: 'sequences', label: 'Sequences', icon: Workflow, iconColor: 'text-pink-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, iconColor: 'text-indigo-500' },
  { id: 'payments', label: 'Payment Portal', icon: CreditCard, iconColor: 'text-emerald-500' },
  { id: 'compliance', label: 'Compliance', icon: Shield, iconColor: 'text-amber-500' },
  { id: 'settings', label: 'Settings', icon: Settings, iconColor: 'text-slate-500' },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showFuelRateDialog, setShowFuelRateDialog] = useState(false);
  const [showTankDipDialog, setShowTankDipDialog] = useState(false);
  const [fuelProducts, setFuelProducts] = useState<Product[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  
  // Helper to format date in IST (YYYY-MM-DD)
  const getISTDateString = (dateObj: Date = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dateObj);
  };

  const [rateDate, setRateDate] = useState(getISTDateString());
  const [dipDate, setDipDate] = useState(getISTDateString());

  // Input states mapping productId to value
  const [ratesInput, setRatesInput] = useState<Record<string, string>>({});
  const [dipsInput, setDipsInput] = useState<Record<string, string>>({});

  // Rates Log Modal state
  const [showRatesLogDialog, setShowRatesLogDialog] = useState(false);
  const [ratesLogPage, setRatesLogPage] = useState(0);
  const [ratesLogTotalPages, setRatesLogTotalPages] = useState(1);
  const [ratesLogData, setRatesLogData] = useState<any[]>([]);
  const [ratesLogFromDate, setRatesLogFromDate] = useState('');
  const [ratesLogToDate, setRatesLogToDate] = useState('');

  // Dips Log Modal state
  const [showDipsLogDialog, setShowDipsLogDialog] = useState(false);
  const [dipsLogPage, setDipsLogPage] = useState(0);
  const [dipsLogTotalPages, setDipsLogTotalPages] = useState(1);
  const [dipsLogData, setDipsLogData] = useState<any[]>([]);
  const [dipsLogFromDate, setDipsLogFromDate] = useState('');
  const [dipsLogToDate, setDipsLogToDate] = useState('');

  // Fetch shifts from the database
  React.useEffect(() => {
    const loadShifts = async () => {
      try {
        const response = await fetchShifts({ size: 50 });
        setShifts(response.content);
      } catch (err) {
        console.error('Failed to load shifts in sidebar:', err);
      }
    };
    loadShifts();
    
    // Periodically sync (every 2 minutes)
    const interval = setInterval(loadShifts, 120000);
    return () => clearInterval(interval);
  }, []);

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load fuel products and tanks on mount
  React.useEffect(() => {
    const loadFuelProducts = async () => {
      try {
        const response = await fetchProducts({ category: 'Fuel', size: 100 });
        setFuelProducts(response.content);
      } catch (err) {
        console.error('Failed to load fuel products in sidebar:', err);
      }
    };
    const loadTanksList = async () => {
      try {
        const response = await fetchTanks({ size: 100 });
        setTanks(response.content);
      } catch (err) {
        console.error('Failed to load tanks in sidebar:', err);
      }
    };
    loadFuelProducts();
    loadTanksList();
  }, []);

  // Fetch existing rates when rateDate or dialog visibility changes
  React.useEffect(() => {
    const loadRatesForDate = async () => {
      if (!rateDate) return;
      try {
        const res = await fetch(`http://localhost:8080/api/fuel-rates/latest-or-date?date=${rateDate}`);
        if (res.ok) {
          const data = await res.json();
          const inputs: Record<string, string> = {};
          Object.entries(data).forEach(([prodId, val]) => {
            inputs[prodId] = String(val);
          });
          setRatesInput(inputs);
        }
      } catch (err) {
        console.error('Failed to fetch rates for date:', rateDate, err);
      }
    };
    if (showFuelRateDialog) {
      loadRatesForDate();
    }
  }, [rateDate, showFuelRateDialog]);

  // Fetch existing dips when dipDate or dialog visibility changes
  React.useEffect(() => {
    const loadDipsForDate = async () => {
      if (!dipDate) return;
      try {
        const res = await fetch(`http://localhost:8080/api/tank-dips/latest-or-date?date=${dipDate}`);
        if (res.ok) {
          const data = await res.json();
          const inputs: Record<string, string> = {};
          Object.entries(data).forEach(([prodId, val]) => {
            inputs[prodId] = String(val);
          });
          setDipsInput(inputs);
        }
      } catch (err) {
        console.error('Failed to fetch dips for date:', dipDate, err);
      }
    };
    if (showTankDipDialog) {
      loadDipsForDate();
    }
  }, [dipDate, showTankDipDialog]);

  // Load rates log data when dialog opens or page/dates change
  React.useEffect(() => {
    const loadRatesLog = async () => {
      try {
        const query = new URLSearchParams({
          page: String(ratesLogPage),
          size: '10'
        });
        if (ratesLogFromDate) query.set('startDate', ratesLogFromDate);
        if (ratesLogToDate) query.set('endDate', ratesLogToDate);

        const res = await fetch(`http://localhost:8080/api/fuel-rates/logs?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRatesLogData(data.content);
          setRatesLogTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error('Failed to load rates log:', err);
      }
    };
    if (showRatesLogDialog) {
      loadRatesLog();
    }
  }, [showRatesLogDialog, ratesLogPage, ratesLogFromDate, ratesLogToDate]);

  // Load dips log data when dialog opens or page/dates change
  React.useEffect(() => {
    const loadDipsLog = async () => {
      try {
        const query = new URLSearchParams({
          page: String(dipsLogPage),
          size: '10'
        });
        if (dipsLogFromDate) query.set('startDate', dipsLogFromDate);
        if (dipsLogToDate) query.set('endDate', dipsLogToDate);

        const res = await fetch(`http://localhost:8080/api/tank-dips/logs?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDipsLogData(data.content);
          setDipsLogTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error('Failed to load dips log:', err);
      }
    };
    if (showDipsLogDialog) {
      loadDipsLog();
    }
  }, [showDipsLogDialog, dipsLogPage, dipsLogFromDate, dipsLogToDate]);

  // API callback to save fuel rates
  const handleSaveRates = async () => {
    try {
      const payload: Record<string, number> = {};
      Object.entries(ratesInput).forEach(([prodId, val]) => {
        if (val && val.trim()) {
          payload[prodId] = parseFloat(val);
        }
      });

      const res = await fetch(`http://localhost:8080/api/fuel-rates?date=${rateDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Fuel rates updated successfully!');
        setShowFuelRateDialog(false);
      } else {
        toast.error('Failed to update fuel rates.');
      }
    } catch (err) {
      console.error('Save rates error:', err);
      toast.error('Error saving fuel rates.');
    }
  };

  // API callback to save tank dips
  const handleSaveDips = async () => {
    try {
      const payload: Record<string, number> = {};
      Object.entries(dipsInput).forEach(([prodId, val]) => {
        if (val && val.trim()) {
          payload[prodId] = parseFloat(val);
        }
      });

      const res = await fetch(`http://localhost:8080/api/tank-dips?date=${dipDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Tank dips updated successfully!');
        setShowTankDipDialog(false);
      } else {
        toast.error('Failed to update tank dips.');
      }
    } catch (err) {
      console.error('Save dips error:', err);
      toast.error('Error saving tank dips.');
    }
  };

  // Helper: check if a target time falls inside shift interval (handles midnight crossing)
  const isTimeInShift = (targetTime: string, start: string, end: string) => {
    if (!start || !end) return false;
    const [targetH, targetM] = targetTime.split(':').map(Number);
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const targetMin = targetH * 60 + targetM;
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (startMin <= endMin) {
      return targetMin >= startMin && targetMin < endMin;
    } else {
      return targetMin >= startMin || targetMin < endMin;
    }
  };

  // Determine shift based on database or fallbacks
  const getCurrentShift = () => {
    const istTime24 = currentTime.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const istHour = parseInt(istTime24.split(':')[0]);

    if (shifts.length > 0) {
      // Find the shift matching current time; if none matches, default to the first shift in the list
      const activeShift = shifts.find(s => isTimeInShift(istTime24, s.startTime, s.endTime)) || shifts[0];
      if (activeShift) {
        const formatTimeDisplay = (timeStr: string) => {
          if (!timeStr) return '-';
          const [hourStr, minStr] = timeStr.split(':');
          const hr = parseInt(hourStr);
          const period = hr >= 12 ? 'PM' : 'AM';
          const displayHr = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
          const minVal = parseInt(minStr);
          const displayMin = minVal > 0 ? `:${minStr}` : '';
          return `${displayHr}${displayMin} ${period}`;
        };

        const timeDisplay = `${formatTimeDisplay(activeShift.startTime)} - ${formatTimeDisplay(activeShift.endTime)}`;
        const icon = activeShift.shiftType === 'Night' ? Moon : Sun;
        return { name: activeShift.shiftName, time: timeDisplay, icon };
      }
    }

    // Fallback using current IST hour - ONLY if no shifts are present in database master data
    if (istHour >= 6 && istHour < 14) return { name: 'Morning Shift', time: '06:00 AM - 02:00 PM', icon: Sun };
    if (istHour >= 14 && istHour < 22) return { name: 'Afternoon Shift', time: '02:00 PM - 10:00 PM', icon: Sun };
    return { name: 'Night Shift', time: '10:00 PM - 06:00 AM', icon: Moon };
  };

  const shift = getCurrentShift();
  const ShiftIcon = shift.icon;

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getColorClasses = (iconColor: string) => {
    const colorMap: { [key: string]: string } = {
      'text-blue-500': 'hover:bg-blue-500/10 hover:border-blue-500/30',
      'text-teal-500': 'hover:bg-teal-500/10 hover:border-teal-500/30',
      'text-green-500': 'hover:bg-green-500/10 hover:border-green-500/30',
      'text-purple-500': 'hover:bg-purple-500/10 hover:border-purple-500/30',
      'text-orange-500': 'hover:bg-orange-500/10 hover:border-orange-500/30',
      'text-rose-500': 'hover:bg-rose-500/10 hover:border-rose-500/30',
      'text-violet-500': 'hover:bg-violet-500/10 hover:border-violet-500/30',
      'text-cyan-500': 'hover:bg-cyan-500/10 hover:border-cyan-500/30',
      'text-pink-500': 'hover:bg-pink-500/10 hover:border-pink-500/30',
      'text-indigo-500': 'hover:bg-indigo-500/10 hover:border-indigo-500/30',
      'text-emerald-500': 'hover:bg-emerald-500/10 hover:border-emerald-500/30',
      'text-amber-500': 'hover:bg-amber-500/10 hover:border-amber-500/30',
      'text-slate-500': 'hover:bg-slate-500/10 hover:border-slate-500/30',
      'text-sky-500': 'hover:bg-sky-500/10 hover:border-sky-500/30',
    };
    return colorMap[iconColor] || 'hover:bg-sidebar-accent/50';
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-medium">Fuel Pro</h1>
            <p className="text-sm text-muted-foreground">Track, Analyze, Grow.</p>
          </div>
        </div>

        {/* Shift Display */}
        <div className="px-3 py-2.5 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <ShiftIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{shift.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{shift.time}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).replace(/-/g, ' ')}</span>
            <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowFuelRateDialog(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all duration-200 hover:scale-105 group"
            title="Update Fuel Rate"
          >
            <Fuel className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-blue-500">Rate</span>
          </button>
          <button
            onClick={() => setShowTankDipDialog(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all duration-200 hover:scale-105 group"
            title="Update Tank Dip"
          >
            <Droplets className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-cyan-500">Dip</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.id);
            const isActive = activeSection === item.id || item.children?.some(child => child.id === activeSection);
            const parentIconColor = item.iconColor || '';
            
            return (
              <li key={item.id}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg border border-transparent ${
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                          : `text-sidebar-foreground ${getColorClasses(item.iconColor || '')}`
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.iconColor || ''} transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <button
                              onClick={() => onSectionChange(child.id)}
                              className={`group w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg border border-transparent ${
                                activeSection === child.id
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                  : `text-sidebar-foreground ${getColorClasses(parentIconColor)}`
                              }`}
                            >
                              {child.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg border border-transparent ${
                      isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : `text-sidebar-foreground ${getColorClasses(item.iconColor || '')}`
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${item.iconColor || ''} transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`} />
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">KP</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-sidebar-foreground truncate font-medium">Kunal Patil</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>

      {/* Fuel Rate Dialog */}
      <Dialog open={showFuelRateDialog} onOpenChange={setShowFuelRateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Fuel Rates</DialogTitle>
            <DialogDescription>
              Update fuel rates (per litre) applying from 6:00 AM on the selected date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rate-date">Effective Date</Label>
              <Input
                id="rate-date"
                type="date"
                value={rateDate}
                onChange={(e) => setRateDate(e.target.value)}
              />
            </div>
            <div className="border-t border-border pt-4 mt-2">
              <h4 className="font-medium mb-3 text-sm">Fuel Product Rates</h4>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {fuelProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No fuel products found. Add them in Product Master first.</p>
                ) : (
                  fuelProducts.map((product) => (
                    <div key={product.id} className="grid gap-2">
                      <Label htmlFor={`rate-${product.id}`}>{product.name} (₹/L)</Label>
                      <Input
                        id={`rate-${product.id}`}
                        type="number"
                        step="0.01"
                        value={ratesInput[product.id] || ''}
                        onChange={(e) => setRatesInput({ ...ratesInput, [product.id]: e.target.value })}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter rate"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between w-full sm:justify-between">
            <Button variant="ghost" onClick={() => { setShowRatesLogDialog(true); setRatesLogPage(0); }} className="gap-2">
              View Logs
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFuelRateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRates} disabled={fuelProducts.length === 0}>
                Update Rates
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tank Dip Dialog */}
      <Dialog open={showTankDipDialog} onOpenChange={setShowTankDipDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Tank Dip</DialogTitle>
            <DialogDescription>
              Update actual tank quantities (in litres) for the selected date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dip-date">Dip Date</Label>
              <Input
                id="dip-date"
                type="date"
                value={dipDate}
                onChange={(e) => setDipDate(e.target.value)}
              />
            </div>
            <div className="border-t border-border pt-4 mt-2">
              <h4 className="font-medium mb-3 text-sm">Fuel Product Dips</h4>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {tanks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No tanks found. Add them in Tank Master first.</p>
                ) : (
                  tanks.map((tank) => (
                    <div key={tank.id} className="grid gap-2">
                      <Label htmlFor={`dip-${tank.id}`}>{tank.tankName} ({tank.fuelType}) (Litres)</Label>
                      <Input
                        id={`dip-${tank.id}`}
                        type="number"
                        step="1"
                        value={dipsInput[tank.id || ''] || ''}
                        onChange={(e) => setDipsInput({ ...dipsInput, [tank.id || '']: e.target.value })}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Enter dip level"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between w-full sm:justify-between">
            <Button variant="ghost" onClick={() => { setShowDipsLogDialog(true); setDipsLogPage(0); }} className="gap-2">
              View Logs
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTankDipDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDips} disabled={tanks.length === 0}>
                Update Dip
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fuel Rates Log Modal */}
      <Dialog open={showRatesLogDialog} onOpenChange={setShowRatesLogDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fuel Rates Change Log</DialogTitle>
            <DialogDescription>
              A history of all fuel rate changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="rates-log-from-date" className="text-xs">From Date</Label>
                <Input
                  id="rates-log-from-date"
                  type="date"
                  className="h-8"
                  value={ratesLogFromDate}
                  onChange={(e) => { setRatesLogFromDate(e.target.value); setRatesLogPage(0); }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rates-log-to-date" className="text-xs">To Date</Label>
                <Input
                  id="rates-log-to-date"
                  type="date"
                  className="h-8"
                  value={ratesLogToDate}
                  onChange={(e) => { setRatesLogToDate(e.target.value); setRatesLogPage(0); }}
                />
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-3 text-left font-medium">Product</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-right font-medium">Price (₹/L)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ratesLogData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground">
                        No log entries found.
                      </td>
                    </tr>
                  ) : (
                    ratesLogData.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{log.product?.name || '-'}</td>
                        <td className="p-3 font-mono text-xs">{log.rateDate || '-'}</td>
                        <td className="p-3 text-right font-mono font-medium">₹{log.rate?.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {ratesLogTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRatesLogPage(p => Math.max(0, p - 1))}
                  disabled={ratesLogPage === 0}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  Page {ratesLogPage + 1} of {ratesLogTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRatesLogPage(p => Math.min(ratesLogTotalPages - 1, p + 1))}
                  disabled={ratesLogPage >= ratesLogTotalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRatesLogDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tank Dips Log Modal */}
      <Dialog open={showDipsLogDialog} onOpenChange={setShowDipsLogDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tank Dips Change Log</DialogTitle>
            <DialogDescription>
              A history of all physical tank dip measurements.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="dips-log-from-date" className="text-xs">From Date</Label>
                <Input
                  id="dips-log-from-date"
                  type="date"
                  className="h-8"
                  value={dipsLogFromDate}
                  onChange={(e) => { setDipsLogFromDate(e.target.value); setDipsLogPage(0); }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dips-log-to-date" className="text-xs">To Date</Label>
                <Input
                  id="dips-log-to-date"
                  type="date"
                  className="h-8"
                  value={dipsLogToDate}
                  onChange={(e) => { setDipsLogToDate(e.target.value); setDipsLogPage(0); }}
                />
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-3 text-left font-medium">Tank</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-right font-medium">Dip (L)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dipsLogData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground">
                        No log entries found.
                      </td>
                    </tr>
                  ) : (
                    dipsLogData.map((log: any) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{log.tank?.tankName || log.product?.name || '-'}</td>
                        <td className="p-3 font-mono text-xs">{log.dipDate || '-'}</td>
                        <td className="p-3 text-right font-mono font-medium">{log.dipValue?.toLocaleString()} L</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {dipsLogTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDipsLogPage(p => Math.max(0, p - 1))}
                  disabled={dipsLogPage === 0}
                >
                  Previous
                </Button>
                <span className="text-xs font-medium text-muted-foreground">
                  Page {dipsLogPage + 1} of {dipsLogTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDipsLogPage(p => Math.min(dipsLogTotalPages - 1, p + 1))}
                  disabled={dipsLogPage >= dipsLogTotalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDipsLogDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}