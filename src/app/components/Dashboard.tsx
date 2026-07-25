import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Mail, 
  Phone, 
  MessageSquare,
  ArrowRight,
  Clock,
  Upload,
  FileText,
  BarChart3
} from 'lucide-react';

export function Dashboard() {
  const metrics = [
    {
      title: 'Total Outstanding',
      value: '₹2,345,678',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign
    },
    {
      title: 'Active Campaigns',
      value: '24',
      change: '+3',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Collections Rate',
      value: '68%',
      change: '+5.2%',
      trend: 'up',
      icon: TrendingUp
    },
    {
      title: 'Avg. Days to Pay',
      value: '12.3',
      change: '-2.1',
      trend: 'down',
      icon: Clock
    }
  ];

  const recentActivity = [
    { action: 'Payment received', amount: '₹1,250', customer: 'Smith Corp', time: '2m ago' },
    { action: 'Email sequence completed', customer: 'Johnson LLC', time: '15m ago' },
    { action: 'New import processed', details: '450 records', time: '1h ago' },
    { action: 'Campaign started', customer: 'Anderson Inc', time: '2h ago' }
  ];

  const channelStats = [
    { name: 'Email', sent: 1250, opened: 845, responded: 234, icon: Mail, color: 'bg-blue-500' },
    { name: 'SMS', sent: 680, opened: 612, responded: 156, icon: MessageSquare, color: 'bg-green-500' },
    { name: 'Voice', sent: 320, opened: 298, responded: 89, icon: Phone, color: 'bg-purple-500' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">Overview of your collections performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Export Report</Button>
          <Button>New Campaign</Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                  <TrendingUp className={`h-3 w-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  {metric.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channelStats.map((channel) => {
              const Icon = channel.icon;
              const responseRate = ((channel.responded / channel.sent) * 100).toFixed(1);
              
              return (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${channel.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-sm text-muted-foreground">{channel.sent} sent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{responseRate}%</p>
                    <p className="text-sm text-muted-foreground">response rate</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.customer || activity.details}
                  </p>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="font-medium text-green-600">{activity.amount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Upload className="w-6 h-6" />
              Import Data
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <FileText className="w-6 h-6" />
              New Template
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Users className="w-6 h-6" />
              Create Campaign
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}