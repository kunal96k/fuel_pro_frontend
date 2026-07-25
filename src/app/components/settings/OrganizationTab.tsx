import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Users } from 'lucide-react';
import { teamMembers } from './constants';

export function OrganizationTab() {
  return (
    <div className="space-y-6">
      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="Fuel Pro Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-domain">Domain</Label>
              <Input id="org-domain" defaultValue="fuelpro.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-address">Address</Label>
              <Input id="org-address" defaultValue="123 Business St, City, ST 12345" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-phone">Phone</Label>
              <Input id="org-phone" defaultValue="+1 (555) 123-4567" />
            </div>
          </div>
          
          <Button>Update Organization</Button>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    member.role === 'Admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {member.initials}
                  </div>
                  <div>
                    <p>{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'Admin' ? 'default' : 'outline'}>
                    {member.role}
                  </Badge>
                  <Button size="sm" variant="ghost">Edit</Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button className="w-full mt-4">Invite Team Member</Button>
        </CardContent>
      </Card>
    </div>
  );
}