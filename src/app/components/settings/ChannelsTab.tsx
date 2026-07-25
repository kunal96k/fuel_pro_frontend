import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export function ChannelsTab() {
  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Username</Label>
                <Input id="smtp-username" placeholder="your-email@domain.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Password</Label>
                <Input id="smtp-password" type="password" placeholder="••••••••" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4>DNS Verification</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add these DNS records to verify your domain:
                </p>
                <div className="space-y-2 text-sm font-mono bg-muted p-3 rounded">
                  <div>TXT: v=spf1 include:_spf.google.com ~all</div>
                  <div>CNAME: mail.yourdomain.com</div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">Pending Verification</Badge>
                  <Button size="sm" variant="outline">Verify Now</Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline">Test Connection</Button>
            <Button>Save Email Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* SMS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SMS Provider</Label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>Twilio</option>
                  <option>AWS SNS</option>
                  <option>MessageBird</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sms-sender-id">Sender ID</Label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>+1 (555) 123-4567</option>
                  <option>+1 (555) 123-4568</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4>Available Numbers</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">+1 (555) 123-4567</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">+1 (555) 123-4568</span>
                    <Badge variant="secondary">Backup</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3">
                  Buy New Number
                </Button>
              </div>
            </div>
          </div>
          
          <Button>Save SMS Settings</Button>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Voice Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Caller ID</Label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>+1 (555) 123-4567</option>
                  <option>+1 (555) 987-6543</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>STIR/SHAKEN Compliance</Label>
                  <p className="text-sm text-muted-foreground">Enable call authentication</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4>Test Your Setup</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Test the voice configuration with a sample call
                </p>
                <div className="space-y-2">
                  <Input placeholder="Your phone number" />
                  <Button size="sm" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Send Test Call
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <Button>Save Voice Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}