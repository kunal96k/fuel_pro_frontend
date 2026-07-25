import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Workflow, 
  Mail, 
  MessageSquare, 
  Phone, 
  Plus, 
  GripVertical, 
  Clock, 
  Settings,
  PieChart,
  Zap,
  Target
} from 'lucide-react';

export function SequenceGenerator() {
  const [sequenceSteps, setSequenceSteps] = useState([
    { id: 1, channel: 'email', delay: 0, template: 'Initial Notice', active: true },
    { id: 2, channel: 'sms', delay: 3, template: 'SMS Reminder', active: true },
    { id: 3, channel: 'email', delay: 7, template: 'Follow-up Email', active: true },
    { id: 4, channel: 'voice', delay: 14, template: 'Voice Call', active: true },
    { id: 5, channel: 'email', delay: 21, template: 'Final Notice', active: true }
  ]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'voice': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-500';
      case 'sms': return 'bg-green-500';
      case 'voice': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Sequence Generator</h1>
          <p className="text-muted-foreground">Create automated multi-channel collection sequences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            AI Optimize
          </Button>
          <Button>Save Sequence</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5" />
                Sequence Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sequenceSteps.map((step, index) => (
                  <div key={step.id} className="group">
                    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Drag Handle */}
                      <div className="cursor-move">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Step Number */}
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>

                      {/* Channel Icon */}
                      <div className={`w-10 h-10 rounded-lg ${getChannelColor(step.channel)} flex items-center justify-center text-white`}>
                        {getChannelIcon(step.channel)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4>{step.template}</h4>
                          <Badge variant="outline" className="capitalize">{step.channel}</Badge>
                          {step.delay > 0 && (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Wait {step.delay} days
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.channel === 'email' ? 'Automated email with payment link and personalized message' :
                           step.channel === 'sms' ? 'Text message reminder with short, actionable content' :
                           'Automated voice call with interactive options'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Add Step Button */}
                    {index < sequenceSteps.length - 1 && (
                      <div className="flex justify-center my-2">
                        <Button size="sm" variant="outline" className="h-8 px-3">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Step
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Final Add Button */}
                <div className="flex justify-center pt-4">
                  <Button variant="dashed" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Final Step
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exit Criteria */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Exit Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4>Payment Received</h4>
                    <p className="text-sm text-muted-foreground">Stop sequence when payment is confirmed</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4>Customer Reply</h4>
                    <p className="text-sm text-muted-foreground">Pause sequence when customer responds</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4>Manual Stop</h4>
                    <p className="text-sm text-muted-foreground">Allow manual intervention to stop sequence</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Channel Mix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Channel Mix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Email</span>
                    </div>
                    <span className="text-sm font-medium">60%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">SMS</span>
                    </div>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Voice</span>
                    </div>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Recommended</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Prediction */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Prediction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Expected Open Rate</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Expected Response Rate</span>
                  <span className="text-sm font-medium">12%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Expected Collection Rate</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg. Days to Payment</span>
                  <span className="text-sm font-medium">8.5</span>
                </div>
              </div>

              <Separator />

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Optimized</span>
                </div>
                <p className="text-xs text-green-700">
                  This sequence is optimized for your historical performance data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Timing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Hours</label>
                <div className="text-sm text-muted-foreground">9:00 AM - 5:00 PM</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Time Zone</label>
                <div className="text-sm text-muted-foreground">Eastern Time (EST)</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Send Days</label>
                <div className="text-sm text-muted-foreground">Monday - Friday</div>
              </div>

              <Button size="sm" variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start">
                Standard 30-Day
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                Aggressive 14-Day
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                Gentle 45-Day
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}