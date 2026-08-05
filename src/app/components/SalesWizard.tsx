import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { FuelSaleForm } from './FuelSaleForm';
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

interface SalesStep {
  id: number;
  title: string;
  description: string;
}

const steps: SalesStep[] = [
  { id: 1, title: 'Upload File', description: 'Select and upload your sales data file' },
  { id: 2, title: 'Field Mapping', description: 'Map your columns to required fields' },
  { id: 3, title: 'Validation', description: 'Review and fix any data issues' },
  { id: 4, title: 'Invoice Setup', description: 'Configure your invoice details' }
];

interface SalesWizardProps {
  saleType?: string;
}

export function SalesWizard({ saleType = 'fuel-sale' }: SalesWizardProps) {
  const getSaleTitle = () => {
    switch (saleType) {
      case 'fuel-sale':
        return 'Fuel Sale';
      case 'oil-sale':
        return 'Oil Sale';
      default:
        return 'Sale';
    }
  };

  if (saleType === 'fuel-sale' || saleType === 'oil-sale') {
    return (
      <div className="p-8">
        <FuelSaleForm defaultTab={saleType === 'oil-sale' ? 'Oil Sale' : 'MPD_1'} />
      </div>
    );
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
        return <InvoiceSetupStep />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1>Sales - {getSaleTitle()}</h1>
        <p className="text-muted-foreground">Manage your sales data and generate invoices</p>
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
          Upload Your Sales Data File
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
  const detectedColumns = ['customer_name', 'product_name', 'quantity', 'unit_price', 'sale_date'];
  const requiredFields = ['Customer Name', 'Product', 'Quantity', 'Unit Price', 'Sale Date'];
  
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
                    Sample: {index === 0 ? 'ABC Motors' : index === 1 ? 'Diesel' : index === 2 ? '500' : index === 3 ? '₹85.50' : '2024-03-05'}
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
                  <td className="p-3">ABC Motors</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">500</td>
                  <td className="p-3">₹85.50</td>
                  <td className="p-3">2024-03-05</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">XYZ Transport</td>
                  <td className="p-3">Petrol</td>
                  <td className="p-3">300</td>
                  <td className="p-3">₹92.00</td>
                  <td className="p-3">2024-03-05</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">DEF Logistics</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">750</td>
                  <td className="p-3">₹85.50</td>
                  <td className="p-3">2024-03-05</td>
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
    { row: 15, field: 'Quantity', issue: 'Negative quantity', value: '-50' },
    { row: 23, field: 'Customer Name', issue: 'Missing customer name', value: '' },
    { row: 31, field: 'Unit Price', issue: 'Non-numeric price', value: 'N/A' }
  ];

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Validation &amp; Preview</span>
          <Badge variant="destructive">8 rows need attention</Badge>
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
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Quantity</th>
                  <th className="p-3 text-left">Unit Price</th>
                  <th className="p-3 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </td>
                  <td className="p-3">ABC Motors</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">500</td>
                  <td className="p-3">₹85.50</td>
                  <td className="p-3">₹42,750.00</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </td>
                  <td className="p-3 text-red-500">Missing</td>
                  <td className="p-3">Petrol</td>
                  <td className="p-3">300</td>
                  <td className="p-3">₹92.00</td>
                  <td className="p-3">₹27,600.00</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </td>
                  <td className="p-3">DEF Logistics</td>
                  <td className="p-3">Diesel</td>
                  <td className="p-3">750</td>
                  <td className="p-3">₹85.50</td>
                  <td className="p-3">₹64,125.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </>
  );
}

function InvoiceSetupStep() {
  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Invoice Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
            <Input id="invoice-prefix" placeholder="INV-2024-" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-date">Invoice Date</Label>
            <Input id="invoice-date" type="date" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="due-date">Payment Due Date</Label>
            <Input id="due-date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-terms">Payment Terms</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="net15">Net 15 Days</SelectItem>
                <SelectItem value="net30">Net 30 Days</SelectItem>
                <SelectItem value="net45">Net 45 Days</SelectItem>
                <SelectItem value="net60">Net 60 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tax Configuration */}
        <div className="space-y-4">
          <h4>Tax Configuration</h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="gst-rate">GST Rate (%)</Label>
              <Input id="gst-rate" type="number" placeholder="18" onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-type">Tax Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inclusive">Tax Inclusive</SelectItem>
                  <SelectItem value="exclusive">Tax Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="mb-3">Invoice Summary</h4>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Sales Records:</span>
            <span>156</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>₹6,84,250.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST (18%):</span>
            <span>₹1,23,165.00</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-semibold">₹8,07,415.00</span>
          </div>
        </div>

        <Button className="w-full" size="lg">
          Generate Invoices
        </Button>
      </CardContent>
    </>
  );
}