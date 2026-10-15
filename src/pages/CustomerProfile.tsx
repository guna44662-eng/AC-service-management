import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  AirVent,
  Wrench,
  Receipt,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Download,
} from 'lucide-react';
import {
  Customer,
  ACUnit,
  ServiceRecord,
  Invoice,
  PaymentRecord,
  Appointment,
} from '../types';
import {
  getCustomerById,
  getACUnitsByCustomer,
  getServicesByCustomer,
  getInvoices,
  getPayments,
  getAppointments,
  deleteACUnit,
} from '../firebase/db';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getPaymentBadgeClass,
  getServiceStatusBadgeClass,
} from '../utils/formatters';
import { CustomerModal } from '../components/modals/CustomerModal';
import { ACUnitModal } from '../components/modals/ACUnitModal';
import { ServiceModal } from '../components/modals/ServiceModal';
import { AppointmentModal } from '../components/modals/AppointmentModal';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal';
import { useToast } from '../context/ToastContext';

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'units' | 'services' | 'bills' | 'payments' | 'appointments'>('units');

  // Modals
  const [editCustomerModal, setEditCustomerModal] = useState(false);
  const [acModalOpen, setAcModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<ACUnit | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const cust = await getCustomerById(id);
      if (!cust) {
        setCustomer(null);
        return;
      }
      setCustomer(cust);

      const [units, srvs, allInvoices, allPayments, allAppts] = await Promise.all([
        getACUnitsByCustomer(id),
        getServicesByCustomer(id),
        getInvoices(),
        getPayments(),
        getAppointments(),
      ]);

      setAcUnits(units);
      setServices(srvs);
      setInvoices(allInvoices.filter((inv) => inv.customerId === id));
      setPayments(allPayments.filter((p) => p.customerId === id));
      setAppointments(allAppts.filter((a) => a.customerId === id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeleteUnit = async (unitId: string, brand: string) => {
    if (!window.confirm(`Delete AC Unit (${brand})?`)) return;
    try {
      await deleteACUnit(unitId);
      success('AC Unit Removed', `${brand} unit removed.`);
      loadData();
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Loading customer record...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-slate-500 text-sm">Customer profile not found.</p>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  // Financial summary for this customer
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Back & Header */}
      <div>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>

        {/* Customer Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-sky-500/20 shrink-0">
                {customer.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {customer.fullName}
                  </h1>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {customer.customerCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                  <div className="flex items-center gap-1 text-slate-700 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.mobileNumber}</span>
                  </div>
                  {customer.altMobileNumber && (
                    <div className="text-slate-400">Alt: {customer.altMobileNumber}</div>
                  )}
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.area}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered {formatDate(customer.createdAt)}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2 max-w-2xl">
                  {customer.address}
                </div>
                {customer.notes && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                    <span className="font-semibold">Technician Note:</span> {customer.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setServiceModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                <span>Record Service</span>
              </button>
              <button
                onClick={() => {
                  setUnitToEdit(null);
                  setAcModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <AirVent className="w-4 h-4" />
                <span>+ Add AC</span>
              </button>
              <button
                onClick={() => setAppointmentModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setEditCustomerModal(true)}
                className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                title="Edit Customer Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Balance Ticker */}
          <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-0.5">
                {formatCurrency(totalBilled)}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-emerald-600">Total Paid</div>
              <div className="text-base font-extrabold font-mono text-emerald-700 mt-0.5">
                {formatCurrency(totalPaid)}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${totalDue > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
              <div className={`text-[10px] uppercase font-bold ${totalDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                Balance Due
              </div>
              <div className={`text-base font-extrabold font-mono mt-0.5 ${totalDue > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {formatCurrency(totalDue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'units'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AirVent className="w-4 h-4" />
          <span>Registered AC Units ({acUnits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'services'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Service History ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'bills'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices & Bills ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'payments'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment History ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            activeTab === 'appointments'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments ({appointments.length})</span>
        </button>
      </div>

      {/* Tab 1: AC Units */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Installed AC Units</h3>
            <button
              onClick={() => {
                setUnitToEdit(null);
                setAcModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add AC Unit</span>
            </button>
          </div>

          {acUnits.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No AC units registered yet for this customer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acUnits.map((unit) => {
                const unitServices = services.filter((s) => s.acUnitId === unit.id);
                return (
                  <div
                    key={unit.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                          <AirVent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{unit.brand}</h4>
                          <span className="text-xs text-slate-500">
                            {unit.acType} • {unit.capacity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setUnitToEdit(unit);
                            setAcModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded"
                          title="Edit Unit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(unit.id, unit.brand)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                      {unit.locationInHome && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span className="font-semibold text-slate-800">{unit.locationInHome}</span>
                        </div>
                      )}
                      {unit.modelNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Model:</span>
                          <span className="font-mono text-slate-800">{unit.modelNumber}</span>
                        </div>
                      )}
                      {unit.serialNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Serial:</span>
                          <span className="font-mono text-slate-800">{unit.serialNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Services Done:</span>
                        <span className="font-bold text-sky-600">{unitServices.length} visits</span>
                      </div>
                    </div>

                    {unit.notes && (
                      <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                        {unit.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Service Records */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {services.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No services logged for this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Date / Code</th>
                    <th className="py-3 px-4">AC Unit</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4">Work Done & Findings</th>
                    <th className="py-3 px-4 text-right">Labour & Parts</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{formatDate(srv.serviceDate)}</div>
                        <div className="font-mono text-[10px] text-slate-400">{srv.serviceCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{srv.acBrand} {srv.acType}</div>
                        <div className="text-[10px] text-slate-400">{srv.acLocation || srv.acCapacity}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                          {srv.serviceType}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 line-clamp-2">{srv.workPerformed}</div>
                        {srv.replacedParts?.length > 0 && (
                          <div className="text-[10px] text-sky-600 mt-0.5 font-medium">
                            Replaced: {srv.replacedParts.map((p) => p.name).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        <div>L: {formatCurrency(srv.labourCharge)}</div>
                        {srv.partsCost > 0 && <div>P: {formatCurrency(srv.partsCost)}</div>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold font-mono text-slate-900">
                          {formatCurrency(srv.totalAmount)}
                        </div>
                        {srv.remainingBalance > 0 && (
                          <div className="text-[10px] text-rose-500 font-semibold font-mono">
                            Due: {formatCurrency(srv.remainingBalance)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentBadgeClass(
                            srv.paymentStatus
                          )}`}
                        >
                          {srv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Bills & Invoices */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No bills generated for this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">AC & Service</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3 px-4 text-slate-800">{inv.acUnitDetails}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {formatCurrency(inv.amountPaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentBadgeClass(
                            inv.paymentStatus
                          )}`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded-lg text-slate-700 text-xs font-semibold transition"
                        >
                          View / Print PDF
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

      {/* Tab 4: Payments History */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Receipt / Date</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference / Notes</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{formatDate(p.paymentDate)}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.paymentCode}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {p.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.transactionRef || p.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Appointments */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No appointments scheduled for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">AC Unit</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{formatDate(a.appointmentDate)}</div>
                        <div className="text-slate-500 text-[11px]">{formatTime(a.appointmentTime)}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{a.serviceType}</td>
                      <td className="py-3 px-4 text-slate-600">{a.acDetails || 'General AC'}</td>
                      <td className="py-3 px-4 text-slate-500">{a.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getServiceStatusBadgeClass(
                            a.status
                          )}`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {editCustomerModal && (
        <CustomerModal
          isOpen={editCustomerModal}
          onClose={() => setEditCustomerModal(false)}
          onSuccess={() => {
            loadData();
            setEditCustomerModal(false);
          }}
          customerToEdit={customer}
        />
      )}

      {acModalOpen && (
        <ACUnitModal
          isOpen={acModalOpen}
          onClose={() => setAcModalOpen(false)}
          onSuccess={() => {
            loadData();
            setAcModalOpen(false);
          }}
          unitToEdit={unitToEdit}
          defaultCustomerId={customer.id}
        />
      )}

      {serviceModalOpen && (
        <ServiceModal
          isOpen={serviceModalOpen}
          onClose={() => setServiceModalOpen(false)}
          onSuccess={() => {
            loadData();
            setServiceModalOpen(false);
          }}
          defaultCustomerId={customer.id}
        />
      )}

      {appointmentModalOpen && (
        <AppointmentModal
          isOpen={appointmentModalOpen}
          onClose={() => setAppointmentModalOpen(false)}
          onSuccess={() => {
            loadData();
            setAppointmentModalOpen(false);
          }}
          defaultCustomerId={customer.id}
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
