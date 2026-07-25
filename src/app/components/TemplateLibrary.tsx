import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Plus, Eye, Edit, Mail, MessageSquare, Phone, Wand2, Copy } from 'lucide-react';

const templateCategories = ['All', 'Friendly', 'Firm', 'Final Notice', 'Custom'];

const templates = [
  {
    id: 1,
    name: 'Friendly Reminder',
    category: 'Friendly',
    channel: 'email',
    usage: 156,
    effectiveness: '12.5%',
    thumbnail: 'email-friendly.png'
  },
  {
    id: 2,
    name: 'Payment Due SMS',
    category: 'Firm',
    channel: 'sms',
    usage: 89,
    effectiveness: '8.2%',
    thumbnail: 'sms-firm.png'
  },
  {
    id: 3,
    name: 'Final Notice Call',
    category: 'Final Notice',
    channel: 'voice',
    usage: 45,
    effectiveness: '15.7%',
    thumbnail: 'voice-final.png'
  },
  {
    id: 4,
    name: 'Custom Follow-up',
    category: 'Custom',
    channel: 'email',
    usage: 23,
    effectiveness: '9.8%',
    thumbnail: 'email-custom.png'
  }
];

export function TemplateLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      case 'email': return 'bg-blue-100 text-blue-700';
      case 'sms': return 'bg-green-100 text-green-700';
      case 'voice': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (showEditor) {
    return <TemplateEditor onClose={() => setShowEditor(false)} />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Template Library</h1>
          <p className="text-muted-foreground">Create and manage your collection message templates</p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {templateCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
          </p>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${getChannelColor(template.channel)} border-0`}>
                        {getChannelIcon(template.channel)}
                        <span className="ml-1 capitalize">{template.channel}</span>
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Template Preview */}
                <div className="bg-muted/50 rounded p-3 mb-4 text-sm">
                  <div className="h-16 bg-white rounded border-2 border-dashed border-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Template Preview</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm text-muted-foreground mb-4">
                  <span>Used {template.usage} times</span>
                  <span>{template.effectiveness} effective</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowEditor(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateEditor({ onClose }: { onClose: () => void }) {
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [templateContent, setTemplateContent] = useState('Dear {{First Name}},\n\nWe hope this message finds you well. We wanted to remind you that your payment of {{Amount}} was due on {{Due Date}}.\n\nPlease click the link below to make your payment:\n{{Payment Link}}\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\nCollections Team');

  const channels = [
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'sms', name: 'SMS', icon: MessageSquare },
    { id: 'voice', name: 'Voice', icon: Phone }
  ];

  const tokens = [
    '{{First Name}}', '{{Last Name}}', '{{Company}}', '{{Amount}}', 
    '{{Due Date}}', '{{Days Overdue}}', '{{Payment Link}}', '{{Phone}}'
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Template Editor</h1>
          <p className="text-muted-foreground">Create and customize your collection message templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button>Save Template</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-6">
          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Name</label>
                  <Input placeholder="Enter template name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Friendly</option>
                    <option>Firm</option>
                    <option>Final Notice</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channel Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <Button
                      key={channel.id}
                      variant={selectedChannel === channel.id ? 'default' : 'outline'}
                      onClick={() => setSelectedChannel(channel.id)}
                      className="flex-1"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {channel.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedChannel === 'voice' ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full h-64 p-3 border rounded-md resize-none"
                    placeholder="Enter your voice script here. Use {{tokens}} for personalization."
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Test Playback
                    </Button>
                    <Button size="sm" variant="outline">Insert Pause</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedChannel === 'email' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject Line</label>
                      <Input placeholder="Payment Reminder - {{Company}}" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message Body</label>
                    <textarea
                      className="w-full h-48 p-3 border rounded-md resize-none"
                      placeholder="Enter your message here. Use {{tokens}} for personalization."
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="whitespace-pre-wrap text-sm">
                  {templateContent.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
                    const examples: { [key: string]: string } = {
                      'First Name': 'John',
                      'Last Name': 'Doe',
                      'Company': 'Acme Corp',
                      'Amount': '₹1,250.00',
                      'Due Date': 'February 15, 2024',
                      'Days Overdue': '5',
                      'Payment Link': 'https://pay.example.com/abc123',
                      'Phone': '+1 (555) 123-4567'
                    };
                    return examples[token] || `[${token}]`;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insert Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <Button
                    key={token}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2"
                    onClick={() => setTemplateContent(prev => prev + token)}
                  >
                    <span className="text-xs font-mono">{token}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tone</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Casual</span>
                  <input type="range" className="flex-1" min="0" max="100" defaultValue="50" />
                  <span className="text-xs">Formal</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Rewrite
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  Shorten
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  Make Friendlier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* A/B Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">A/B Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Variant A</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  + Create Variant B
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}