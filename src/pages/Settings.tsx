import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { getBusinessSettings, saveBusinessSettings } from '../firebase/db';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<BusinessSettings>({
    businessName: '',
    ownerName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    logoUrl: '',
    invoicePrefix: 'CC-',
    defaultCurrency: 'INR',
    serviceReminderDays: 90,
    invoiceNotes: '',
    warrantyTerms: '',
    upiId: '',
  });

  useEffect(() => {
    getBusinessSettings()
      .then((data) => {
        setFormData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (field: keyof BusinessSettings, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.phone.trim()) {
      error('Required fields', 'Business Name and Phone number are required.');
      return;
    }

    setSaving(true);
    try {
      await saveBusinessSettings(formData);
      success('Settings Saved', 'Business branding and invoice presets updated.');
    } catch (err: unknown) {
      error('Failed to save settings', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-sky-600" />
          <span>Business & Invoice Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure mechanic contact details, shop address, UPI ID and PDF bill warranty terms
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Shop & Contact Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">Mechanic / Business Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Business / Shop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="e.g. CoolMaster AC Care & Services"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lead Technician / Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleChange('ownerName', e.target.value)}
                placeholder="e.g. Sunil Kumar (HVAC Specialist)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Primary Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alternate Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={formData.alternatePhone || ''}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                  placeholder="Optional alternate"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="service@coolmaster.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Shop / Workshop Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Shop No., Market Complex, Sector, City, State, PIN"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Billing & Invoicing Presets */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-900">Invoice & Billing Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                placeholder="e.g. CC- or INV-"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Currency
              </label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Next Service Reminder (Days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={formData.serviceReminderDays}
                onChange={(e) => handleChange('serviceReminderDays', Number(e.target.value) || 90)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              UPI ID for Instant QR / Mobile Payments
            </label>
            <div className="relative">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="e.g. 9876543210@paytm or coolmaster@okaxis"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Printed on every invoice so customers can scan and pay their balance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Invoice Thank You Message & Note
            </label>
            <textarea
              rows={2}
              value={formData.invoiceNotes}
              onChange={(e) => handleChange('invoiceNotes', e.target.value)}
              placeholder="e.g. Thank you for choosing us! For emergency cooling assistance, please call us."
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Warranty Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={formData.warrantyTerms}
              onChange={(e) => handleChange('warrantyTerms', e.target.value)}
              placeholder="e.g. 30 Days service warranty on general labour. 90 Days replacement warranty on new capacitors."
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Business Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
