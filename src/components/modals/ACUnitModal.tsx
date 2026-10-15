import React, { useState, useEffect } from 'react';
import { X, AirVent, Hash, Calendar, MapPin, Tag } from 'lucide-react';
import { ACUnit, ACType, ACCapacity, Customer } from '../../types';
import { addACUnit, updateACUnit, getCustomers } from '../../firebase/db';
import { useToast } from '../../context/ToastContext';

interface ACUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (unit: ACUnit) => void;
  unitToEdit?: ACUnit | null;
  defaultCustomerId?: string;
}

const COMMON_BRANDS = [
  'Daikin',
  'Voltas',
  'LG',
  'Hitachi',
  'Blue Star',
  'Panasonic',
  'Samsung',
  'Lloyd',
  'Mitsubishi Heavy',
  'Carrier',
  'O General',
  'Godrej',
  'Whirlpool',
  'Haier',
  'Other',
];

export const ACUnitModal: React.FC<ACUnitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  unitToEdit,
  defaultCustomerId,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [brand, setBrand] = useState('Daikin');
  const [customBrand, setCustomBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [acType, setAcType] = useState<ACType>('Inverter Split');
  const [capacity, setCapacity] = useState<ACCapacity>('1.5 ton');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [locationInHome, setLocationInHome] = useState('Master Bedroom');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (unitToEdit) {
      setCustomerId(unitToEdit.customerId || defaultCustomerId || '');
      if (COMMON_BRANDS.includes(unitToEdit.brand)) {
        setBrand(unitToEdit.brand);
        setCustomBrand('');
      } else {
        setBrand('Other');
        setCustomBrand(unitToEdit.brand || '');
      }
      setModelNumber(unitToEdit.modelNumber || '');
      setAcType(unitToEdit.acType || 'Inverter Split');
      setCapacity(unitToEdit.capacity || '1.5 ton');
      setSerialNumber(unitToEdit.serialNumber || '');
      setInstallationDate(unitToEdit.installationDate || '');
      setWarrantyExpiryDate(unitToEdit.warrantyExpiryDate || '');
      setLocationInHome(unitToEdit.locationInHome || 'Master Bedroom');
      setNotes(unitToEdit.notes || '');
    } else {
      setCustomerId(defaultCustomerId || '');
      setBrand('Daikin');
      setCustomBrand('');
      setModelNumber('');
      setAcType('Inverter Split');
      setCapacity('1.5 ton');
      setSerialNumber('');
      setInstallationDate('');
      setWarrantyExpiryDate('');
      setLocationInHome('Master Bedroom');
      setNotes('');
    }
  }, [unitToEdit, defaultCustomerId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      error('Customer Required', 'Please select which customer owns this AC unit.');
      return;
    }

    const finalBrand = brand === 'Other' ? customBrand.trim() || 'Custom' : brand;
    if (!finalBrand) {
      error('Brand Required', 'Please specify the AC brand.');
      return;
    }

    setLoading(true);
    try {
      if (unitToEdit) {
        await updateACUnit(unitToEdit.id, {
          customerId,
          brand: finalBrand,
          modelNumber: modelNumber.trim() || undefined,
          acType,
          capacity,
          serialNumber: serialNumber.trim() || undefined,
          installationDate: installationDate || undefined,
          warrantyExpiryDate: warrantyExpiryDate || undefined,
          locationInHome: locationInHome.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        success('AC Unit Updated', `${finalBrand} ${acType} updated.`);
        onSuccess({
          ...unitToEdit,
          customerId,
          brand: finalBrand,
          modelNumber: modelNumber.trim() || undefined,
          acType,
          capacity,
          serialNumber: serialNumber.trim() || undefined,
          installationDate: installationDate || undefined,
          warrantyExpiryDate: warrantyExpiryDate || undefined,
          locationInHome: locationInHome.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        const newUnit = await addACUnit({
          customerId,
          brand: finalBrand,
          modelNumber: modelNumber.trim() || undefined,
          acType,
          capacity,
          serialNumber: serialNumber.trim() || undefined,
          installationDate: installationDate || undefined,
          warrantyExpiryDate: warrantyExpiryDate || undefined,
          locationInHome: locationInHome.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        success('AC Unit Registered', `${finalBrand} ${capacity} added to customer profile.`);
        onSuccess(newUnit);
      }
      onClose();
    } catch (err: unknown) {
      error('Failed to save AC unit', err instanceof Error ? err.message : String(err));
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
              <AirVent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {unitToEdit ? 'Edit AC Unit' : 'Register New AC Unit'}
              </h3>
              <p className="text-xs text-slate-300">Specifications, capacity & warranty info</p>
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
              Customer / Owner <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={!!defaultCustomerId && !unitToEdit}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.mobileNumber}) - {c.area}
                </option>
              ))}
            </select>
          </div>

          {/* Brand & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                AC Brand <span className="text-rose-500">*</span>
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                AC Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={acType}
                onChange={(e) => setAcType(e.target.value as ACType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="Split">Split AC</option>
                <option value="Inverter Split">Inverter Split AC</option>
                <option value="Window">Window AC</option>
                <option value="Other">Other / Cassette / Tower</option>
              </select>
            </div>
          </div>

          {brand === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Specify Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="Enter custom brand"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>
          )}

          {/* Capacity & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tonnage / Capacity <span className="text-rose-500">*</span>
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(e.target.value as ACCapacity)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="1 ton">1 Ton</option>
                <option value="1.5 ton">1.5 Ton (Most Common)</option>
                <option value="2 ton">2 Ton</option>
                <option value="Other">Other / Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Installation Location in Home
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={locationInHome}
                  onChange={(e) => setLocationInHome(e.target.value)}
                  placeholder="e.g. Master Bedroom, Hall"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Model & Serial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Model Number
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. FTKM50TV"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Serial Number
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. DK-883921"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Installation & Warranty Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Installation Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Warranty Expiry Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={warrantyExpiryDate}
                  onChange={(e) => setWarrantyExpiryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unit Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Copper piping length, outdoor unit access details..."
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
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
              {loading ? 'Saving...' : unitToEdit ? 'Save Changes' : 'Register AC Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
