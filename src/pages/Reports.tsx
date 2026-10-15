import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Wrench,
  RotateCcw,
} from 'lucide-react';
import { ServiceRecord, Invoice } from '../types';
import { getServices, getInvoices } from '../firebase/db';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const { success } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, inv] = await Promise.all([getServices(), getInvoices()]);
      setServices(s);
      setInvoices(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedType('all');
    setSelectedServiceType('all');
    setSelectedPaymentStatus('all');
    setStartDate('');
    setEndDate('');
  };

  // Distinct brands & types
  const brands = Array.from(new Set(services.map((s) => s.acBrand).filter(Boolean)));
  const acTypes = Array.from(new Set(services.map((s) => s.acType).filter(Boolean)));
  const serviceTypes = Array.from(new Set(services.map((s) => s.serviceType).filter(Boolean)));

  // Filtered dataset
  const filteredServices = services.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerMobile.includes(q) ||
      s.serviceCode.toLowerCase().includes(q) ||
      (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
      s.acBrand.toLowerCase().includes(q);

    const matchesBrand = selectedBrand === 'all' || s.acBrand === selectedBrand;
    const matchesType = selectedType === 'all' || s.acType === selectedType;
    const matchesService = selectedServiceType === 'all' || s.serviceType === selectedServiceType;
    const matchesPayment = selectedPaymentStatus === 'all' || s.paymentStatus === selectedPaymentStatus;

    let matchesDate = true;
    if (startDate && s.serviceDate < startDate) matchesDate = false;
    if (endDate && s.serviceDate > endDate) matchesDate = false;

    return matchesSearch && matchesBrand && matchesType && matchesService && matchesPayment && matchesDate;
  });

  // Analytics on filtered dataset
  const totalServicesCount = filteredServices.length;
  const filteredBilled = filteredServices.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const filteredCollected = filteredServices.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
  const filteredDue = filteredServices.reduce((sum, s) => sum + (Number(s.remainingBalance) || 0), 0);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredServices.length === 0) return;

    const headers = [
      'Service ID',
      'Invoice Number',
      'Service Date',
      'Customer Name',
      'Mobile Number',
      'Address',
      'AC Brand',
      'AC Type',
      'AC Capacity',
      'Service Type',
      'Work Performed',
      'Labour Charge (INR)',
      'Parts Cost (INR)',
      'Total Amount (INR)',
      'Amount Paid (INR)',
      'Remaining Balance (INR)',
      'Payment Method',
      'Payment Status',
      'Next Service Due',
    ];

    const rows = filteredServices.map((s) => [
      `"${s.serviceCode || ''}"`,
      `"${s.invoiceNumber || ''}"`,
      `"${s.serviceDate || ''}"`,
      `"${s.customerName.replace(/"/g, '""')}"`,
      `"${s.customerMobile || ''}"`,
      `"${(s.customerAddress || '').replace(/"/g, '""')}"`,
      `"${s.acBrand || ''}"`,
      `"${s.acType || ''}"`,
      `"${s.acCapacity || ''}"`,
      `"${s.serviceType || ''}"`,
      `"${(s.workPerformed || '').replace(/"/g, '""')}"`,
      s.labourCharge || 0,
      s.partsCost || 0,
      s.totalAmount || 0,
      s.amountPaid || 0,
      s.remainingBalance || 0,
      `"${s.paymentMethod || ''}"`,
      `"${s.paymentStatus || ''}"`,
      `"${s.nextRecommendedDate || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CoolCare_Service_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Report Exported', 'CSV spreadsheet successfully downloaded.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" />
            <span>Reports & Analytical Search</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-filter services by date range, equipment, payment status and export to CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredServices.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download CSV Report</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Advanced Search & Query Filters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>

        {/* Row 1: Search & Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, invoice #, service ID..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-3">
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From date"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To date"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-semibold">AC Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-semibold">AC Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All AC Types</option>
              {acTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Service Type</label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Service Types</option>
              {serviceTypes.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Services Found</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalServicesCount}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
          <div className="text-xl font-extrabold font-mono text-slate-900 mt-0.5">
            {formatCurrency(filteredBilled)}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-emerald-600">Collected</div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 mt-0.5">
            {formatCurrency(filteredCollected)}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-rose-600">Balance Due</div>
          <div className="text-xl font-extrabold font-mono text-rose-600 mt-0.5">
            {formatCurrency(filteredDue)}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading report data...</div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <BarChart3 className="w-8 h-8 mx-auto text-slate-300" />
            <p>No records match the report criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Date / Code</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">AC Unit</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Labour</th>
                  <th className="py-3 px-4 text-right">Parts</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Next Service Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatDate(s.serviceDate)}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.serviceCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{s.customerName}</div>
                      <div className="text-[11px] text-slate-500">{s.customerMobile}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {s.acBrand} ({s.acCapacity})
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        {s.serviceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(s.labourCharge)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(s.partsCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(s.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">
                      {formatCurrency(s.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatCurrency(s.remainingBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-[10px] text-slate-700">{s.paymentStatus}</span>
                    </td>
                    <td className="py-3 px-4 text-sky-700 font-semibold">
                      {s.nextRecommendedDate ? formatDate(s.nextRecommendedDate) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
