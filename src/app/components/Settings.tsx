import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChannelsTab } from './settings/ChannelsTab';
import { OrganizationTab } from './settings/OrganizationTab';
import { SecurityTab } from './settings/SecurityTab';
import { ApiKeysTab } from './settings/ApiKeysTab';

export function Settings() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Configure your account and system preferences</p>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <ChannelsTab />
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="api">
          <ApiKeysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}