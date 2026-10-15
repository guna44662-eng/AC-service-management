import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  Calendar,
  AlertCircle,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { PaymentRecord, Invoice, Customer } from '../types';
import { getPayments, getInvoices, getCustomers } from '../firebase/db';
import { formatCurrency, formatDate, getPaymentBadgeClass } from '../utils/formatters';
import { RecordPaymentModal } from '../components/modals/RecordPaymentModal';
import { useToast } from '../context/ToastContext';

export const Payments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Tab
  const [activeTab, setActiveTab] = useState<'history' | 'outstanding' | 'monthly' | 'customerwise'>('history');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, inv, cust] = await Promise.all([getPayments(), getInvoices(), getCustomers()]);
      setPayments(p);
      setInvoices(inv);
      setCustomers(cust);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Outstanding invoices (balanceDue > 0)
  const outstandingInvoices = invoices.filter((i) => i.balanceDue > 0);

  // Filtered Payments History
  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.customerName.toLowerCase().includes(q) ||
      p.invoiceNumber.toLowerCase().includes(q) ||
      (p.paymentCode && p.paymentCode.toLowerCase().includes(q)) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(q));

    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Total sums
  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);

  // Monthly Revenue Aggregation
  const monthlyRevenueMap: { [monthKey: string]: { month: string; billed: number; collected: number } } = {};
  invoices.forEach((inv) => {
    const monthKey = inv.invoiceDate.slice(0, 7); // YYYY-MM
    if (!monthlyRevenueMap[monthKey]) {
      const d = new Date(inv.invoiceDate);
      const monthLabel = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      monthlyRevenueMap[monthKey] = { month: monthLabel, billed: 0, collected: 0 };
    }
    monthlyRevenueMap[monthKey].billed += Number(inv.totalAmount) || 0;
  });
  payments.forEach((p) => {
    const monthKey = p.paymentDate.slice(0, 7);
    if (!monthlyRevenueMap[monthKey]) {
      const d = new Date(p.paymentDate);
      const monthLabel = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      monthlyRevenueMap[monthKey] = { month: monthLabel, billed: 0, collected: 0 };
    }
    monthlyRevenueMap[monthKey].collected += Number(p.amount) || 0;
  });
  const monthlySummaries = Object.entries(monthlyRevenueMap).sort((a, b) => b[0].localeCompare(a[0]));

  // Customer-wise expenses aggregation
  const customerExpenseMap: { [custId: string]: { name: string; phone: string; billed: number; paid: number; due: number } } = {};
  invoices.forEach((inv) => {
    if (!customerExpenseMap[inv.customerId]) {
      customerExpenseMap[inv.customerId] = {
        name: inv.customerName,
        phone: inv.customerMobile,
        billed: 0,
        paid: 0,
        due: 0,
      };
    }
    customerExpenseMap[inv.customerId].billed += Number(inv.totalAmount) || 0;
    customerExpenseMap[inv.customerId].paid += Number(inv.amountPaid) || 0;
    customerExpenseMap[inv.customerId].due += Number(inv.balanceDue) || 0;
  });
  const customerExpenseList = Object.values(customerExpenseMap).sort((a, b) => b.billed - a.billed);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Payments & Revenue Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cash, UPI and card collections, outstanding customer balances and revenue reports
          </p>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-emerald-600">Total Collected Revenue</div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {formatCurrency(totalCollected)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{payments.length} successful payment receipts</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-rose-600">Total Pending Balances</div>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{outstandingInvoices.length} invoices with balance due</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Total Customer Invoices</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {invoices.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across all registered households</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('outstanding')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'outstanding'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {outstandingInvoices.length > 0 && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
          <span>Outstanding Balance Report ({outstandingInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'monthly'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Monthly Revenue Summary
        </button>

        <button
          onClick={() => setActiveTab('customerwise')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'customerwise'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Service Expenses
        </button>
      </div>

      {/* Tab 1: Payment Transactions History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payment by customer, invoice #, receipt #, or UPI ref..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI (GooglePay / PhonePe)</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Other">Bank Transfer</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                <CreditCard className="w-8 h-8 mx-auto text-slate-300" />
                <p>No payment entries found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Receipt / Date</th>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Transaction Ref / Notes</th>
                      <th className="py-3 px-4 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{formatDate(p.paymentDate)}</div>
                          <div className="font-mono text-[10px] text-cyan-600 font-bold">{p.paymentCode}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                          {p.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {p.customerName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                          <div>{p.transactionRef || '-'}</div>
                          {p.notes && <div className="text-[10px] text-slate-400 italic">{p.notes}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-600">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Outstanding Balance Report */}
      {activeTab === 'outstanding' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {outstandingInvoices.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <div className="font-bold text-slate-800 text-sm">All Bills Cleared!</div>
              <p>There are currently no outstanding unpaid balances from customers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-rose-50/60 border-b border-rose-200/80 text-rose-900 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4 text-right">Total Bill</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right font-black">Remaining Balance Due</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-rose-50/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{inv.customerMobile}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600">
                        {formatCurrency(inv.amountPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-rose-600">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForPayment(inv)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95"
                        >
                          Collect Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Monthly Revenue Summary */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4 text-right">Total Invoiced Amount</th>
                  <th className="py-3 px-4 text-right">Collected Revenue</th>
                  <th className="py-3 px-4 text-right">Pending Collection</th>
                  <th className="py-3 px-4 text-center">Collection Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlySummaries.map(([key, data]) => {
                  const pending = Math.max(0, data.billed - data.collected);
                  const rate = data.billed > 0 ? Math.round((data.collected / data.billed) * 100) : 100;
                  return (
                    <tr key={key} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {data.month}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(data.billed)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">
                        {formatCurrency(data.collected)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                        {formatCurrency(pending)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            rate >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : rate >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Customer-wise Service Expenses */}
      {activeTab === 'customerwise' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerExpenseList.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.phone}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(c.billed)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(c.paid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-rose-600">
                      {formatCurrency(c.due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => {
            loadData();
            setSelectedInvoiceForPayment(null);
          }}
          invoice={selectedInvoiceForPayment}
        />
      )}
    </div>
  );
};
