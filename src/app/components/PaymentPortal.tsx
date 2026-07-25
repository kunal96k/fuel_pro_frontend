import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  CreditCard, 
  Building2, 
  Settings, 
  Eye, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export function PaymentPortal() {
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', enabled: true, icon: CreditCard },
    { id: 'ach', name: 'Bank Transfer (ACH)', enabled: true, icon: Building2 },
  ];

  const recentPayments = [
    { id: 1, customer: 'Acme Corp', amount: '₹2,450.00', method: 'Card', status: 'completed', date: '2 hours ago' },
    { id: 2, customer: 'Smith LLC', amount: '₹1,250.00', method: 'ACH', status: 'pending', date: '5 hours ago' },
    { id: 3, customer: 'Johnson Inc', amount: '₹875.00', method: 'Card', status: 'completed', date: '1 day ago' },
    { id: 4, customer: 'Wilson Co', amount: '₹3,200.00', method: 'ACH', status: 'failed', date: '2 days ago' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Payment Portal</h1>
          <p className="text-muted-foreground">Configure payment methods and manage transactions</p>
        </div>
        <Button>
          <Eye className="w-4 h-4 mr-2" />
          Preview Portal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Link Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-logo">Company Logo</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload your company logo</p>
                  <Button size="sm" variant="outline">Browse Files</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" placeholder="Your Company Name" defaultValue="Fuel Pro" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success-url">Success Redirect URL</Label>
                <Input id="success-url" placeholder="https://yoursite.com/payment-success" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failure-url">Failure Redirect URL</Label>
                <Input id="failure-url" placeholder="https://yoursite.com/payment-failed" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {method.id === 'card' ? 'Visa, Mastercard, American Express' : 'Direct bank transfers'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={method.enabled ? 'default' : 'secondary'}>
                        {method.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              <Button variant="outline" className="w-full">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-amount">Test Amount</Label>
                  <Input id="test-amount" placeholder="₹100.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-email">Customer Email</Label>
                  <Input id="test-email" placeholder="test@example.com" />
                </div>
              </div>
              
              <Button className="w-full">
                Generate Test Payment Link
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Test payments won't be charged to your account
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History & Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Portal Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-muted/20">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3>Fuel Pro</h3>
                  <p className="text-muted-foreground">Payment Request</p>
                </div>

                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span>Invoice #12345</span>
                      <span className="font-bold">₹1,250.00</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: February 15, 2024
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Button className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay with Card
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Building2 className="w-4 h-4 mr-2" />
                    Pay with Bank Transfer
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Secure payment powered by Fuel Pro
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Payments</CardTitle>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">{payment.customer}</p>
                        <p className="text-sm text-muted-foreground">{payment.method} • {payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{payment.amount}</p>
                      <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}