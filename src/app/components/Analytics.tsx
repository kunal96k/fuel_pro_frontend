import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Mail, 
  MessageSquare, 
  Phone,
  Filter,
  Download,
  Calendar,
  Target,
  Plus
} from 'lucide-react';

export function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const funnelData = [
    { stage: 'Sent', count: 1250, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Delivered', count: 1189, percentage: 95.1, color: 'bg-blue-400' },
    { stage: 'Opened', count: 845, percentage: 67.6, color: 'bg-blue-300' },
    { stage: 'Clicked', count: 234, percentage: 18.7, color: 'bg-blue-200' },
    { stage: 'Paid', count: 156, percentage: 12.5, color: 'bg-green-500' }
  ];

  const templatePerformance = [
    { template: 'Friendly Reminder', conversion: 15.2, avgDays: 8.3, sent: 450 },
    { template: 'Firm Notice', conversion: 12.8, avgDays: 6.1, sent: 320 },
    { template: 'Final Warning', conversion: 18.7, avgDays: 4.2, sent: 180 },
    { template: 'Payment Due', conversion: 11.4, avgDays: 9.7, sent: 280 }
  ];

  const abTestResults = [
    {
      test: 'Subject Line A/B',
      variantA: { name: 'Payment Reminder', conversion: 12.5, sent: 500 },
      variantB: { name: 'Action Required', conversion: 15.2, sent: 500 },
      significance: 'Significant',
      winner: 'B'
    },
    {
      test: 'Send Time A/B',
      variantA: { name: 'Morning (9 AM)', conversion: 14.1, sent: 300 },
      variantB: { name: 'Afternoon (2 PM)', conversion: 16.8, sent: 300 },
      significance: 'Significant',
      winner: 'B'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Analytics &amp; Reporting</h1>
          <p className="text-muted-foreground">Track performance and optimize your collection campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {['7d', '30d', '90d', 'custom'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'custom' ? 'Custom' : `Last ${period}`}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="abtesting">A/B Testing</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹234,567</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +18.2% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.5%</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +5.1% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Days to Pay</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.3</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 rotate-180" />
                  -1.2 days improvement
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-muted-foreground">
                  3 new this week
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{stage.stage}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{stage.count.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">{stage.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${stage.color}`} 
                          style={{ width: `${stage.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">850 sent</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">12.5%</p>
                      <p className="text-sm text-muted-foreground">conversion</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">SMS</p>
                        <p className="text-sm text-muted-foreground">245 sent</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">18.2%</p>
                      <p className="text-sm text-muted-foreground">conversion</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Voice</p>
                        <p className="text-sm text-muted-foreground">155 sent</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">24.5%</p>
                      <p className="text-sm text-muted-foreground">conversion</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mb-2" />
                  <p>Chart visualization would go here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Template Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Template</th>
                      <th className="text-left p-3">Conversion Rate</th>
                      <th className="text-left p-3">Avg. Days to Pay</th>
                      <th className="text-left p-3">Messages Sent</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templatePerformance.map((template, index) => (
                      <tr key={template.template} className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              #{index + 1}
                            </div>
                            {template.template}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{template.conversion}%</td>
                        <td className="p-3">{template.avgDays} days</td>
                        <td className="p-3">{template.sent}</td>
                        <td className="p-3">
                          <Badge variant={template.conversion > 15 ? 'default' : 'secondary'}>
                            {template.conversion > 15 ? 'High Performer' : 'Standard'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abtesting" className="space-y-6">
          {/* A/B Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {abTestResults.map((test, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4>{test.test}</h4>
                      <Badge variant={test.significance === 'Significant' ? 'default' : 'secondary'}>
                        {test.significance}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded-lg border ${test.winner === 'A' ? 'border-green-200 bg-green-50' : 'border-muted'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Variant A</span>
                          {test.winner === 'A' && <Badge variant="default" className="bg-green-600">Winner</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{test.variantA.name}</p>
                        <div className="flex justify-between text-sm">
                          <span>Conversion: {test.variantA.conversion}%</span>
                          <span>Sent: {test.variantA.sent}</span>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${test.winner === 'B' ? 'border-green-200 bg-green-50' : 'border-muted'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Variant B</span>
                          {test.winner === 'B' && <Badge variant="default" className="bg-green-600">Winner</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{test.variantB.name}</p>
                        <div className="flex justify-between text-sm">
                          <span>Conversion: {test.variantB.conversion}%</span>
                          <span>Sent: {test.variantB.sent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Create New A/B Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          {/* Channel Deep Dive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Email Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Open Rate</span>
                  <span className="font-medium">68.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Click Rate</span>
                  <span className="font-medium">15.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">12.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="font-medium">2.1%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  SMS Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Delivery Rate</span>
                  <span className="font-medium">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Response Rate</span>
                  <span className="font-medium">24.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">18.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Opt-out Rate</span>
                  <span className="font-medium">0.8%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-500" />
                  Voice Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Answer Rate</span>
                  <span className="font-medium">42.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-medium">78.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">24.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Callback Rate</span>
                  <span className="font-medium">8.3%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}