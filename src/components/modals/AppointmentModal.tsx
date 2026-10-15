import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Phone, User, AirVent } from 'lucide-react';
import { Appointment, Customer, ACUnit, ServiceType, ServiceStatus } from '../../types';
import { addAppointment, updateAppointment, getCustomers, getACUnitsByCustomer } from '../../firebase/db';
import { useToast } from '../../context/ToastContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  appointmentToEdit?: Appointment | null;
  defaultCustomerId?: string;
  defaultACUnitId?: string;
}

const SERVICE_TYPES: ServiceType[] = [
  'General Service',
  'Deep Cleaning',
  'Gas Refilling',
  'Repair',
  'Installation',
  'Uninstallation',
  'Maintenance',
  'Other',
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  appointmentToEdit,
  defaultCustomerId,
  defaultACUnitId,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);

  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [acUnitId, setAcUnitId] = useState(defaultACUnitId || '');

  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [serviceType, setServiceType] = useState<ServiceType>('General Service');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ServiceStatus>('Scheduled');

  // Load customers
  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, [isOpen]);

  // Load AC units when customer changes
  useEffect(() => {
    if (customerId) {
      getACUnitsByCustomer(customerId)
        .then((units) => {
          setAcUnits(units);
          if (units.length > 0 && (!acUnitId || !units.find((u) => u.id === acUnitId))) {
            setAcUnitId(units[0].id);
          }
        })
        .catch(console.error);
    } else {
      setAcUnits([]);
      setAcUnitId('');
    }
  }, [customerId]);

  useEffect(() => {
    if (appointmentToEdit) {
      setCustomerId(appointmentToEdit.customerId || '');
      setAcUnitId(appointmentToEdit.acUnitId || '');
      setAppointmentDate(appointmentToEdit.appointmentDate || todayStr);
      setAppointmentTime(appointmentToEdit.appointmentTime || '10:00');
      setServiceType(appointmentToEdit.serviceType || 'General Service');
      setNotes(appointmentToEdit.notes || '');
      setStatus(appointmentToEdit.status || 'Scheduled');
    } else {
      setCustomerId(defaultCustomerId || '');
      setAcUnitId(defaultACUnitId || '');
      setAppointmentDate(todayStr);
      setAppointmentTime('10:00');
      setServiceType('General Service');
      setNotes('');
      setStatus('Scheduled');
    }
  }, [appointmentToEdit, defaultCustomerId, defaultACUnitId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      error('Customer Required', 'Please select a customer for the appointment.');
      return;
    }

    const ac = acUnits.find((u) => u.id === acUnitId);
    const acDetails = ac ? `${ac.brand} ${ac.acType} (${ac.capacity})` : undefined;

    setLoading(true);
    try {
      if (appointmentToEdit) {
        await updateAppointment(appointmentToEdit.id, {
          customerId: customer.id,
          customerName: customer.fullName,
          customerPhone: customer.mobileNumber,
          address: customer.address,
          area: customer.area,
          acUnitId: ac?.id,
          acDetails,
          appointmentDate,
          appointmentTime,
          serviceType,
          notes: notes.trim() || undefined,
          status,
        });
        success('Appointment Updated', `Visit for ${customer.fullName} rescheduled.`);
        onSuccess({
          ...appointmentToEdit,
          customerId: customer.id,
          customerName: customer.fullName,
          customerPhone: customer.mobileNumber,
          address: customer.address,
          area: customer.area,
          acUnitId: ac?.id,
          acDetails,
          appointmentDate,
          appointmentTime,
          serviceType,
          notes: notes.trim() || undefined,
          status,
        });
      } else {
        const newAppt = await addAppointment({
          customerId: customer.id,
          customerName: customer.fullName,
          customerPhone: customer.mobileNumber,
          address: customer.address,
          area: customer.area,
          acUnitId: ac?.id,
          acDetails,
          appointmentDate,
          appointmentTime,
          serviceType,
          notes: notes.trim() || undefined,
          status,
        });
        success('Appointment Scheduled', `Home visit set for ${customer.fullName}.`);
        onSuccess(newAppt);
      }
      onClose();
    } catch (err: unknown) {
      error('Operation failed', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {appointmentToEdit ? 'Reschedule / Edit Visit' : 'Schedule Home Service Visit'}
              </h3>
              <p className="text-xs text-slate-300">Set customer appointment date & time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} - {c.mobileNumber} ({c.area})
                </option>
              ))}
            </select>
          </div>

          {/* AC Unit Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select AC Unit (Optional)
            </label>
            <select
              value={acUnitId}
              onChange={(e) => setAcUnitId(e.target.value)}
              disabled={!customerId || acUnits.length === 0}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">-- Any / All AC Units --</option>
              {acUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.brand} {u.acType} ({u.capacity}) {u.locationInHome ? `- ${u.locationInHome}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visit Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visit Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="time"
                  required
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Service Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Requested Service <span className="text-rose-500">*</span>
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Visit Instructions / Issue
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Call before coming, check outdoor unit ladder access..."
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : appointmentToEdit ? 'Update Visit' : 'Schedule Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
