import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  CreditCard,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Invoice, BusinessSettings } from '../types';
import { getInvoices, getBusinessSettings } from '../firebase/db';
import { formatCurrency, formatDate, getPaymentBadgeClass } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { useToast } from '../context/ToastContext';

export const Invoices: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Modals
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, s] = await Promise.all([getInvoices(), getBusinessSettings()]);
      setInvoices(inv);
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPDF = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    if (!settings) return;
    try {
      generateInvoicePDF(invoice, settings, true);
      success('PDF Generated', `Invoice #${invoice.invoiceNumber} downloaded.`);
    } catch (err: unknown) {
      error('PDF Error', err instanceof Error ? err.message : String(err));
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerMobile.includes(q) ||
      (inv.acUnitDetails && inv.acUnitDetails.toLowerCase().includes(q));

    const matchesStatus = paymentStatusFilter === 'all' || inv.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-600" />
            <span>Invoices & Official Bills</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            A4 printable customer bills, labour charges, spare parts details, and instant PDF download
          </p>
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Total Billed Volume</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {formatCurrency(totalBilled)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{invoices.length} total bills issued</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-emerald-600">Total Collected</div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {formatCurrency(totalCollected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Paid via Cash, UPI, Cards</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-rose-600">Outstanding Balance</div>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pending collection from customers</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (e.g. CC-), customer name, or mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Payment Status:</span>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
          >
            <option value="all">All Statuses ({invoices.length})</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p>No invoices found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Invoice # / Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">AC Unit & Service</th>
                  <th className="py-3 px-4 text-right">Labour / Parts</th>
                  <th className="py-3 px-4 text-right">Total Bill</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setPreviewInvoice(inv)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-700 text-sm">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">{formatDate(inv.invoiceDate)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerMobile}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {inv.customerAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{inv.acUnitDetails}</div>
                      <div className="text-[11px] text-sky-700 font-medium">{inv.serviceType}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-600">
                      <div>L: {formatCurrency(inv.labourCharge)}</div>
                      {inv.partsCost > 0 && <div>P: {formatCurrency(inv.partsCost)}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                      {formatCurrency(inv.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(inv.amountPaid)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600">
                      {formatCurrency(inv.balanceDue)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentBadgeClass(
                          inv.paymentStatus
                        )}`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
                            title="Collect remaining balance"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDownloadPDF(e, inv)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {previewInvoice && (
        <InvoicePreviewModal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          invoice={previewInvoice}
        />
      )}

      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {
            loadData();
            setPaymentInvoice(null);
          }}
          invoice={paymentInvoice}
        />
      )}
    </div>
  );
};
