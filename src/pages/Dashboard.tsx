import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AirVent,
  Wrench,
  Calendar,
  AlertCircle,
  Clock,
  TrendingUp,
  Receipt,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  getCustomers,
  getACUnits,
  getServices,
  getAppointments,
  getInvoices,
} from '../firebase/db';
import { Customer, ACUnit, ServiceRecord, Appointment, Invoice } from '../types';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getPaymentBadgeClass,
  getServiceStatusBadgeClass,
  isOverdue,
} from '../utils/formatters';
import { ServiceModal } from '../components/modals/ServiceModal';
import { CustomerModal } from '../components/modals/CustomerModal';
import { AppointmentModal } from '../components/modals/AppointmentModal';
import { InvoicePreviewModal } from '../components/modals/InvoicePreviewModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modals state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, u, s, a, inv] = await Promise.all([
        getCustomers(),
        getACUnits(),
        getServices(),
        getAppointments(),
        getInvoices(),
      ]);
      setCustomers(c);
      setAcUnits(u);
      setServices(s);
      setAppointments(a);
      setInvoices(inv);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Appointment metrics
  const todayAppointments = appointments.filter(
    (a) => a.appointmentDate === todayStr && a.status !== 'Cancelled'
  );
  const upcomingAppointments = appointments.filter(
    (a) => a.appointmentDate > todayStr && a.status !== 'Completed' && a.status !== 'Cancelled'
  );
  const overdueAppointments = appointments.filter((a) =>
    isOverdue(a.appointmentDate, a.status)
  );

  // Revenue metrics
  const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
  const pendingPayments = invoices.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);
  const totalBilled = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  // Recent services (last 5)
  const recentServices = services.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AC Service Operations Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mechanic Command Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Track customer visits, AC unit history, pending gas refills, spare parts and collect bills.
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setServiceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-900/40 transition active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>Record Service</span>
            </button>
            <button
              onClick={() => setCustomerModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold transition active:scale-95"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Add Customer</span>
            </button>
            <button
              onClick={() => setAppointmentModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold transition active:scale-95"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Schedule Visit</span>
            </button>
            <button
              onClick={() => navigate('/invoices')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold transition active:scale-95"
            >
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span>Generate Bill</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop blur circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Row 1: Core Operations */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => navigate('/customers')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customers
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '-' : customers.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Registered households</p>
          </div>
        </div>

        {/* Total AC Units */}
        <div
          onClick={() => navigate('/ac-units')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AC Units
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition">
              <AirVent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '-' : acUnits.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Split, Inverter & Window</p>
          </div>
        </div>

        {/* Completed Services */}
        <div
          onClick={() => navigate('/services')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Services Done
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '-' : services.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cleanings, gas & repairs</p>
          </div>
        </div>

        {/* Overdue Services Alert */}
        <div
          onClick={() => navigate('/appointments')}
          className={`p-5 rounded-2xl border transition cursor-pointer group ${
            overdueAppointments.length > 0
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              {overdueAppointments.length > 0 && <AlertCircle className="w-3.5 h-3.5" />}
              Overdue
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                overdueAppointments.length > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold">
              {loading ? '-' : overdueAppointments.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires follow-up call</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2: Financials & Appointments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected Revenue */}
        <div
          onClick={() => navigate('/payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue Collected
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total billed: {formatCurrency(totalBilled)}
          </div>
        </div>

        {/* Pending Payments Due */}
        <div
          onClick={() => navigate('/payments')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Balances
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-600 mt-2">
            {formatCurrency(pendingPayments)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting customer collection</div>
        </div>

        {/* Today's Appointments */}
        <div
          onClick={() => navigate('/appointments')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Schedule
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {todayAppointments.length} <span className="text-xs font-normal text-slate-400">visits</span>
          </div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">
            {todayAppointments.length > 0 ? 'Home visits for today' : 'No visits scheduled for today'}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div
          onClick={() => navigate('/appointments')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Bookings
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {upcomingAppointments.length} <span className="text-xs font-normal text-slate-400">visits</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled in coming days</div>
        </div>
      </div>

      {/* Main Grid: Today's Appointments & Recent Service History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Service Visits Agenda (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>Today's Home Visits</span>
              </h2>
              <p className="text-xs text-slate-400">Scheduled visits for {formatDate(todayStr)}</p>
            </div>
            <button
              onClick={() => setAppointmentModalOpen(true)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              + Book Visit
            </button>
          </div>

          <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-96">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No home visits scheduled for today.
                <button
                  onClick={() => setAppointmentModalOpen(true)}
                  className="block mx-auto mt-2 text-sky-600 font-semibold hover:underline"
                >
                  Schedule a home visit
                </button>
              </div>
            ) : (
              todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-xl transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{appt.customerName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{appt.customerPhone}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800">
                      {formatTime(appt.appointmentTime)}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{appt.address}</span>
                  </div>

                  {appt.acDetails && (
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <AirVent className="w-3 h-3 text-slate-400" />
                      <span>{appt.acDetails}</span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-600">{appt.serviceType}</span>
                    <button
                      onClick={() => {
                        navigate('/services');
                        setServiceModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-800"
                    >
                      Record Job →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Service Records Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-600" />
                <span>Recent Service History</span>
              </h2>
              <p className="text-xs text-slate-400">Latest maintenance jobs, gas charging & repairs</p>
            </div>
            <button
              onClick={() => navigate('/services')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 mt-4 overflow-x-auto">
            {recentServices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No services recorded yet.
                <button
                  onClick={() => setServiceModalOpen(true)}
                  className="block mx-auto mt-2 text-sky-600 font-semibold hover:underline"
                >
                  Record your first service
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="pb-2">Date / Code</th>
                    <th className="pb-2">Customer & AC</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentServices.map((srv) => {
                    const matchedInvoice = invoices.find((inv) => inv.serviceId === srv.id);
                    return (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{formatDate(srv.serviceDate)}</div>
                          <div className="font-mono text-[10px] text-slate-400">{srv.serviceCode}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-800">{srv.customerName}</div>
                          <div className="text-[11px] text-slate-400">
                            {srv.acBrand} {srv.acType}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                            {srv.serviceType}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-bold font-mono text-slate-900">
                            {formatCurrency(srv.totalAmount)}
                          </div>
                          {srv.remainingBalance > 0 && (
                            <div className="text-[10px] text-rose-500 font-medium">
                              Due: {formatCurrency(srv.remainingBalance)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPaymentBadgeClass(
                              srv.paymentStatus
                            )}`}
                          >
                            {srv.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {matchedInvoice ? (
                            <button
                              onClick={() => setPreviewInvoice(matchedInvoice)}
                              className="px-2 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded text-[11px] font-semibold transition"
                            >
                              View PDF
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
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

      {customerModalOpen && (
        <CustomerModal
          isOpen={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          onSuccess={() => {
            loadData();
            setCustomerModalOpen(false);
          }}
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
