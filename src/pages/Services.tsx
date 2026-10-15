import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  Calendar,
  DollarSign,
  FileText,
  Receipt,
  Trash2,
  AirVent,
  User,
  ChevronDown,
} from 'lucide-react';
import { ServiceRecord, Invoice, ServiceType } from '../types';
import { getServices, getInvoices, deleteServiceRecord } from '../firebase/db';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getPaymentBadgeClass,
  getServiceStatusBadgeClass,
} from '../utils/formatters';
import { ServiceModal } from '../components/modals/ServiceModal';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal';
import { useToast } from '../context/ToastContext';

export const Services: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedServiceStatus, setSelectedServiceStatus] = useState('all');

  // Modals
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

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

  const handleDelete = async (service: ServiceRecord) => {
    if (!window.confirm(`Delete service record #${service.serviceCode} for ${service.customerName}?`)) {
      return;
    }
    try {
      await deleteServiceRecord(service.id);
      success('Service Deleted', `Record #${service.serviceCode} removed.`);
      loadData();
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : String(err));
    }
  };

  const filteredServices = services.filter((srv) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      srv.customerName.toLowerCase().includes(q) ||
      srv.customerMobile.includes(q) ||
      srv.serviceCode.toLowerCase().includes(q) ||
      srv.acBrand.toLowerCase().includes(q) ||
      (srv.workPerformed && srv.workPerformed.toLowerCase().includes(q)) ||
      (srv.complaint && srv.complaint.toLowerCase().includes(q));

    const matchesType = selectedType === 'all' || srv.serviceType === selectedType;
    const matchesPayment = selectedPaymentStatus === 'all' || srv.paymentStatus === selectedPaymentStatus;
    const matchesStatus = selectedServiceStatus === 'all' || srv.status === selectedServiceStatus;

    return matchesSearch && matchesType && matchesPayment && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-600" />
            <span>Service & Job Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanent AC maintenance logs, gas refilling, spare parts, labour charges and invoices
          </p>
        </div>
        <button
          onClick={() => setServiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Service</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, service code (SRV-), complaint, or AC brand..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Service Types</option>
              <option value="General Service">General Service</option>
              <option value="Deep Cleaning">Deep Cleaning</option>
              <option value="Gas Refilling">Gas Refilling</option>
              <option value="Repair">Repair</option>
              <option value="Installation">Installation</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Payments</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <select
              value={selectedServiceStatus}
              onChange={(e) => setSelectedServiceStatus(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="all">All Job Status</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading service records...</div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <Wrench className="w-8 h-8 mx-auto text-slate-300" />
            <p>No service records found matching your filters.</p>
            <button
              onClick={() => setServiceModalOpen(true)}
              className="px-4 py-2 bg-sky-50 text-sky-600 font-semibold rounded-lg hover:bg-sky-100 transition"
            >
              Record First Service
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Service ID / Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">AC Unit Details</th>
                  <th className="py-3 px-4">Type & Work Performed</th>
                  <th className="py-3 px-4 text-right">Charges</th>
                  <th className="py-3 px-4 text-right">Net Total</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Invoice & PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((srv) => {
                  const matchedInvoice = invoices.find((inv) => inv.serviceId === srv.id);
                  return (
                    <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-cyan-600">
                          {srv.serviceCode}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {formatDate(srv.serviceDate)}
                        </div>
                        {srv.serviceTime && (
                          <div className="text-[10px] text-slate-400">{formatTime(srv.serviceTime)}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{srv.customerName}</div>
                        <div className="text-[11px] text-slate-500">{srv.customerMobile}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {srv.customerAddress}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {srv.acBrand} {srv.acType}
                        </div>
                        <div className="text-[11px] text-slate-500">{srv.acCapacity}</div>
                        {srv.acLocation && (
                          <div className="text-[10px] text-slate-400">Loc: {srv.acLocation}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold mb-1">
                          {srv.serviceType}
                        </span>
                        <div className="text-slate-800 line-clamp-2 leading-relaxed">
                          {srv.workPerformed}
                        </div>
                        {srv.gasLevelDetails && (
                          <div className="text-[10px] text-cyan-700 font-medium mt-0.5">
                            Gas: {srv.gasLevelDetails}
                          </div>
                        )}
                        {srv.replacedParts?.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Parts ({srv.replacedParts.length}):{' '}
                            {srv.replacedParts.map((p) => p.name).join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-600">
                        <div>Labour: {formatCurrency(srv.labourCharge)}</div>
                        {srv.partsCost > 0 && <div>Parts: {formatCurrency(srv.partsCost)}</div>}
                        {srv.additionalCharges > 0 && <div>Gas/Add: {formatCurrency(srv.additionalCharges)}</div>}
                        {srv.discount > 0 && <div className="text-emerald-600">Disc: -{formatCurrency(srv.discount)}</div>}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold font-mono text-sm text-slate-900">
                          {formatCurrency(srv.totalAmount)}
                        </div>
                        {srv.remainingBalance > 0 ? (
                          <div className="text-[10px] font-mono font-bold text-rose-500 mt-0.5">
                            Due: {formatCurrency(srv.remainingBalance)}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-emerald-600 mt-0.5">Cleared</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentBadgeClass(
                            srv.paymentStatus
                          )}`}
                        >
                          {srv.paymentStatus}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{srv.paymentMethod}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {matchedInvoice ? (
                            <button
                              onClick={() => setPreviewInvoice(matchedInvoice)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold transition"
                              title="Preview or Download Bill"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Bill</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">No bill</span>
                          )}

                          <button
                            onClick={() => handleDelete(srv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Delete service log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {serviceModalOpen && (
        <ServiceModal
          isOpen={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          onSuccess={() => {
            loadData();
            setServiceModalOpen(false);
          }}
        />
      )}

      {previewInvoice && (
        <InvoicePreviewModal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          invoice={previewInvoice}
        />
      )}
    </div>
  );
};
