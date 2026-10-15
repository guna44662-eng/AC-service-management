import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Plus,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Customer,
  ACUnit,
  ServiceType,
  PaymentMethod,
  ServiceStatus,
  ReplacedPartLine,
  ServiceRecord,
} from '../../types';
import {
  getCustomers,
  getACUnitsByCustomer,
  createServiceRecord,
  getBusinessSettings,
} from '../../firebase/db';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (service: ServiceRecord) => void;
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

const COMMON_SPARE_PARTS = [
  { name: 'Run Capacitor 35uF (1 Ton)', price: 380 },
  { name: 'Dual Run Capacitor 45uF (1.5 Ton)', price: 480 },
  { name: 'Dual Run Capacitor 50uF (2 Ton)', price: 550 },
  { name: 'R32 Refrigerant Gas Refill (Per Unit)', price: 1800 },
  { name: 'R410A Refrigerant Gas Refill (Per Unit)', price: 2000 },
  { name: 'R22 Refrigerant Gas Refill', price: 2200 },
  { name: 'Copper Flare Nut & Washer', price: 120 },
  { name: 'Blower Fan Motor Bush & Bearing', price: 350 },
  { name: 'Indoor Temperature Sensor / Thermistor', price: 450 },
  { name: 'AC Drainage Pipe (3 Meters)', price: 150 },
  { name: 'Universal AC Remote Control', price: 300 },
  { name: 'Compressor Contactor Relay', price: 650 },
];

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCustomerId,
  defaultACUnitId,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);

  // Selected entities
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId || '');
  const [selectedACUnitId, setSelectedACUnitId] = useState(defaultACUnitId || '');

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [serviceDate, setServiceDate] = useState(todayStr);
  const [serviceTime, setServiceTime] = useState('11:00');
  const [serviceType, setServiceType] = useState<ServiceType>('General Service');
  const [complaint, setComplaint] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [cleaningDetails, setCleaningDetails] = useState('');
  const [gasLevelDetails, setGasLevelDetails] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Replaced parts table
  const [replacedParts, setReplacedParts] = useState<ReplacedPartLine[]>([]);

  // Financials
  const [labourCharge, setLabourCharge] = useState<number>(600);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(600);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [status, setStatus] = useState<ServiceStatus>('Completed');

  // Next service due calculation (+3 months default)
  const defaultNextDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  };
  const [nextRecommendedDate, setNextRecommendedDate] = useState(defaultNextDate());
  const [generateInvoice, setGenerateInvoice] = useState(true);

  // Load customers
  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, [isOpen]);

  // Load AC units when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      getACUnitsByCustomer(selectedCustomerId)
        .then((units) => {
          setAcUnits(units);
          if (units.length > 0 && (!selectedACUnitId || !units.find((u) => u.id === selectedACUnitId))) {
            setSelectedACUnitId(units[0].id);
          }
        })
        .catch(console.error);
    } else {
      setAcUnits([]);
      setSelectedACUnitId('');
    }
  }, [selectedCustomerId]);

  // Financial calculations
  const partsCost = replacedParts.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
  const subtotal = (Number(labourCharge) || 0) + partsCost + (Number(additionalCharges) || 0);
  const totalAmount = Math.max(0, subtotal - (Number(discount) || 0));
  const remainingBalance = Math.max(0, totalAmount - (Number(amountPaid) || 0));

  // Sync paid amount when total changes if was fully paid
  const handleSetFullyPaid = () => {
    setAmountPaid(totalAmount);
  };

  const handleAddPart = () => {
    setReplacedParts([
      ...replacedParts,
      {
        name: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        reason: '',
      },
    ]);
  };

  const handleQuickAddCommonPart = (item: { name: string; price: number }) => {
    setReplacedParts([
      ...replacedParts,
      {
        name: item.name,
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
        reason: 'Replaced during service',
      },
    ]);
  };

  const handleUpdatePart = (index: number, field: keyof ReplacedPartLine, value: unknown) => {
    const updated = [...replacedParts];
    const current = { ...updated[index] };

    if (field === 'quantity') {
      current.quantity = Math.max(0, Number(value) || 0);
      current.totalPrice = current.quantity * current.unitPrice;
    } else if (field === 'unitPrice') {
      current.unitPrice = Math.max(0, Number(value) || 0);
      current.totalPrice = current.quantity * current.unitPrice;
    } else if (field === 'name') {
      current.name = String(value || '');
    } else if (field === 'reason') {
      current.reason = String(value || '');
    }

    updated[index] = current;
    setReplacedParts(updated);
  };

  const handleRemovePart = (index: number) => {
    setReplacedParts(replacedParts.filter((_, i) => i !== index));
  };

  const setNextPreset = (months: number) => {
    const d = new Date(serviceDate || todayStr);
    d.setMonth(d.getMonth() + months);
    setNextRecommendedDate(d.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const acUnit = acUnits.find((u) => u.id === selectedACUnitId);

    if (!customer) {
      error('Customer Required', 'Please choose a customer.');
      return;
    }
    if (!acUnit) {
      error('AC Unit Required', 'Please select an AC unit for this customer.');
      return;
    }
    if (!workPerformed.trim()) {
      error('Work Details Required', 'Please specify what work or service was performed.');
      return;
    }

    setLoading(true);
    try {
      const settings = await getBusinessSettings();

      const result = await createServiceRecord(
        {
          customerId: customer.id,
          customerName: customer.fullName,
          customerMobile: customer.mobileNumber,
          customerAddress: customer.address,
          customerArea: customer.area,
          acUnitId: acUnit.id,
          acBrand: acUnit.brand,
          acModel: acUnit.modelNumber,
          acType: acUnit.acType,
          acCapacity: acUnit.capacity,
          acLocation: acUnit.locationInHome,
          serviceDate,
          serviceTime,
          serviceType,
          complaint: complaint.trim() || undefined,
          workPerformed: workPerformed.trim(),
          cleaningDetails: cleaningDetails.trim() || undefined,
          gasLevelDetails: gasLevelDetails.trim() || undefined,
          technicianNotes: technicianNotes.trim() || undefined,
          replacedParts,
          labourCharge: Number(labourCharge) || 0,
          partsCost,
          additionalCharges: Number(additionalCharges) || 0,
          discount: Number(discount) || 0,
          totalAmount,
          amountPaid: Number(amountPaid) || 0,
          paymentMethod,
          nextRecommendedDate: nextRecommendedDate || undefined,
          status,
        },
        generateInvoice,
        settings
      );

      if (remainingBalance === 0 && totalAmount > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }

      success(
        'Service Recorded!',
        `Service #${result.service.serviceCode} registered. ${
          result.invoice ? `Invoice #${result.invoice.invoiceNumber} generated.` : ''
        }`
      );
      onSuccess(result.service);
      onClose();
    } catch (err: unknown) {
      error('Failed to record service', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Record AC Home Service Visit</h3>
              <p className="text-xs text-slate-300">
                Job diagnosis, replaced parts, labour, bill & maintenance dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Step 1: Customer & AC Selection */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Customer & Equipment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} - {c.mobileNumber} ({c.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select AC Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedACUnitId}
                  onChange={(e) => setSelectedACUnitId(e.target.value)}
                  disabled={!selectedCustomerId || acUnits.length === 0}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {acUnits.length === 0 ? (
                    <option value="">No AC units registered for this customer</option>
                  ) : (
                    acUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.brand} {u.acType} ({u.capacity}) {u.locationInHome ? `- ${u.locationInHome}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Service Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Time</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="time"
                  value={serviceTime}
                  onChange={(e) => setServiceTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Type <span className="text-rose-500">*</span>
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
          </div>

          {/* Step 3: Job Description & Findings */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Complaint / Initial Issue
              </label>
              <input
                type="text"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="e.g. AC blowing warm air, outdoor unit tripping circuit, water leakage..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Done / Diagnostics Performed <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
                placeholder="Describe what was repaired, cleaned, serviced, or installed..."
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cleaning Details
                </label>
                <input
                  type="text"
                  value={cleaningDetails}
                  onChange={(e) => setCleaningDetails(e.target.value)}
                  placeholder="e.g. Chemical foam wash, jet pressure wash on condenser"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gas Level / Pressure Details
                </label>
                <input
                  type="text"
                  value={gasLevelDetails}
                  onChange={(e) => setGasLevelDetails(e.target.value)}
                  placeholder="e.g. R32 refilled to 125 PSI suction, leak fixed"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Replaced Parts & Materials */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Replaced Spare Parts & Materials
                </h4>
                <p className="text-[11px] text-slate-500">
                  Capacitors, pipes, copper fittings, remote, filters
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPart}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Part Row
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Quick Pick:</span>
              {COMMON_SPARE_PARTS.slice(0, 4).map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleQuickAddCommonPart(item)}
                  className="text-[11px] px-2 py-0.5 bg-white border border-slate-300 hover:border-sky-500 hover:text-sky-700 rounded-md text-slate-600 transition"
                >
                  + {item.name} ({formatCurrency(item.price)})
                </button>
              ))}
            </div>

            {/* Parts Table */}
            {replacedParts.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg bg-white">
                No parts replaced. Service is purely labour/cleaning.
              </div>
            ) : (
              <div className="space-y-2">
                {replacedParts.map((part, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 border border-slate-200 rounded-lg"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Part Name / Specification"
                        value={part.name}
                        onChange={(e) => handleUpdatePart(index, 'name', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:bg-white"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) => handleUpdatePart(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:bg-white text-center"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price"
                        value={part.unitPrice}
                        onChange={(e) => handleUpdatePart(index, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:bg-white text-right"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right font-mono font-semibold text-xs text-slate-700">
                      {formatCurrency(part.totalPrice)}
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePart(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 5: Financial Breakdown & Billing */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Service Charges & Payment
              </h4>
              <button
                type="button"
                onClick={handleSetFullyPaid}
                className="text-[11px] px-2 py-0.5 bg-cyan-900/60 text-cyan-300 border border-cyan-700 rounded hover:bg-cyan-800 transition"
              >
                Mark Full Paid
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Labour Charge</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={labourCharge}
                    onChange={(e) => setLabourCharge(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Parts Cost (Auto)</label>
                <div className="py-1.5 px-3 bg-slate-800/80 border border-slate-700 rounded font-mono font-bold text-cyan-300">
                  {formatCurrency(partsCost)}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Gas / Addl Charges</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Discount Offered</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white"
                  />
                </div>
              </div>
            </div>

            {/* Totals & Balance Banner */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/90 p-3 rounded-lg border border-slate-700">
                <div className="text-[11px] text-slate-400">Total Net Amount</div>
                <div className="text-xl font-bold font-mono text-cyan-300">
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <div className="bg-slate-800/90 p-3 rounded-lg border border-slate-700">
                <label className="block text-[11px] text-slate-400 mb-1">Amount Paid Today</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1 bg-slate-900 border border-slate-600 rounded text-emerald-400 font-mono font-bold text-sm"
                  />
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  remainingBalance > 0
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                }`}
              >
                <div className="text-[11px]">Outstanding Balance</div>
                <div className="text-xl font-bold font-mono">
                  {formatCurrency(remainingBalance)}
                </div>
                <div className="text-[10px] mt-0.5">
                  {remainingBalance > 0 ? 'Pending Collection' : 'Fully Paid'}
                </div>
              </div>
            </div>

            {/* Payment Mode & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 text-xs mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Other">Net Banking / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">Service Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-white"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 6: Next Recommended Service Reminder */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Next Recommended Service Date
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setNextPreset(3)}
                  className="text-[10px] px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                >
                  +3 Months (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setNextPreset(6)}
                  className="text-[10px] px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700"
                >
                  +6 Months
                </button>
              </div>
            </div>
            <input
              type="date"
              value={nextRecommendedDate}
              onChange={(e) => setNextRecommendedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Step 7: Technician internal notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Technician Notes
            </label>
            <input
              type="text"
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="e.g. Advised customer not to keep temperature below 24°C; condenser grill cleaned"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          {/* Generate Invoice Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="generateInvoice"
              checked={generateInvoice}
              onChange={(e) => setGenerateInvoice(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300"
            />
            <label htmlFor="generateInvoice" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Automatically generate official invoice & bill record for this service
            </label>
          </div>

          {/* Submit Actions */}
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
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{loading ? 'Recording Service...' : 'Save & Record Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
