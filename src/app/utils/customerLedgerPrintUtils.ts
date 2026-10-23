export interface CustomerLedgerPrintEntry {
  srNo: number;
  date: string;
  time?: string;
  particulars: string;
  slipNo: string;
  voucherNo: string;
  vehicleNo: string;
  productName: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  debit: number;
  credit: number;
  runningBalance: number;
  type: 'OPENING_BALANCE' | 'CREDIT_SALE' | 'PAYMENT' | 'CLOSING_BALANCE';
}

export interface CustomerLedgerPrintData {
  customerName: string;
  customerCode: string;
  contactPerson?: string;
  mobileNo?: string;
  city?: string;
  gstNo?: string;
  panNo?: string;
  creditLimit?: string | number;
  creditPeriod?: number;
  fromDate: string;
  toDate: string;
  fiscalYear: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  totalLitres?: number;
  entries: CustomerLedgerPrintEntry[];
}

const formatCurrency = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatLitres = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val) || val === 0) return '-';
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L';
};

/**
 * Generates and downloads a clean, styled Excel (.xls) statement for the customer ledger
 */
export function exportCustomerLedgerToExcel(data: CustomerLedgerPrintData, stationName: string = 'FUEL STATION') {
  const fileName = `Customer_Ledger_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.fromDate}_to_${data.toDate}`;

  const rowsHtml = (data.entries || []).map((row) => {
    const isSpecial = row.type === 'OPENING_BALANCE' || row.type === 'CLOSING_BALANCE';
    const rowClass = isSpecial ? 'background-color: #f1f5f9; font-weight: bold;' : '';
    const displayDebit = row.debit > 0 ? formatCurrency(row.debit) : '-';
    const displayCredit = row.credit > 0 ? formatCurrency(row.credit) : '-';
    const displayQty = row.quantity && row.quantity > 0 ? formatLitres(row.quantity) : '-';
    const displayRate = row.rate && row.rate > 0 ? formatCurrency(row.rate) : '-';
    const balanceDrCr = row.runningBalance >= 0 ? `${formatCurrency(row.runningBalance)} Dr` : `${formatCurrency(Math.abs(row.runningBalance))} Cr`;

    return `
      <tr style="${rowClass}">
        <td style="border: 0.5pt solid #000; text-align: center;">${row.srNo}</td>
        <td style="border: 0.5pt solid #000; text-align: center;">${row.date} ${row.time || ''}</td>
        <td style="border: 0.5pt solid #000; text-align: left;">${row.particulars}</td>
        <td style="border: 0.5pt solid #000; text-align: center;">${row.slipNo || '-'}</td>
        <td style="border: 0.5pt solid #000; text-align: center;">${row.voucherNo || '-'}</td>
        <td style="border: 0.5pt solid #000; text-align: center;">${row.vehicleNo || '-'}</td>
        <td style="border: 0.5pt solid #000; text-align: left;">${row.productName || '-'}</td>
        <td class="num" style="border: 0.5pt solid #000; text-align: right;">${displayQty}</td>
        <td class="num" style="border: 0.5pt solid #000; text-align: right;">${displayRate}</td>
        <td class="num" style="border: 0.5pt solid #000; text-align: right; color: #1e3a8a;">${displayDebit}</td>
        <td class="num" style="border: 0.5pt solid #000; text-align: right; color: #15803d;">${displayCredit}</td>
        <td class="num" style="border: 0.5pt solid #000; text-align: right; font-weight: bold;">${balanceDrCr}</td>
      </tr>
    `;
  }).join('');

  const grandClosingDrCr = data.closingBalance >= 0 ? `${formatCurrency(data.closingBalance)} Dr` : `${formatCurrency(Math.abs(data.closingBalance))} Cr`;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]><xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Customer_Ledger</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml><![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <style>
        table { border-collapse: collapse; font-family: Arial, Calibri, sans-serif; font-size: 9pt; width: 100%; }
        th { padding: 6px 8px; font-weight: bold; text-align: center; background-color: #e2e8f0; border: 0.5pt solid #000; }
        td { padding: 4px 6px; }
        .num { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tbody>
          <tr>
            <td colspan="12" style="font-size: 16pt; font-weight: bold; text-align: center; border: none; padding: 10px 0;">${stationName}</td>
          </tr>
          <tr>
            <td colspan="12" style="font-size: 11pt; font-weight: bold; text-align: center; border: none; padding-bottom: 8px;">CUSTOMER ACCOUNT LEDGER STATEMENT</td>
          </tr>
          <tr>
            <td colspan="6" style="border: 0.5pt solid #000; background-color: #f8fafc; font-weight: bold;">Customer: ${data.customerName} (${data.customerCode})</td>
            <td colspan="6" style="border: 0.5pt solid #000; background-color: #f8fafc; font-weight: bold; text-align: right;">Period: ${data.fromDate} to ${data.toDate}</td>
          </tr>
          <tr>
            <td colspan="6" style="border: 0.5pt solid #000;">Contact: ${data.contactPerson || '-'} • Mobile: ${data.mobileNo || '-'}</td>
            <td colspan="6" style="border: 0.5pt solid #000; text-align: right;">GSTIN: ${data.gstNo || '-'} • PAN: ${data.panNo || '-'}</td>
          </tr>
          <tr>
            <td colspan="6" style="border: 0.5pt solid #000;">Credit Limit: ₹${data.creditLimit || 'No Limit'} • Credit Period: ${data.creditPeriod || 15} Days</td>
            <td colspan="6" style="border: 0.5pt solid #000; text-align: right; font-weight: bold; color: ${data.closingBalance > 0 ? '#b91c1c' : '#15803d'};">
              Closing Balance: ${grandClosingDrCr}
            </td>
          </tr>
          <tr><td colspan="12" style="border: none; height: 10px;"></td></tr>
          <tr>
            <th>Sr.</th>
            <th>Date &amp; Time</th>
            <th>Particulars</th>
            <th>Slip No.</th>
            <th>Voucher No.</th>
            <th>Vehicle No.</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Rate (₹)</th>
            <th>Debit (₹)</th>
            <th>Credit (₹)</th>
            <th>Balance (₹)</th>
          </tr>
          ${rowsHtml}
          <tr style="background-color: #e2e8f0; font-weight: bold; border-top: 2pt solid #000;">
            <td colspan="9" style="border: 0.5pt solid #000; text-align: right;">TOTAL FOR THE PERIOD</td>
            <td class="num" style="border: 0.5pt solid #000; text-align: right; color: #1e3a8a;">₹${formatCurrency(data.totalDebit)}</td>
            <td class="num" style="border: 0.5pt solid #000; text-align: right; color: #15803d;">₹${formatCurrency(data.totalCredit)}</td>
            <td class="num" style="border: 0.5pt solid #000; text-align: right;">${grandClosingDrCr}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a CSV statement for the customer ledger
 */
export function exportCustomerLedgerToCsv(data: CustomerLedgerPrintData) {
  const fileName = `Customer_Ledger_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.fromDate}_to_${data.toDate}.csv`;

  const headers = [
    'Sr No',
    'Date',
    'Time',
    'Particulars',
    'Slip No',
    'Voucher No',
    'Vehicle No',
    'Product',
    'Quantity',
    'Rate',
    'Debit (INR)',
    'Credit (INR)',
    'Balance (INR)'
  ];

  const csvRows: string[] = [];
  csvRows.push(`"Customer Ledger - ${data.customerName} (${data.customerCode})"`);
  csvRows.push(`"Period: ${data.fromDate} to ${data.toDate}"`);
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  (data.entries || []).forEach(row => {
    const r = [
      row.srNo,
      `"${row.date}"`,
      `"${row.time || ''}"`,
      `"${row.particulars.replace(/"/g, '""')}"`,
      `"${row.slipNo || ''}"`,
      `"${row.voucherNo || ''}"`,
      `"${row.vehicleNo || ''}"`,
      `"${row.productName || ''}"`,
      row.quantity ? row.quantity.toFixed(2) : '',
      row.rate ? row.rate.toFixed(2) : '',
      row.debit ? row.debit.toFixed(2) : '0.00',
      row.credit ? row.credit.toFixed(2) : '0.00',
      row.runningBalance ? row.runningBalance.toFixed(2) : '0.00'
    ];
    csvRows.push(r.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print window with official fuel station statement layout
 */
export function printCustomerLedgerStatement(data: CustomerLedgerPrintData, stationName: string = 'FUEL STATION') {
  const grandClosingDrCr = data.closingBalance >= 0 ? `₹${formatCurrency(data.closingBalance)} Dr` : `₹${formatCurrency(Math.abs(data.closingBalance))} Cr`;

  const rowsHtml = (data.entries || []).map((row) => {
    const isSpecial = row.type === 'OPENING_BALANCE' || row.type === 'CLOSING_BALANCE';
    const rowClass = isSpecial ? 'background: #f1f5f9; font-weight: bold;' : '';
    const displayDebit = row.debit > 0 ? `₹${formatCurrency(row.debit)}` : '-';
    const displayCredit = row.credit > 0 ? `₹${formatCurrency(row.credit)}` : '-';
    const displayQty = row.quantity && row.quantity > 0 ? formatLitres(row.quantity) : '-';
    const displayRate = row.rate && row.rate > 0 ? `₹${formatCurrency(row.rate)}` : '-';
    const balanceDrCr = row.runningBalance >= 0 ? `₹${formatCurrency(row.runningBalance)} Dr` : `₹${formatCurrency(Math.abs(row.runningBalance))} Cr`;

    return `
      <tr style="${rowClass}">
        <td style="text-align: center;">${row.srNo}</td>
        <td style="text-align: center;">${row.date}</td>
        <td>${row.particulars}</td>
        <td style="text-align: center;">${row.slipNo || '-'}</td>
        <td style="text-align: center;">${row.vehicleNo || '-'}</td>
        <td>${row.productName || '-'}</td>
        <td style="text-align: right;">${displayQty}</td>
        <td style="text-align: right;">${displayRate}</td>
        <td style="text-align: right; color: #1e3a8a; font-weight: 500;">${displayDebit}</td>
        <td style="text-align: right; color: #15803d; font-weight: 500;">${displayCredit}</td>
        <td style="text-align: right; font-weight: bold;">${balanceDrCr}</td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Customer Ledger - ${data.customerName}</title>
  <style>
    body { font-family: Arial, Calibri, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff; font-size: 11px; }
    .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 14px; }
    .station-title { font-size: 20px; font-weight: bold; margin: 0; }
    .statement-title { font-size: 14px; font-weight: bold; margin-top: 4px; color: #334155; }
    .meta-grid { display: flex; justify-content: space-between; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 14px; background: #f8fafc; font-size: 11px; }
    .meta-col { display: flex; flex-direction: column; gap: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th { border: 1px solid #000; padding: 6px 4px; background: #e2e8f0; font-weight: bold; }
    td { border: 1px solid #cbd5e1; padding: 5px 4px; }
    .footer-row td { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; background: #f1f5f9; }
    .controls { margin-bottom: 15px; display: flex; gap: 10px; }
    button { padding: 8px 16px; font-size: 12px; cursor: pointer; border-radius: 4px; border: 1px solid #64748b; background: #fff; }
    @media print {
      .controls { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button onclick="window.print()">🖨️ Print Statement</button>
    <button onclick="window.close()">✖ Close Window</button>
  </div>
  <div class="header-box">
    <div class="station-title">${stationName}</div>
    <div class="statement-title">CUSTOMER ACCOUNT STATEMENT / LEDGER</div>
  </div>
  <div class="meta-grid">
    <div class="meta-col">
      <div><strong>Customer:</strong> ${data.customerName} (${data.customerCode})</div>
      <div><strong>Contact:</strong> ${data.contactPerson || '-'} • <strong>Mobile:</strong> ${data.mobileNo || '-'}</div>
      <div><strong>City:</strong> ${data.city || 'Station District'}</div>
    </div>
    <div class="meta-col" style="text-align: right;">
      <div><strong>Period:</strong> ${data.fromDate} to ${data.toDate} (FY ${data.fiscalYear})</div>
      <div><strong>GSTIN:</strong> ${data.gstNo || '—'} • <strong>PAN:</strong> ${data.panNo || '—'}</div>
      <div><strong>Closing Balance:</strong> <span style="font-weight: bold; font-size: 13px; color: ${data.closingBalance > 0 ? '#b91c1c' : '#15803d'};">${grandClosingDrCr}</span></div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">Sr.</th>
        <th style="width: 75px;">Date</th>
        <th>Particulars</th>
        <th style="width: 80px;">Slip No.</th>
        <th style="width: 80px;">Vehicle No.</th>
        <th>Product</th>
        <th style="width: 70px;">Qty (L)</th>
        <th style="width: 60px;">Rate</th>
        <th style="width: 85px;">Debit (₹)</th>
        <th style="width: 85px;">Credit (₹)</th>
        <th style="width: 100px;">Balance (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="footer-row">
        <td colspan="8" style="text-align: right;">TOTAL FOR THE PERIOD</td>
        <td style="text-align: right; color: #1e3a8a;">₹${formatCurrency(data.totalDebit)}</td>
        <td style="text-align: right; color: #15803d;">₹${formatCurrency(data.totalCredit)}</td>
        <td style="text-align: right;">${grandClosingDrCr}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
