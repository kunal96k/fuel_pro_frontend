import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone
} from 'lucide-react';

interface ImportStep {
  id: number;
  title: string;
  description: string;
}

const steps: ImportStep[] = [
  { id: 1, title: 'Upload File', description: 'Select and upload your data file' },
  { id: 2, title: 'Field Mapping', description: 'Map your columns to required fields' },
  { id: 3, title: 'Validation', description: 'Review and fix any data issues' },
  { id: 4, title: 'Campaign Setup', description: 'Configure your collection sequence' }
];

interface ImportWizardProps {
  purchaseType?: string;
}

export function ImportWizard({ purchaseType = 'fuel-purchase' }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const getPurchaseTitle = () => {
    switch (purchaseType) {
      case 'fuel-purchase':
        return 'Fuel Purchase';
      case 'oil-purchase':
        return 'Oil Purchase';
      case 'tanker-load':
        return 'Tanker Load';
      default:
        return 'Purchase';
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep onUpload={simulateUpload} progress={uploadProgress} isUploading={isUploading} />;
      case 2:
        return <FieldMappingStep />;
      case 3:
        return <ValidationStep />;
      case 4:
        return <CampaignSetupStep />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1>Purchase - {getPurchaseTitle()}</h1>
        <p className="text-muted-foreground">Import your customer data and set up collection campaigns</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                currentStep > step.id 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : currentStep === step.id
                  ? 'border-primary text-primary bg-background'
                  : 'border-muted text-muted-foreground bg-background'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute top-5 left-10 w-full h-0.5 transition-colors ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} style={{ width: 'calc(100vw / 4 - 40px)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        {renderStepContent()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={currentStep === 4}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function UploadStep({ onUpload, progress, isUploading }: { onUpload: () => void; progress: number; isUploading: boolean }) {
  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Your Data File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag and Drop Zone */}
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="mb-2">Drag and drop your file here</h3>
          <p className="text-muted-foreground mb-4">Supports .csv, .xlsx files up to 50 MB</p>
          <Button variant="outline" onClick={onUpload}>
            Browse Files
          </Button>
        </div>

        {/* Progress Bar */}
        {(isUploading || progress > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h4>Need a template?</h4>
            <p className="text-sm text-muted-foreground">Download our sample CSV file to get started</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardContent>
    </>
  );
}

function FieldMappingStep() {
  const detectedColumns = ['customer_name', 'email_address', 'phone_number', 'amount_due', 'due_date'];
  const requiredFields = ['Customer Name', 'Email', 'Phone', 'Amount Due', 'Due Date'];
  
  return (
    <>
      <CardHeader>
        <CardTitle>Field Mapping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Detected Columns */}
          <div>
            <h4 className="mb-4">Detected Columns</h4>
            <div className="space-y-2">
              {detectedColumns.map((column, index) => (
                <div key={column} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{column}</span>
                    <Badge variant="secondary">Auto-matched</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Sample: {index === 0 ? 'John Smith' : index === 1 ? 'john@example.com' : index === 2 ? '+1234567890' : index === 3 ? '₹1,250.00' : '2024-02-15'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Fields */}
          <div>
            <h4 className="mb-4">Required Fields</h4>
            <div className="space-y-4">
              {requiredFields.map((field) => (
                <div key={field} className="space-y-2">
                  <Label>{field}</Label>
                  <Select defaultValue={detectedColumns[requiredFields.indexOf(field)]}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {detectedColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                      <SelectItem value="ignore">Ignore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sample Preview */}
        <div>
          <h4 className="mb-4">Data Preview (First 3 rows)</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {requiredFields.map((field) => (
                    <th key={field} className="p-3 text-left">{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">John Smith</td>
                  <td className="p-3">john@example.com</td>
                  <td className="p-3">+1234567890</td>
                  <td className="p-3">₹1,250.00</td>
                  <td className="p-3">2024-02-15</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">Jane Doe</td>
                  <td className="p-3">jane@example.com</td>
                  <td className="p-3">+1234567891</td>
                  <td className="p-3">₹850.00</td>
                  <td className="p-3">2024-02-20</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">Bob Johnson</td>
                  <td className="p-3">bob@example.com</td>
                  <td className="p-3">+1234567892</td>
                  <td className="p-3">₹2,100.00</td>
                  <td className="p-3">2024-02-10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </>
  );
}

function ValidationStep() {
  const validationIssues = [
    { row: 15, field: 'Phone', issue: 'Invalid phone number format', value: '123-456' },
    { row: 23, field: 'Email', issue: 'Missing email address', value: '' },
    { row: 31, field: 'Amount', issue: 'Non-numeric amount', value: 'N/A' }
  ];

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Validation &amp; Preview</span>
          <Badge variant="destructive">12 rows need attention</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationIssues.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h4 className="text-destructive">Data Validation Issues Found</h4>
            </div>
            <div className="space-y-2">
              {validationIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <p className="font-medium">Row {issue.row}: {issue.issue}</p>
                    <p className="text-sm text-muted-foreground">Field: {issue.field}, Value: "{issue.value}"</p>
                  </div>
                  <Button size="sm" variant="outline">Fix</Button>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Button variant="outline" className="w-full">
              Bulk Fix Common Issues
            </Button>
          </div>
        )}

        {/* Data Preview Table */}
        <div>
          <h4 className="mb-4">Data Preview (First 20 rows)</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Customer Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Amount Due</th>
                  <th className="p-3 text-left">Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </td>
                  <td className="p-3">John Smith</td>
                  <td className="p-3">john@example.com</td>
                  <td className="p-3">+1234567890</td>
                  <td className="p-3">₹1,250.00</td>
                  <td className="p-3">2024-02-15</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </td>
                  <td className="p-3">Jane Doe</td>
                  <td className="p-3 text-red-500">Missing</td>
                  <td className="p-3">+1234567891</td>
                  <td className="p-3">₹850.00</td>
                  <td className="p-3">2024-02-20</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </td>
                  <td className="p-3">Bob Johnson</td>
                  <td className="p-3">bob@example.com</td>
                  <td className="p-3">+1234567892</td>
                  <td className="p-3">₹2,100.00</td>
                  <td className="p-3">2024-02-10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </>
  );
}

function CampaignSetupStep() {
  const sequenceSteps = [
    { day: 0, channel: 'email', title: 'Initial Notice', icon: Mail },
    { day: 3, channel: 'sms', title: 'SMS Reminder', icon: MessageSquare },
    { day: 7, channel: 'email', title: 'Follow-up Email', icon: Mail },
    { day: 14, channel: 'voice', title: 'Voice Call', icon: Phone },
    { day: 21, channel: 'email', title: 'Final Notice', icon: Mail }
  ];

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Campaign Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campaign Details */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input id="campaign-name" placeholder="February Collections 2024" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Time Zone</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="est">Eastern Time (EST)</SelectItem>
              <SelectItem value="cst">Central Time (CST)</SelectItem>
              <SelectItem value="mst">Mountain Time (MST)</SelectItem>
              <SelectItem value="pst">Pacific Time (PST)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sequence Preview */}
        <div>
          <h4 className="mb-4">AI-Generated Sequence Preview</h4>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-muted"></div>
            
            <div className="space-y-6">
              {sequenceSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center relative z-10 ${
                      step.channel === 'email' ? 'bg-blue-100 text-blue-600' :
                      step.channel === 'sms' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5>{step.title}</h5>
                        <Badge variant="outline">Day {step.day}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.channel === 'email' ? 'Automated email with payment link' :
                         step.channel === 'sms' ? 'Text message reminder' :
                         'Automated voice call'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            </div>
            <p className="text-primary">AI is optimizing sequence timing based on your data...</p>
          </div>
        </div>

        <Button className="w-full" size="lg">
          Generate Sequence &amp; Start Campaign
        </Button>
      </CardContent>
    </>
  );
}