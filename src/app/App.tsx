import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ImportWizard } from './components/ImportWizard';
import { SalesWizard } from './components/SalesWizard';
import { DailyOperation } from './components/DailyOperation';
import { CashCollection } from './components/CashCollection';
import { CreditSales } from './components/CreditSales';
import { EmployeeAssign } from './components/EmployeeAssign';
import { TemplateLibrary } from './components/TemplateLibrary';
import { SequenceGenerator } from './components/SequenceGenerator';
import { Analytics } from './components/Analytics';
import { PaymentPortal } from './components/PaymentPortal';
import { ComplianceCenter } from './components/ComplianceCenter';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
import { ReportViewer } from './components/ReportViewer';
import { TankMaster } from './components/TankMaster';
import { ProductMaster } from './components/ProductMaster';
import { MPDMaster } from './components/MPDMaster';
import { EmployeeMaster } from './components/EmployeeMaster';
import { ShiftsMaster } from './components/ShiftsMaster';
import { UserMaster } from './components/UserMaster';
import { VehiclesMaster } from './components/VehiclesMaster';
import { Expenses } from './components/Expenses';
import { VoucherPayment } from './components/VoucherPayment';
import { VoucherReceipt } from './components/VoucherReceipt';

const reportTitles: Record<string, string> = {
  'daily-shift-report': 'Daily Shift Report',
  'credit-sale-report': 'Credit Sale Report',
  'own-usage-report': 'Own Usage Report',
  'monthly-yearly-summary': 'Monthly/Yearly Summary Report',
  'daily-sales-report': 'Daily Sales Report (DSR)',
  'cash-shortage-report': 'Cash Shortage Report',
  'stock-report': 'Stock Report',
  'ledger-statement': 'Ledger Statement',
  'dispensing-unit-sale': 'Dispensing Unit/Nozzle Sale Report',
  'employee-performance': 'Employee Performance Report',
  'integrated-report': 'Integrated Report for Multiple Outlets',
  'customised-reports': 'Customised Reports',
  'tds-tcs-report': 'TDS & TCS Report',
  'audit-trails': 'Audit Trails'
};

import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    // Check if it's a specific report
    if (reportTitles[activeSection]) {
      return (
        <ReportViewer 
          reportId={activeSection}
          reportTitle={reportTitles[activeSection]}
          onBack={() => setActiveSection('reports')}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'tank':
        return <TankMaster />;
      case 'product':
        return <ProductMaster />;
      case 'mpd':
        return <MPDMaster />;
      case 'employee':
        return <EmployeeMaster />;
      case 'shifts':
        return <ShiftsMaster />;
      case 'user':
        return <UserMaster />;
      case 'vehicles':
        return <VehiclesMaster />;
      case 'fuel-purchase':
      case 'oil-purchase':
      case 'tanker-load':
        return <ImportWizard purchaseType={activeSection} />;
      case 'fuel-sale':
      case 'oil-sale':
        return <SalesWizard saleType={activeSection} />;
      case 'cash-collection':
        return <CashCollection />;
      case 'credit-sales':
        return <CreditSales />;
      case 'employee-assign':
        return <EmployeeAssign />;
      case 'own-usage':
      case 'fuel-testing':
        return <DailyOperation operationType={activeSection} />;
      case 'density':
        return (
          <div className="p-8">
            <h1 className="mb-6">Density</h1>
            <p className="text-muted-foreground">Density management section coming soon.</p>
          </div>
        );
      case 'reports':
        return <Reports onReportSelect={setActiveSection} />;
      case 'templates':
        return <TemplateLibrary />;
      case 'sequences':
        return <SequenceGenerator />;
      case 'analytics':
        return <Analytics />;
      case 'expenses':
        return <Expenses />;
      case 'payment':
        return <VoucherPayment />;
      case 'receipt':
        return <VoucherReceipt />;
      case 'payments':
        return <PaymentPortal />;
      case 'compliance':
        return <ComplianceCenter />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
