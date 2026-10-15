import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  AlertCircle,
  CheckCircle2,
  List,
  Edit2,
  Trash2,
  Wrench,
  AirVent,
  ChevronRight,
} from 'lucide-react';
import { Appointment, ServiceRecord, Customer } from '../types';
import {
  getAppointments,
  getServices,
  getCustomers,
  deleteAppointment,
  updateAppointment,
} from '../firebase/db';
import {
  formatDate,
  formatTime,
  isOverdue,
  isDueSoon,
  getServiceStatusBadgeClass,
} from '../utils/formatters';
import { AppointmentModal } from '../components/modals/AppointmentModal';
import { ServiceModal } from '../components/modals/ServiceModal';
import { useToast } from '../context/ToastContext';

export const Appointments: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');

  // Modals
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // Conversion to service
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedApptForService, setSelectedApptForService] = useState<Appointment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, srvs, custs] = await Promise.all([
        getAppointments(),
        getServices(),
        getCustomers(),
      ]);
      setAppointments(appts);
      setServices(srvs);
      setCustomers(custs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (appt: Appointment) => {
    if (!window.confirm(`Cancel/Delete appointment for ${appt.customerName}?`)) return;
    try {
      await deleteAppointment(appt.id);
      success('Appointment Deleted', 'Visit removed from schedule.');
      loadData();
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleUpdateStatus = async (appt: Appointment, newStatus: Appointment['status']) => {
    try {
      await updateAppointment(appt.id, { status: newStatus });
      success('Status Updated', `Visit set to ${newStatus}.`);
      loadData();
    } catch (err: unknown) {
      error('Update failed', err instanceof Error ? err.message : String(err));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const todayAppts = appointments.filter((a) => a.appointmentDate === todayStr);
  const upcomingAppts = appointments.filter(
    (a) => a.appointmentDate > todayStr && a.status !== 'Completed' && a.status !== 'Cancelled'
  );
  const overdueAppts = appointments.filter((a) => isOverdue(a.appointmentDate, a.status));
  const completedAppts = appointments.filter((a) => a.status === 'Completed');

  const getFilteredList = () => {
    switch (filterTab) {
      case 'today':
        return todayAppts;
      case 'upcoming':
        return upcomingAppts;
      case 'overdue':
        return overdueAppts;
      case 'completed':
        return completedAppts;
      case 'all':
      default:
        return appointments;
    }
  };

  const currentList = getFilteredList();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-600" />
            <span>Home Visit Appointments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer visit schedules, overdue alerts, and periodic maintenance reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingAppt(null);
              setApptModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setFilterTab('all')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            filterTab === 'all'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setFilterTab('today')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            filterTab === 'today'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Today's Visits ({todayAppts.length})
        </button>

        <button
          onClick={() => setFilterTab('upcoming')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            filterTab === 'upcoming'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upcoming Bookings ({upcomingAppts.length})
        </button>

        <button
          onClick={() => setFilterTab('overdue')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            filterTab === 'overdue'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {overdueAppts.length > 0 && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
          <span>Overdue Follow-ups ({overdueAppts.length})</span>
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
            filterTab === 'completed'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Completed ({completedAppts.length})
        </button>
      </div>

      {/* Main View */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading schedule...</div>
          ) : currentList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p>No appointments in this view.</p>
              <button
                onClick={() => {
                  setEditingAppt(null);
                  setApptModalOpen(true);
                }}
                className="px-4 py-2 bg-sky-50 text-sky-600 font-semibold rounded-lg hover:bg-sky-100 transition"
              >
                Schedule an Appointment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {currentList.map((appt) => {
                const overdue = isOverdue(appt.appointmentDate, appt.status);
                const dueSoon = isDueSoon(appt.appointmentDate, appt.status);
                const isToday = appt.appointmentDate === todayStr;

                return (
                  <div
                    key={appt.id}
                    className="p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Block */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono shrink-0 border ${
                          overdue
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : isToday
                            ? 'bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-400/20'
                            : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {new Date(appt.appointmentDate).toLocaleString('en-IN', {
                            month: 'short',
                          })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {new Date(appt.appointmentDate).getDate()}
                        </span>
                      </div>

                      {/* Customer & Details */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {appt.customerName}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getServiceStatusBadgeClass(
                              appt.status
                            )}`}
                          >
                            {appt.status}
                          </span>
                          {overdue && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </span>
                          )}
                          {isToday && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatTime(appt.appointmentTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{appt.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{appt.area || appt.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5">
                          <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {appt.serviceType}
                          </span>
                          {appt.acDetails && (
                            <span className="text-slate-500">• {appt.acDetails}</span>
                          )}
                        </div>

                        {appt.notes && (
                          <div className="text-[11px] text-slate-500 mt-1.5 bg-slate-50 p-2 rounded-lg">
                            Note: {appt.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:self-center shrink-0">
                      {appt.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            setSelectedApptForService(appt);
                            setServiceModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition shadow-xs active:scale-95"
                          title="Complete service and generate invoice"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Record Job</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingAppt(appt);
                          setApptModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                        title="Reschedule / Edit Visit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(appt)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                        title="Delete Visit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Appointment Agenda by Date</h3>
            <span className="text-xs text-slate-400">Total Visits: {appointments.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Group appointments by date */}
            {Array.from(new Set(appointments.map((a) => a.appointmentDate)))
              .sort()
              .map((dateStr) => {
                const dayAppts = appointments.filter((a) => a.appointmentDate === dateStr);
                const isPast = dateStr < todayStr;
                const isCurrent = dateStr === todayStr;

                return (
                  <div
                    key={dateStr}
                    className={`p-4 rounded-xl border ${
                      isCurrent
                        ? 'bg-sky-50/50 border-sky-300 ring-2 ring-sky-400/20'
                        : isPast
                        ? 'bg-slate-50/70 border-slate-200'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>{formatDate(dateStr)}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-900">
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {dayAppts.map((a) => (
                        <div
                          key={a.id}
                          className="p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-xs text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{a.customerName}</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {formatTime(a.appointmentTime)}
                            </span>
                          </div>
                          <div className="text-[11px] text-sky-700 font-medium">{a.serviceType}</div>
                          <div className="text-[10px] text-slate-500 truncate">{a.address}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modals */}
      {apptModalOpen && (
        <AppointmentModal
          isOpen={apptModalOpen}
          onClose={() => setApptModalOpen(false)}
          onSuccess={() => {
            loadData();
            setApptModalOpen(false);
          }}
          appointmentToEdit={editingAppt}
        />
      )}

      {serviceModalOpen && selectedApptForService && (
        <ServiceModal
          isOpen={serviceModalOpen}
          onClose={() => {
            setServiceModalOpen(false);
            setSelectedApptForService(null);
          }}
          onSuccess={() => {
            // Also mark appointment as completed
            if (selectedApptForService) {
              updateAppointment(selectedApptForService.id, { status: 'Completed' }).catch(console.error);
            }
            loadData();
            setServiceModalOpen(false);
            setSelectedApptForService(null);
          }}
          defaultCustomerId={selectedApptForService.customerId}
          defaultACUnitId={selectedApptForService.acUnitId}
        />
      )}
    </div>
  );
};
