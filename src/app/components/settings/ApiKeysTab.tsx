import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Key, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { apiKeys } from './constants';

export function ApiKeysTab() {
  const [visibleKeys, setVisibleKeys] = useState<{ [key: number]: boolean }>({});

  const toggleKeyVisibility = (keyId: number) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4>{key.name}</h4>
                    <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                      {key.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {visibleKeys[key.id] ? key.key.replace('****', 'abcd1234efgh5678') : key.key}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => toggleKeyVisibility(key.id)}
                    >
                      {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {key.created} • Last used: {key.lastUsed}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button className="w-full mt-4">
            Create New API Key
          </Button>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Use our REST API to integrate Fuel Pro with your existing systems.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                View API Documentation
              </Button>
              <Button variant="outline" className="justify-start">
                Download Postman Collection
              </Button>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4>Rate Limits</h4>
              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                <div>• 1000 requests per hour for standard endpoints</div>
                <div>• 100 requests per hour for bulk operations</div>
                <div>• 10 requests per minute for authentication</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}