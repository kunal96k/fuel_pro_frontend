import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { 
  DollarSign,
  CreditCard,
  Droplet,
  TestTube,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';

interface DailyOperationProps {
  operationType?: string;
}

export function DailyOperation({ operationType = 'cash-collection' }: DailyOperationProps) {
  const getOperationTitle = () => {
    switch (operationType) {
      case 'cash-collection':
        return 'Cash Collection';
      case 'credit-sales':
        return 'Credit Sales';
      case 'own-usage':
        return 'Own Usage';
      case 'fuel-testing':
        return 'Fuel Testing';
      default:
        return 'Daily Operation';
    }
  };

  const getOperationIcon = () => {
    switch (operationType) {
      case 'cash-collection':
        return DollarSign;
      case 'credit-sales':
        return CreditCard;
      case 'own-usage':
        return Droplet;
      case 'fuel-testing':
        return TestTube;
      default:
        return Calendar;
    }
  };

  const renderOperationContent = () => {
    switch (operationType) {
      case 'cash-collection':
        return <CashCollectionForm />;
      case 'credit-sales':
        return <CreditSalesForm />;
      case 'own-usage':
        return <OwnUsageForm />;
      case 'fuel-testing':
        return <FuelTestingForm />;
      default:
        return null;
    }
  };

  const Icon = getOperationIcon();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-8 h-8 text-primary" />
          <h1>Daily Operation - {getOperationTitle()}</h1>
        </div>
        <p className="text-muted-foreground">Record and manage daily operations</p>
      </div>

      {/* Operation Content */}
      {renderOperationContent()}
    </div>
  );
}

function CashCollectionForm() {
  const [entries, setEntries] = useState([
    { id: 1, customerName: '', amount: '', receiptNo: '', paymentMode: 'cash' }
  ]);

  const addEntry = () => {
    setEntries([...entries, { 
      id: entries.length + 1, 
      customerName: '', 
      amount: '', 
      receiptNo: '', 
      paymentMode: 'cash' 
    }]);
  };

  const removeEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cash Collection Entries
            </span>
            <Button onClick={addEntry} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Shift */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select defaultValue="morning">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (6 AM - 2 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (2 PM - 10 PM)</SelectItem>
                  <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collector">Collected By</Label>
              <Input id="collector" placeholder="Staff name" />
            </div>
          </div>

          <Separator />

          {/* Collection Entries */}
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Entry #{index + 1}</Badge>
                  {entries.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input placeholder="Enter name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Receipt No.</Label>
                    <Input placeholder="RCP-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select defaultValue="cash">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Entries:</span>
              <span className="font-medium">{entries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold text-lg">₹0.00</span>
            </div>
          </div>

          <Button className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Collection Record
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CreditSalesForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Credit Sales Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit-date">Date</Label>
              <Input id="credit-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-no">Invoice No.</Label>
              <Input id="invoice-no" placeholder="INV-2024-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-customer">Customer Name</Label>
              <Input id="credit-customer" placeholder="Enter customer name" />
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-type">Product Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="engine-oil">Engine Oil</SelectItem>
                  <SelectItem value="lubricant">Lubricant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Liters)</Label>
              <Input id="quantity" type="number" placeholder="0.00" />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit-price">Unit Price (₹)</Label>
              <Input id="unit-price" type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-amount">Total Amount (₹)</Label>
              <Input id="total-amount" type="number" placeholder="0.00" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-period">Credit Period (Days)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="45">45 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="credit-notes">Notes</Label>
            <Textarea id="credit-notes" placeholder="Additional notes or terms..." rows={3} />
          </div>

          <Button className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Record Credit Sale
          </Button>
        </CardContent>
      </Card>

      {/* Recent Credit Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Credit Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Invoice No.</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Due Date</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">INV-2024-045</td>
                  <td className="p-3">ABC Transport</td>
                  <td className="p-3">Diesel - 500L</td>
                  <td className="p-3">₹42,750.00</td>
                  <td className="p-3">2024-03-20</td>
                  <td className="p-3">
                    <Badge variant="outline">Pending</Badge>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">INV-2024-044</td>
                  <td className="p-3">XYZ Logistics</td>
                  <td className="p-3">Petrol - 300L</td>
                  <td className="p-3">₹27,600.00</td>
                  <td className="p-3">2024-03-15</td>
                  <td className="p-3">
                    <Badge variant="default">Paid</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OwnUsageForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5" />
            Own Usage Record
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Purpose */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usage-date">Date</Label>
              <Input id="usage-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generator">Generator</SelectItem>
                  <SelectItem value="vehicle">Company Vehicle</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="own-product">Product Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="engine-oil">Engine Oil</SelectItem>
                  <SelectItem value="lubricant">Lubricant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-quantity">Quantity (Liters)</Label>
              <Input id="own-quantity" type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-no">Vehicle/Equipment No.</Label>
              <Input id="vehicle-no" placeholder="e.g., MH-01-1234" />
            </div>
          </div>

          {/* Authorization */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorized-by">Authorized By</Label>
              <Input id="authorized-by" placeholder="Manager name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approved-by">Approved By</Label>
              <Input id="approved-by" placeholder="Owner/Admin name" />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="usage-remarks">Remarks</Label>
            <Textarea id="usage-remarks" placeholder="Additional details..." rows={3} />
          </div>

          <Button className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Record Own Usage
          </Button>
        </CardContent>
      </Card>

      {/* Recent Own Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Own Usage Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Purpose</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Quantity</th>
                  <th className="p-3 text-left">Authorized By</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">2024-03-05</td>
                  <td className="p-3">Generator</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">25 L</td>
                  <td className="p-3">Rajesh Kumar</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">2024-03-04</td>
                  <td className="p-3">Company Vehicle</td>
                  <td className="p-3">Petrol</td>
                  <td className="p-3">40 L</td>
                  <td className="p-3">Rajesh Kumar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FuelTestingForm() {
  const [testDate] = useState(new Date().toISOString().split('T')[0]);
  const [testTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
  
  // Staff list for dropdown
  const staffMembers = [
    'Rajesh Kumar',
    'Priya Sharma',
    'Amit Patel',
    'Sunita Singh',
    'Vikram Reddy',
    'Anjali Gupta',
    'Rahul Verma',
    'Deepa Menon'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Fuel Quality Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-date">Test Date</Label>
              <Input 
                id="test-date" 
                type="date" 
                value={testDate} 
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-time">Test Time</Label>
              <Input 
                id="test-time" 
                type="time" 
                value={testTime}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tested-by">Tested By</Label>
              <Select>
                <SelectTrigger className="border border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff} value={staff}>
                      {staff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fuel Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuel-type">Fuel Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tank-no">Tank No.</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tank-1">Tank 1</SelectItem>
                  <SelectItem value="tank-2">Tank 2</SelectItem>
                  <SelectItem value="tank-3">Tank 3</SelectItem>
                  <SelectItem value="tank-4">Tank 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Test Parameters */}
          <div>
            <h4 className="mb-4">Test Parameters</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="density">Density (kg/m³)</Label>
                  <Input id="density" type="number" placeholder="830-890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input id="temperature" type="number" placeholder="15-30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flash-point">Flash Point (°C)</Label>
                  <Input id="flash-point" type="number" placeholder="55-66" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="water-content">Water Content (%)</Label>
                  <Input id="water-content" type="number" placeholder="0.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sediment">Sediment (%)</Label>
                  <Input id="sediment" type="number" placeholder="0.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color/Appearance</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="slightly-turbid">Slightly Turbid</SelectItem>
                      <SelectItem value="turbid">Turbid</SelectItem>
                      <SelectItem value="contaminated">Contaminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Result */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-result">Test Result</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Pass - Within Standards
                    </div>
                  </SelectItem>
                  <SelectItem value="fail">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Fail - Below Standards
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">⚠</span>
                      Warning - Borderline
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-remarks">Remarks/Observations</Label>
              <Textarea id="test-remarks" placeholder="Detailed observations and recommendations..." rows={4} />
            </div>
          </div>

          <Button className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Test Report
          </Button>
        </CardContent>
      </Card>

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Fuel Type</th>
                  <th className="p-3 text-left">Tank</th>
                  <th className="p-3 text-left">Tested By</th>
                  <th className="p-3 text-left">Result</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">2024-03-05 09:30</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">Tank 1</td>
                  <td className="p-3">Amit Sharma</td>
                  <td className="p-3">
                    <Badge variant="default" className="bg-green-500">Pass</Badge>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">2024-03-04 15:45</td>
                  <td className="p-3">Petrol</td>
                  <td className="p-3">Tank 2</td>
                  <td className="p-3">Amit Sharma</td>
                  <td className="p-3">
                    <Badge variant="default" className="bg-green-500">Pass</Badge>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">2024-03-03 10:15</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">Tank 3</td>
                  <td className="p-3">Amit Sharma</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Warning</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}