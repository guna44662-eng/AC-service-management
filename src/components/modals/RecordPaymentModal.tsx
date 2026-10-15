import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Invoice, PaymentMethod } from '../../types';
import { recordAdditionalPayment } from '../../firebase/db';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: Invoice;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState<number>(invoice.balanceDue || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const todayStr = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handlePayFull = () => {
    setAmount(invoice.balanceDue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payVal = Number(amount);
    if (isNaN(payVal) || payVal <= 0) {
      error('Invalid Amount', 'Please enter a valid payment amount greater than zero.');
      return;
    }
    if (payVal > invoice.balanceDue) {
      error('Overpayment', `Amount cannot exceed remaining balance of ${formatCurrency(invoice.balanceDue)}.`);
      return;
    }

    setLoading(true);
    try {
      await recordAdditionalPayment({
        invoiceId: invoice.id,
        amount: payVal,
        paymentMethod,
        paymentDate,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (payVal === invoice.balanceDue) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      }

      success('Payment Recorded', `Payment of ${formatCurrency(payVal)} registered for Invoice #${invoice.invoiceNumber}.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      error('Payment failed', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Record Payment</h3>
              <p className="text-xs text-slate-300">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Customer:</span>
              <span className="font-semibold text-slate-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Bill Total:</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Already Paid:</span>
              <span className="font-mono font-semibold text-emerald-600">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Remaining Balance:</span>
              <span className="text-base font-extrabold font-mono text-rose-600">
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
          </div>

          {/* Amount to Record */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Amount <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold underline"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">₹</span>
              <input
                type="number"
                required
                min="1"
                max={invoice.balanceDue}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 text-base font-bold font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Other">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          {/* Reference & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              UPI Ref / Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI Ref: 310928491823"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Receipt Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full after final testing"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Recording...' : 'Confirm Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
