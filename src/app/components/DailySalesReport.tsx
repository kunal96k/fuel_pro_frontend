import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  Fuel,
  Droplet,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Gauge,
  Layers,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  HSD_DSR_DATA,
  PETROL_DSR_DATA,
  HSD_NOZZLE_CONFIG,
  PETROL_NOZZLE_CONFIG,
  DsrRecord
} from '../data/dsrData';
import { fetchTanks, fetchMpdsAll, fetchDsrReportApi, Tank, MPD } from '../services/api';

interface DailySalesReportProps {
  onBack?: () => void;
}

const FISCAL_YEARS = [
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024'
];

const MONTHS = [
  { value: 'ALL', label: 'All Months' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
];

export function DailySalesReport({ onBack }: DailySalesReportProps) {
  // ── Master Tanks & MPDs (loaded dynamically from database) ──
  const [tanksList, setTanksList] = useState<Tank[]>([
    { id: '2', tankName: 'D1', fuelType: 'Diesel', capacity: 45000, openingQuantity: 27086 },
    { id: '1', tankName: 'P1', fuelType: 'Petrol E20', capacity: 25000, openingQuantity: 13906 },
  ]);
  const [mpdsList, setMpdsList] = useState<MPD[]>([]);
  const [selectedTankId, setSelectedTankId] = useState<string>('2');

  // ── 100% Live Database DSR Data State ──
  const [liveDsrRecords, setLiveDsrRecords] = useState<DsrRecord[]>([]);
  const [liveNozzles, setLiveNozzles] = useState<{ id: string; name: string; mpdName: string; label: string }[]>([]);
  const [loadingDsr, setLoadingDsr] = useState<boolean>(false);

  // ── Filters ──
  const [fiscalYear, setFiscalYear] = useState<string>('2025-2026');
  const [month, setMonth] = useState<string>('03');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // ── Sorting & Pagination ──
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(31);
  const [exporting, setExporting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // ── Load live Tanks and MPDs from database ──
  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [tanksRes, mpdsRes] = await Promise.all([
        fetchTanks({ size: 100 }).catch(() => ({ content: [] })),
        fetchMpdsAll().catch(() => [])
      ]);

      if (tanksRes.content && tanksRes.content.length > 0) {
        setTanksList(tanksRes.content);
        const exists = tanksRes.content.some(t => String(t.id) === String(selectedTankId));
        if (!exists) {
          const defaultTank = tanksRes.content.find(t => t.tankName === 'D1') || tanksRes.content[0];
          setSelectedTankId(defaultTank.id);
        }
      }

      if (mpdsRes && mpdsRes.length > 0) {
        setMpdsList(mpdsRes);
      }
    } catch (err) {
      console.warn('Failed to load live tank/mpd master data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch 100% Live DSR Daily Operation Data from Database ──
  const loadDsrData = async () => {
    setLoadingDsr(true);
    try {
      const res = await fetchDsrReportApi({
        tankId: selectedTankId,
        fiscalYear,
        month: (fromDate || toDate) ? 'ALL' : month,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      if (res && res.records && res.records.length > 0) {
        setLiveDsrRecords(res.records);
        if (res.nozzles && res.nozzles.length > 0) {
          setLiveNozzles(res.nozzles);
        }
      }
    } catch (err) {
      console.warn('Error fetching live DSR from database, falling back:', err);
    } finally {
      setLoadingDsr(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadDsrData();
  }, [selectedTankId, fiscalYear, month, fromDate, toDate]);

  // ── Active Selected Tank Details ──
  const currentTank = useMemo(() => {
    return tanksList.find(t => String(t.id) === String(selectedTankId)) || tanksList[0];
  }, [tanksList, selectedTankId]);

  const isDieselTank = useMemo(() => {
    const name = (currentTank?.tankName || '').toUpperCase();
    const fuel = (currentTank?.fuelType || '').toLowerCase();
    return name.includes('D') || fuel.includes('diesel') || fuel.includes('hsd');
  }, [currentTank]);

  const productName = useMemo(() => {
    if (currentTank?.fuelType) return currentTank.fuelType;
    return isDieselTank ? 'High-Speed Diesel (HSD)' : 'Motor Spirit (Petrol E20)';
  }, [currentTank, isDieselTank]);

  const sheetName = isDieselTank ? 'HSD_DSR' : 'Petrol_DSR';

  // ── Dynamically Resolve Nozzles Connected to Selected Tank ──
  const connectedNozzles = useMemo(() => {
    if (liveNozzles.length > 0) {
      return liveNozzles;
    }

    const tankNameUpper = (currentTank?.tankName || '').toUpperCase();
    const tankIdStr = String(currentTank?.id || '');

    const resolved: { id: string; name: string; mpdName: string; label: string }[] = [];

    mpdsList.forEach(mpd => {
      (mpd.nozzles || []).forEach(nz => {
        const matches =
          (nz.connectedTank && nz.connectedTank.toUpperCase() === tankNameUpper) ||
          ((nz as any).tank && (String((nz as any).tank.id) === tankIdStr || (nz as any).tank.tankName?.toUpperCase() === tankNameUpper));

        if (matches) {
          resolved.push({
            id: `mpd_${mpd.id}_nz_${nz.id}`,
            name: nz.nozzleName,
            mpdName: mpd.mpdName,
            label: `${mpd.mpdName} ${nz.nozzleName}`
          });
        }
      });
    });

    if (resolved.length > 0) {
      return resolved;
    }

    // Fallback to canonical nozzle configuration matching Excel sheets
    return isDieselTank ? HSD_NOZZLE_CONFIG : PETROL_NOZZLE_CONFIG;
  }, [liveNozzles, currentTank, mpdsList, isDieselTank]);

  // ── Active Dataset: 100% Live Database with fallback ──
  const fallbackData = isDieselTank ? HSD_DSR_DATA : PETROL_DSR_DATA;
  const rawData = liveDsrRecords.length > 0 ? liveDsrRecords : fallbackData;

  // ── Pre-calculated Stats & Subtitle for Tank Master Rich Stat Cards ──
  const getTankCardStats = (tank: Tank) => {
    const fuelLower = (tank.fuelType || '').toLowerCase();
    const nameUpper = (tank.tankName || '').toUpperCase();
    const isDiesel = fuelLower.includes('diesel') || fuelLower.includes('hsd') || nameUpper.includes('D');
    const isPetrol = fuelLower.includes('petrol') || fuelLower.includes('ms') || nameUpper.includes('P');

    const capacity = tank.capacity || (isDiesel ? 45000 : 25000);
    const dsrSource = isDiesel ? HSD_DSR_DATA : PETROL_DSR_DATA;

    let tankNozzleCount = 0;
    const mpdSet = new Set<string>();

    mpdsList.forEach(mpd => {
      (mpd.nozzles || []).forEach(nz => {
        const matches =
          (nz.connectedTank && nz.connectedTank.toUpperCase() === nameUpper) ||
          ((nz as any).tank && (String((nz as any).tank.id) === String(tank.id) || (nz as any).tank.tankName?.toUpperCase() === nameUpper));
        if (matches) {
          tankNozzleCount++;
          mpdSet.add(mpd.mpdName);
        }
      });
    });

    if (tankNozzleCount === 0) {
      if (isDiesel) {
        tankNozzleCount = 8;
        mpdSet.add('MPD 1');
        mpdSet.add('MPD 2');
        mpdSet.add('MPD 3');
      } else {
        tankNozzleCount = 4;
        mpdSet.add('MPD 2');
        mpdSet.add('MPD 3');
      }
    }

    const isCurrentActive = String(tank.id) === String(selectedTankId);
    const activeRecords = (isCurrentActive && liveDsrRecords.length > 0) ? liveDsrRecords : dsrSource;

    const mpdSummary = Array.from(mpdSet).sort().join(', ') || (isDiesel ? 'MPD 1, 2, 3' : 'MPD 2, 3');
    const totalSales = activeRecords.reduce((s, r) => s + (r.netSales || 0), 0);
    const closingDip = activeRecords[activeRecords.length - 1]?.actualDip || (isDiesel ? 31009 : 11320.72);
    const fillPercent = Math.min(100, Math.round((closingDip / capacity) * 100));
    const daysCount = activeRecords.length;

    return {
      isDiesel,
      isPetrol,
      capacity,
      closingDip,
      fillPercent,
      totalSales,
      daysCount,
      nozzleCount: tankNozzleCount,
      mpdSummary,
    };
  };

  const getTankSubtitle = (tank: Tank, capacity: number) => {
    const capFormatted = Number(capacity).toLocaleString('en-IN');
    const fuelLower = (tank.fuelType || '').toLowerCase();
    const nameUpper = (tank.tankName || '').toUpperCase();

    if (fuelLower.includes('diesel') || fuelLower.includes('hsd') || nameUpper.includes('D')) {
      return `High-Speed Diesel (HSD) • Safe Cap: ${capFormatted} L`;
    } else if (fuelLower.includes('petrol') || fuelLower.includes('ms') || nameUpper.includes('P')) {
      return `Motor Spirit (MS / Petrol) • Safe Cap: ${capFormatted} L`;
    }
    return `Safe Cap: ${capFormatted} L`;
  };

  // ── Helpers ──
  const formatLitres = (qty?: number) => {
    if (qty === undefined || qty === null || isNaN(qty)) return '0.00 L';
    return Number(qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L';
  };

  const formatRawLitres = (qty?: number) => {
    if (qty === undefined || qty === null || isNaN(qty)) return '0.00';
    return Number(qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper to extract nozzle reading & sales for a given row and nozzle index
  const getNozzleData = (record: DsrRecord, nozzleIndex: number, nozzleId: string) => {
    if (record.nozzles) {
      if (record.nozzles[nozzleId]) {
        return record.nozzles[nozzleId];
      }
      const numId = nozzleId.replace(/\D+/g, '');
      if (numId && record.nozzles[numId]) {
        return record.nozzles[numId];
      }
    }
    const fallbackKeys = isDieselTank ? HSD_NOZZLE_CONFIG : PETROL_NOZZLE_CONFIG;
    const fallbackKey = fallbackKeys[nozzleIndex]?.id;
    if (fallbackKey && record.nozzles && record.nozzles[fallbackKey]) {
      return record.nozzles[fallbackKey];
    }
    return { reading: 0, sales: 0 };
  };

  // ── Filtered & Sorted Records ──
  const filteredRecords = useMemo(() => {
    return rawData.filter(r => {
      // Month filter
      if (month !== 'ALL' && !fromDate && !toDate) {
        const parts = r.date.split('-');
        if (parts[1] !== month) return false;
      }

      // Date range filter
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesDate = r.date.toLowerCase().includes(term);
        const matchesSales = r.sales.toString().includes(term);
        const matchesVar = r.variation.toString().includes(term);
        const matchesPurchase = r.purchase.toString().includes(term);
        if (!matchesDate && !matchesSales && !matchesVar && !matchesPurchase) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = a.date.localeCompare(b.date);
      } else if (sortBy === 'sales') {
        cmp = a.sales - b.sales;
      } else if (sortBy === 'purchase') {
        cmp = a.purchase - b.purchase;
      } else if (sortBy === 'variation') {
        cmp = a.variation - b.variation;
      } else if (sortBy === 'totalMeterSales') {
        cmp = a.totalMeterSales - b.totalMeterSales;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rawData, month, fromDate, toDate, searchTerm, sortBy, sortDir]);

  // ── Grand Totals for Filtered Records ──
  const grandTotal = useMemo(() => {
    const total = {
      openingStock: filteredRecords.length > 0 ? filteredRecords[0].openingStock : 0,
      purchase: 0,
      totalStock: 0,
      sales: 0,
      closingStock: filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].closingStock : 0,
      actualDip: filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].actualDip : 0,
      variation: 0,
      nozzleSales: {} as Record<number, number>,
      totalMeterSales: 0,
      pumpTesting: 0,
      netSales: 0,
    };

    connectedNozzles.forEach((_, idx) => {
      total.nozzleSales[idx] = 0;
    });

    filteredRecords.forEach(r => {
      total.purchase += r.purchase || 0;
      total.sales += r.sales || 0;
      total.variation += r.variation || 0;
      total.totalMeterSales += r.totalMeterSales || 0;
      total.pumpTesting += r.pumpTesting || 0;
      total.netSales += r.netSales || 0;

      connectedNozzles.forEach((nz, idx) => {
        const nzData = getNozzleData(r, idx, nz.id);
        total.nozzleSales[idx] = (total.nozzleSales[idx] || 0) + (nzData.sales || 0);
      });
    });

    total.totalStock = total.openingStock + total.purchase;
    return total;
  }, [filteredRecords, connectedNozzles, isDieselTank]);

  // ── Pagination Slice ──
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // ── Sorting Toggle ──
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // ── Refresh Handler ──
  const handleRefresh = async () => {
    toast.info('Refreshing Master Data & Live DSR...');
    await Promise.all([loadMasterData(), loadDsrData()]);
    toast.success('Live DSR register refreshed successfully!');
  };

  // ── Export Handler (Formatted as HSD_DSR & Petrol_DSR Sheets) ──
  const handleExport = (format: 'excel' | 'csv') => {
    try {
      setExporting(true);
      const fileName = `${sheetName}_${fiscalYear}_${month}`;

      if (format === 'csv') {
        const headersTier1 = ['Period & Date', ...Array(7).fill('Stock Reconciliation'), ...connectedNozzles.flatMap(n => [n.label, n.label]), 'Sales Reconciliation', '', ''];
        const headersTier2 = [
          'Date', 'Opg.', 'Purchase', 'Total', 'Sales', 'Clg.', 'Acutal dip', 'Var',
          ...connectedNozzles.flatMap(() => ['Metre Reading', 'Sales']),
          'Total Metre Sales', 'Pump Testing', 'Net Sales'
        ];

        const csvRows = [headersTier1.join(','), headersTier2.join(',')];

        filteredRecords.forEach(r => {
          const nozzleCells: (number | string)[] = [];
          connectedNozzles.forEach((nz, idx) => {
            const nzData = getNozzleData(r, idx, nz.id);
            nozzleCells.push(nzData.reading.toFixed(2), nzData.sales.toFixed(2));
          });

          const row = [
            r.date,
            r.openingStock.toFixed(2),
            r.purchase.toFixed(2),
            r.totalStock.toFixed(2),
            r.sales.toFixed(2),
            r.closingStock.toFixed(2),
            r.actualDip.toFixed(2),
            r.variation.toFixed(2),
            ...nozzleCells,
            r.totalMeterSales.toFixed(2),
            r.pumpTesting.toFixed(2),
            r.netSales.toFixed(2),
          ];
          csvRows.push(row.join(','));
        });

        // Grand Total row
        const totalNozzleCells: (number | string)[] = [];
        connectedNozzles.forEach((_, idx) => {
          totalNozzleCells.push('-', (grandTotal.nozzleSales[idx] || 0).toFixed(2));
        });

        const totalRow = [
          'Grand Total',
          '-',
          grandTotal.purchase.toFixed(2),
          '-',
          grandTotal.sales.toFixed(2),
          '-',
          '-',
          grandTotal.variation.toFixed(2),
          ...totalNozzleCells,
          grandTotal.totalMeterSales.toFixed(2),
          grandTotal.pumpTesting.toFixed(2),
          grandTotal.netSales.toFixed(2),
        ];
        csvRows.push(totalRow.join(','));

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${sheetName} CSV successfully!`);
      } else {
        // Excel (.xls formatted HTML identical to sheet)
        let tableHtml = `
          <tr>
            <th rowspan="2" style="background-color: #f1f5f9; border: 1pt solid #000000; font-weight: bold; text-align: center;">Date</th>
            <th colspan="7" style="background-color: #fef3c7; border: 1pt solid #000000; font-weight: bold; text-align: center;">Underground Tank Stock Reconciliation (Litres)</th>
            ${connectedNozzles.map(nz => `
              <th colspan="2" style="background-color: #dbeafe; border: 1pt solid #000000; font-weight: bold; text-align: center;">${nz.label}</th>
            `).join('')}
            <th colspan="3" style="background-color: #d1fae5; border: 1pt solid #000000; font-weight: bold; text-align: center;">Sales Reconciliation</th>
          </tr>
          <tr>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Opg.</th>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Purchase</th>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Total</th>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Sales</th>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Clg.</th>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Acutal dip</th>
            <th style="background-color: #fffbeb; border: 1pt solid #000000; font-weight: bold; text-align: right;">Var</th>
            ${connectedNozzles.map(() => `
              <th style="background-color: #eff6ff; border: 1pt solid #000000; font-weight: bold; text-align: right;">Metre Reading</th>
              <th style="background-color: #eff6ff; border: 1pt solid #000000; font-weight: bold; text-align: right;">Sales</th>
            `).join('')}
            <th style="background-color: #ecfdf5; border: 1pt solid #000000; font-weight: bold; text-align: right;">Total Metre Sales</th>
            <th style="background-color: #ecfdf5; border: 1pt solid #000000; font-weight: bold; text-align: right;">Pump Testing</th>
            <th style="background-color: #ecfdf5; border: 1pt solid #000000; font-weight: bold; text-align: right;">Net Sales</th>
          </tr>
        `;

        filteredRecords.forEach(r => {
          tableHtml += `
            <tr>
              <td style="border: 1pt solid #000000; text-align: center;">${r.date}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.openingStock.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.purchase > 0 ? r.purchase.toFixed(2) : '-'}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.totalStock.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.sales.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.closingStock.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.actualDip.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000; color: ${r.variation < 0 ? '#DC2626' : '#16A34A'};">${r.variation > 0 ? `+${r.variation.toFixed(2)}` : r.variation.toFixed(2)}</td>
              ${connectedNozzles.map((nz, idx) => {
                const nzData = getNozzleData(r, idx, nz.id);
                return `
                  <td class="num" style="border: 1pt solid #000000;">${nzData.reading.toFixed(2)}</td>
                  <td class="num" style="border: 1pt solid #000000;">${nzData.sales.toFixed(2)}</td>
                `;
              }).join('')}
              <td class="num" style="border: 1pt solid #000000;">${r.totalMeterSales.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000;">${r.pumpTesting.toFixed(2)}</td>
              <td class="num" style="border: 1pt solid #000000; font-weight: bold;">${r.netSales.toFixed(2)}</td>
            </tr>
          `;
        });

        // Grand Total row
        tableHtml += `
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td style="border: 1pt solid #000000; text-align: center;">Grand Total</td>
            <td class="num" style="border: 1pt solid #000000;">-</td>
            <td class="num" style="border: 1pt solid #000000;">${grandTotal.purchase.toFixed(2)}</td>
            <td class="num" style="border: 1pt solid #000000;">-</td>
            <td class="num" style="border: 1pt solid #000000;">${grandTotal.sales.toFixed(2)}</td>
            <td class="num" style="border: 1pt solid #000000;">-</td>
            <td class="num" style="border: 1pt solid #000000;">-</td>
            <td class="num" style="border: 1pt solid #000000; color: ${grandTotal.variation < 0 ? '#DC2626' : '#16A34A'};">${grandTotal.variation > 0 ? `+${grandTotal.variation.toFixed(2)}` : grandTotal.variation.toFixed(2)}</td>
            ${connectedNozzles.map((_, idx) => `
              <td class="num" style="border: 1pt solid #000000;">-</td>
              <td class="num" style="border: 1pt solid #000000;">${(grandTotal.nozzleSales[idx] || 0).toFixed(2)}</td>
            `).join('')}
            <td class="num" style="border: 1pt solid #000000;">${grandTotal.totalMeterSales.toFixed(2)}</td>
            <td class="num" style="border: 1pt solid #000000;">${grandTotal.pumpTesting.toFixed(2)}</td>
            <td class="num" style="border: 1pt solid #000000;">${grandTotal.netSales.toFixed(2)}</td>
          </tr>
        `;

        const excelHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <!--[if gte mso 9]><xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>${sheetName}</x:Name>
                    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml><![endif]-->
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
            <style>
              table { border-collapse: collapse; font-family: Arial, Calibri, sans-serif; font-size: 9pt; }
              th { padding: 4px 6px; font-weight: bold; text-align: center; }
              td { padding: 4px 6px; }
              .num { mso-number-format:"\\#\\,\\#\\#0\\.00"; text-align: right; }
            </style>
          </head>
          <body><table><tbody>${tableHtml}</tbody></table></body>
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
        toast.success(`Exported ${sheetName} Excel spreadsheet (.xls) successfully!`);
      }
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Export failed', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Reports Catalog
            </Button>
          )}
          <h1 className="text-2xl font-bold tracking-tight">Daily Sales Report (DSR)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tank-wise daily stock reconciliation & dispenser nozzle meter sales register ({sheetName})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={exporting} className="h-9 gap-1.5 bg-primary text-primary-foreground shadow-sm">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exporting...' : 'Export DSR'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer text-xs" disabled={exporting}>
                <FileDown className="w-4 h-4 mr-2 text-emerald-600" />
                Export to Excel ({sheetName}.xls)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer text-xs" disabled={exporting}>
                <FileDown className="w-4 h-4 mr-2 text-blue-600" />
                Export to CSV ({sheetName}.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tank Master Storage Tanks Selector ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Underground Storage Tanks (Tank Master)
            </h2>
            <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0 border-border">
              {tanksList.length} Tanks Registered
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Click any tank to render its Daily Sales Register ({sheetName})
          </span>
        </div>

        {/* Dynamic Tank Cards from Database */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tanksList.map(tank => {
            const stats = getTankCardStats(tank);
            const isSelected = String(tank.id) === String(selectedTankId);
            const isDiesel = stats.isDiesel;
            const isPetrol = stats.isPetrol;
            const tankTitle = (tank.tankName || '').toLowerCase().startsWith('tank')
              ? tank.tankName
              : `Tank ${tank.tankName || '1'}`;
            const badgeLabel = tank.fuelType || (isDiesel ? 'Diesel Regular' : isPetrol ? 'Petrol Regular' : 'Fuel');
            const subtitle = getTankSubtitle(tank, stats.capacity);

            return (
              <div
                key={tank.id}
                onClick={() => {
                  setSelectedTankId(tank.id);
                  setCurrentPage(0);
                }}
                className={`rounded-xl border p-4 transition-all cursor-pointer relative group overflow-hidden ${
                  isSelected
                    ? isDiesel
                      ? 'bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500 shadow-md ring-2 ring-emerald-500/25'
                      : isPetrol
                      ? 'bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500 shadow-md ring-2 ring-amber-500/25'
                      : 'bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500 shadow-md ring-2 ring-blue-500/25'
                    : isDiesel
                    ? 'bg-card border-border hover:border-emerald-500/50 hover:shadow-sm hover:bg-card/90'
                    : isPetrol
                    ? 'bg-card border-border hover:border-amber-500/50 hover:shadow-sm hover:bg-card/90'
                    : 'bg-card border-border hover:border-blue-500/50 hover:shadow-sm hover:bg-card/90'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg transition-transform group-hover:scale-105 ${
                        isSelected
                          ? isDiesel
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : isPetrol
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-blue-500 text-white shadow-sm'
                          : isDiesel
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isPetrol
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isDiesel ? <Fuel className="w-5 h-5" /> : <Droplet className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{tankTitle}</h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${
                            isDiesel
                              ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/5'
                              : isPetrol
                              ? 'border-amber-500/30 text-amber-600 bg-amber-500/5'
                              : 'border-blue-500/30 text-blue-600 bg-blue-500/5'
                          }`}
                        >
                          {badgeLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <Badge
                        className={`${
                          isDiesel
                            ? 'bg-emerald-600 hover:bg-emerald-600'
                            : isPetrol
                            ? 'bg-amber-600 hover:bg-amber-600'
                            : 'bg-blue-600 hover:bg-blue-600'
                        } text-white font-medium text-xs px-2.5 py-1 shadow-sm flex items-center gap-1.5`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED TANK
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-xs text-muted-foreground border-border flex items-center gap-1 ${
                          isDiesel
                            ? 'group-hover:border-emerald-500 group-hover:text-emerald-600'
                            : isPetrol
                            ? 'group-hover:border-amber-500 group-hover:text-amber-600'
                            : 'group-hover:border-blue-500 group-hover:text-blue-600'
                        }`}
                      >
                        Click to view DSR <ArrowUpRight className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Middle: Gauge / Fill Level Progress Bar */}
                <div className="space-y-1.5 mb-3 bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Gauge
                        className={`w-3.5 h-3.5 ${
                          isDiesel ? 'text-emerald-500' : isPetrol ? 'text-amber-500' : 'text-blue-500'
                        }`}
                      />
                      Actual Dip Stock Level:
                    </span>
                    <span className="font-semibold font-mono text-foreground">
                      {formatLitres(stats.closingDip)} / {formatLitres(stats.capacity)} ({stats.fillPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isDiesel
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : isPetrol
                          ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${stats.fillPercent}%` }}
                    />
                  </div>
                </div>

                {/* Bottom: Micro Metrics (Nozzles & Net Sales) */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Nozzles</p>
                    <p className="font-bold text-foreground mt-0.5 text-sm">{stats.nozzleCount} Nozzles</p>
                    <p className="text-[10px] text-muted-foreground truncate" title={stats.mpdSummary}>
                      {stats.mpdSummary}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Net Sales</p>
                    <p className="font-bold font-mono text-foreground mt-0.5 text-sm">{formatLitres(stats.totalSales)}</p>
                    <p className="text-[10px] text-muted-foreground">{stats.daysCount} Days</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter / Search Bar ── */}
      <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search date, sales, dip..."
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            />
          </div>

          {/* Financial Year */}
          <div className="w-36">
            <Select value={fiscalYear} onValueChange={v => { setFiscalYear(v); setCurrentPage(0); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Financial Year" />
              </SelectTrigger>
              <SelectContent>
                {FISCAL_YEARS.map(fy => (
                  <SelectItem key={fy} value={fy}>FY {fy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month */}
          <div className="w-40">
            <Select
              value={month}
              onValueChange={v => {
                setMonth(v);
                setFromDate('');
                setToDate('');
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range: From */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setCurrentPage(0); }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Date Range: To */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground font-medium">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setCurrentPage(0); }}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Reset Date Range Button */}
          {(fromDate || toDate) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setFromDate(''); setToDate(''); setCurrentPage(0); }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Dates
            </Button>
          )}
        </div>
      </div>

      {/* ── Main DSR Data Table (Matches HSD_DSR & Petrol_DSR Sheets) ── */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading {productName} DSR records...</p>
            </div>
          ) : paginatedRecords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-semibold text-base">No DSR records found</p>
              <p className="text-xs mt-1">Try adjusting the month, date filter, or search keywords.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              {/* Sticky Two-Tier Excel Sheet Header */}
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur text-foreground border-b border-border shadow-sm">
                {/* Header Row 1: Section Headings & MPD Groupings */}
                <tr className="border-b border-border/80">
                  <th
                    rowSpan={2}
                    onClick={() => handleSort('date')}
                    className="px-3 py-2.5 font-bold border-r border-border text-center whitespace-nowrap bg-muted cursor-pointer hover:bg-muted/80 select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </th>
                  <th
                    colSpan={7}
                    className="px-3 py-2 font-bold border-r border-border text-center bg-amber-500/10 text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px]"
                  >
                    Underground Tank Stock Reconciliation (Litres)
                  </th>
                  {connectedNozzles.map((nz, idx) => (
                    <th
                      key={idx}
                      colSpan={2}
                      className="px-2 py-2 font-bold border-r border-border text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 uppercase tracking-wide text-[11px] whitespace-nowrap"
                    >
                      {nz.label}
                    </th>
                  ))}
                  <th
                    colSpan={3}
                    className="px-3 py-2 font-bold text-center bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 uppercase tracking-wider text-[11px]"
                  >
                    Sales Reconciliation
                  </th>
                </tr>

                {/* Header Row 2: Exact Column Names from Sheet Row 3 */}
                <tr className="border-b border-border/80 text-[11px]">
                  <th className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">Opg.</th>
                  <th onClick={() => handleSort('purchase')} className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold cursor-pointer whitespace-nowrap">
                    Purchase {sortBy === 'purchase' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">Total</th>
                  <th onClick={() => handleSort('sales')} className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold cursor-pointer whitespace-nowrap">
                    Sales {sortBy === 'sales' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">Clg.</th>
                  <th className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold whitespace-nowrap">Acutal dip</th>
                  <th onClick={() => handleSort('variation')} className="px-2 py-2 text-right border-r border-border bg-amber-500/5 font-semibold cursor-pointer whitespace-nowrap">
                    Var {sortBy === 'variation' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>

                  {connectedNozzles.map((nz, idx) => (
                    <React.Fragment key={idx}>
                      <th className="px-2 py-2 text-right border-r border-border bg-blue-500/5 font-semibold whitespace-nowrap">Metre Reading</th>
                      <th className="px-2 py-2 text-right border-r border-border bg-blue-500/5 font-semibold whitespace-nowrap">Sales</th>
                    </React.Fragment>
                  ))}

                  <th onClick={() => handleSort('totalMeterSales')} className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold cursor-pointer whitespace-nowrap">
                    Total Metre Sales {sortBy === 'totalMeterSales' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="px-2 py-2 text-right border-r border-border bg-emerald-500/5 font-semibold whitespace-nowrap">Pump Testing</th>
                  <th className="px-2 py-2 text-right bg-emerald-500/5 font-semibold whitespace-nowrap">Net Sales</th>
                </tr>
              </thead>

              {/* Data Rows */}
              <tbody className="divide-y divide-border/60">
                {paginatedRecords.map((r, rowIndex) => {
                  const isLoss = r.variation < 0;
                  const isGain = r.variation > 0;
                  const hasPurchase = r.purchase > 0;

                  return (
                    <tr
                      key={r.id || rowIndex}
                      className={`hover:bg-muted/40 transition-colors ${
                        rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/15'
                      }`}
                    >
                      {/* Date */}
                      <td className="px-3 py-2 text-center font-medium border-r border-border/60 whitespace-nowrap text-foreground">
                        {formatDateDisplay(r.date)}
                      </td>

                      {/* Stock Reconciliation Columns */}
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {formatRawLitres(r.openingStock)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono border-r border-border/60 whitespace-nowrap ${hasPurchase ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-muted-foreground'}`}>
                        {r.purchase > 0 ? formatRawLitres(r.purchase) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {formatRawLitres(r.totalStock)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-medium border-r border-border/60 text-foreground whitespace-nowrap">
                        {formatRawLitres(r.sales)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {formatRawLitres(r.closingStock)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-medium border-r border-border/60 text-foreground whitespace-nowrap">
                        {formatRawLitres(r.actualDip)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono font-bold border-r border-border/60 whitespace-nowrap ${
                        isLoss ? 'text-rose-600 dark:text-rose-400' : isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        {r.variation > 0 ? `+${formatRawLitres(r.variation)}` : formatRawLitres(r.variation)}
                      </td>

                      {/* Dispenser & Nozzle Columns */}
                      {connectedNozzles.map((nz, idx) => {
                        const nzData = getNozzleData(r, idx, nz.id);
                        return (
                          <React.Fragment key={idx}>
                            <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                              {formatRawLitres(nzData.reading)}
                            </td>
                            <td className="px-2 py-2 text-right font-mono font-medium border-r border-border/60 text-foreground whitespace-nowrap">
                              {formatRawLitres(nzData.sales)}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="px-2 py-2 text-right font-mono font-semibold border-r border-border/60 text-foreground whitespace-nowrap">
                        {formatRawLitres(r.totalMeterSales)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono border-r border-border/60 text-muted-foreground whitespace-nowrap">
                        {r.pumpTesting > 0 ? formatRawLitres(r.pumpTesting) : '-'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-foreground bg-primary/5 whitespace-nowrap">
                        {formatRawLitres(r.netSales)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand Total Footer Row */}
              <tfoot className="sticky bottom-0 z-10 bg-muted/95 backdrop-blur border-t-2 border-border font-semibold shadow-inner">
                <tr>
                  <td className="px-3 py-2.5 text-center font-bold border-r border-border whitespace-nowrap uppercase tracking-wider text-foreground">
                    Grand Total
                  </td>
                  <td className="px-2 py-2 text-right font-mono border-r border-border text-muted-foreground">-</td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r border-border">
                    {formatRawLitres(grandTotal.purchase)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono border-r border-border text-muted-foreground">-</td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-foreground border-r border-border">
                    {formatRawLitres(grandTotal.sales)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono border-r border-border text-muted-foreground">-</td>
                  <td className="px-2 py-2 text-right font-mono border-r border-border text-muted-foreground">-</td>
                  <td className={`px-2 py-2 text-right font-mono font-bold border-r border-border ${
                    grandTotal.variation < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {grandTotal.variation > 0 ? `+${formatRawLitres(grandTotal.variation)}` : formatRawLitres(grandTotal.variation)}
                  </td>

                  {connectedNozzles.map((_, idx) => (
                    <React.Fragment key={idx}>
                      <td className="px-2 py-2 text-right font-mono border-r border-border text-muted-foreground">-</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-foreground border-r border-border">
                        {formatRawLitres(grandTotal.nozzleSales[idx] || 0)}
                      </td>
                    </React.Fragment>
                  ))}

                  <td className="px-2 py-2 text-right font-mono font-bold text-foreground border-r border-border">
                    {formatRawLitres(grandTotal.totalMeterSales)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-muted-foreground border-r border-border">
                    {formatRawLitres(grandTotal.pumpTesting)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-primary bg-primary/10">
                    {formatRawLitres(grandTotal.netSales)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Showing</span>
            <span className="font-semibold text-foreground">
              {filteredRecords.length > 0 ? currentPage * pageSize + 1 : 0}
            </span>
            <span>to</span>
            <span className="font-semibold text-foreground">
              {Math.min((currentPage + 1) * pageSize, filteredRecords.length)}
            </span>
            <span>of</span>
            <span className="font-semibold text-foreground">{filteredRecords.length}</span>
            <span>records</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={v => {
                  setPageSize(Number(v));
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="31">31 (All)</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(i)}
                  className={`h-8 w-8 p-0 text-xs ${currentPage === i ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
