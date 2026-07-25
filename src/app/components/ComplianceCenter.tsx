import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Download, 
  Upload, 
  Search, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  MessageSquare
} from 'lucide-react';

export function ComplianceCenter() {
  const optOutList = [
    { id: 1, contact: 'john@example.com', type: 'Email', date: '2024-01-15', reason: 'User request' },
    { id: 2, contact: '+1234567890', type: 'SMS', date: '2024-01-14', reason: 'Auto opt-out' },
    { id: 3, contact: 'jane@company.com', type: 'Email', date: '2024-01-12', reason: 'Bounce back' },
    { id: 4, contact: '+1234567891', type: 'SMS', date: '2024-01-10', reason: 'User request' }
  ];

  const consentStatus = [
    { customer: 'Acme Corp', email: 'consent', sms: 'consent', voice: 'no-consent', lastUpdated: '2024-01-15' },
    { customer: 'Smith LLC', email: 'consent', sms: 'no-consent', voice: 'consent', lastUpdated: '2024-01-14' },
    { customer: 'Johnson Inc', email: 'no-consent', sms: 'consent', voice: 'consent', lastUpdated: '2024-01-12' },
    { customer: 'Wilson Co', email: 'consent', sms: 'consent', voice: 'pending', lastUpdated: '2024-01-10' }
  ];

  const complianceChecks = [
    { rule: 'TCPA Compliance', status: 'passed', description: 'All voice calls have proper consent' },
    { rule: 'CAN-SPAM Act', status: 'passed', description: 'Email opt-out mechanisms in place' },
    { rule: 'FDCPA Guidelines', status: 'warning', description: '2 messages sent outside business hours' },
    { rule: 'State Regulations', status: 'passed', description: 'All state-specific rules followed' }
  ];

  const getConsentBadge = (status: string) => {
    switch (status) {
      case 'consent':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Consent</Badge>;
      case 'no-consent':
        return <Badge className="bg-red-100 text-red-800 border-red-200">No Consent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Compliance Center</h1>
          <p className="text-muted-foreground">Manage opt-outs, consent, and regulatory compliance</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Compliance Report
        </Button>
      </div>

      <Tabs defaultValue="optout" className="space-y-6">
        <TabsList>
          <TabsTrigger value="optout">Opt-Out Management</TabsTrigger>
          <TabsTrigger value="consent">Consent Tracking</TabsTrigger>
          <TabsTrigger value="checker">Compliance Checker</TabsTrigger>
        </TabsList>

        <TabsContent value="optout" className="space-y-6">
          {/* Opt-Out List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Opt-Out List
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Search opt-out list..." className="pl-10" />
                </div>
                <select className="px-3 py-2 border rounded-md">
                  <option>All Types</option>
                  <option>Email</option>
                  <option>SMS</option>
                  <option>Voice</option>
                </select>
              </div>

              {/* Opt-Out Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Contact</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Date Added</th>
                      <th className="text-left p-3">Reason</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optOutList.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 font-medium">{item.contact}</td>
                        <td className="p-3">
                          <Badge variant="outline">{item.type}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.date}</td>
                        <td className="p-3 text-muted-foreground">{item.reason}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" className="text-red-600">
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Add to Opt-Out */}
          <Card>
            <CardHeader>
              <CardTitle>Add to Opt-Out List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input placeholder="Email or phone number" />
                <select className="px-3 py-2 border rounded-md">
                  <option>Email</option>
                  <option>SMS</option>
                  <option>Voice</option>
                  <option>All Channels</option>
                </select>
                <Button>Add to Opt-Out</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          {/* Consent Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Consent Status by Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">SMS</th>
                      <th className="text-left p-3">Voice</th>
                      <th className="text-left p-3">Last Updated</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentStatus.map((customer, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-3 font-medium">{customer.customer}</td>
                        <td className="p-3">{getConsentBadge(customer.email)}</td>
                        <td className="p-3">{getConsentBadge(customer.sms)}</td>
                        <td className="p-3">{getConsentBadge(customer.voice)}</td>
                        <td className="p-3 text-muted-foreground">{customer.lastUpdated}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Consent Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Email Consent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Consented</span>
                    <span className="font-medium">1,245</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">No Consent</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="font-medium">23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">SMS Consent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Consented</span>
                    <span className="font-medium">892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">No Consent</span>
                    <span className="font-medium">398</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="font-medium">134</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Voice Consent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Consented</span>
                    <span className="font-medium">567</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">No Consent</span>
                    <span className="font-medium">654</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="font-medium">203</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checker" className="space-y-6">
          {/* Compliance Checker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send Test Compliance Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Contact</label>
                  <Input placeholder="email@example.com or +1234567890" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Type</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>Collection Email</option>
                    <option>Collection SMS</option>
                    <option>Collection Voice Call</option>
                  </select>
                </div>
              </div>
              
              <Button className="w-full">
                Check Compliance
              </Button>
              
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-800">Compliance Check Passed</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Customer has opted in for email communications</li>
                  <li>✓ Message content follows FDCPA guidelines</li>
                  <li>✓ Sending within allowed business hours</li>
                  <li>✓ Proper identification and opt-out instructions included</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Rules Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Rules Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getComplianceIcon(check.status)}
                      <div>
                        <p className="font-medium">{check.rule}</p>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                      </div>
                    </div>
                    <Badge variant={
                      check.status === 'passed' ? 'default' : 
                      check.status === 'warning' ? 'secondary' : 
                      'destructive'
                    }>
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}