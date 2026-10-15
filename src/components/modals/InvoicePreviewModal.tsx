import React, { useEffect, useState } from 'react';
import { X, Download, Printer, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import { Invoice, BusinessSettings } from '../../types';
import { getBusinessSettings } from '../../firebase/db';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { formatCurrency, formatDate, getPaymentBadgeClass } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { success } = useToast();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    getBusinessSettings().then(setSettings).catch(console.error);
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handleDownload = () => {
    if (!settings) return;
    generateInvoicePDF(invoice, settings, true);
    success('PDF Downloaded', `Invoice #${invoice.invoiceNumber} saved.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm">Invoice #{invoice.invoiceNumber}</h3>
              <p className="text-[11px] text-slate-300">Official AC Home Service Bill</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50 print:p-0 print:bg-white">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs print:shadow-none print:border-none">
            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  {settings?.businessName || 'CoolCare AC Solutions'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specialist in Home AC Installation, Servicing & Gas Charging
                </p>
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>Phone: {settings?.phone || '+91 98765 43210'}</p>
                  <p>Address: {settings?.address}</p>
                  {settings?.email && <p>Email: {settings.email}</p>}
                </div>
              </div>

              <div className="sm:text-right">
                <span
                  className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getPaymentBadgeClass(
                    invoice.paymentStatus
                  )}`}
                >
                  {invoice.paymentStatus.toUpperCase()}
                </span>
                <div className="text-xs text-slate-600 mt-2 space-y-0.5 font-mono">
                  <p className="font-bold text-sm text-slate-900">INV: {invoice.invoiceNumber}</p>
                  <p>Date: {formatDate(invoice.invoiceDate)}</p>
                  <p>Payment: {invoice.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Bill To & AC Unit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
                  Customer / Service Address
                </div>
                <div className="font-bold text-sm text-slate-900">{invoice.customerName}</div>
                <div className="text-slate-600 mt-0.5">Phone: {invoice.customerMobile}</div>
                <div className="text-slate-600 mt-1 whitespace-pre-wrap">{invoice.customerAddress}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
                  AC Details & Next Due
                </div>
                <div className="font-semibold text-slate-900">{invoice.acUnitDetails}</div>
                <div className="text-slate-600 mt-0.5">Service: {invoice.serviceType}</div>
                <div className="text-sky-700 font-semibold mt-1">
                  Next Service Due: {invoice.nextServiceDate ? formatDate(invoice.nextServiceDate) : 'Not scheduled'}
                </div>
              </div>
            </div>

            {/* Work Summary if present */}
            {invoice.workSummary && (
              <div className="py-4 border-b border-slate-200 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Work Description & Diagnostics
                </div>
                <div className="text-slate-600 leading-relaxed">{invoice.workSummary}</div>
              </div>
            )}

            {/* Items Table */}
            <div className="py-6 border-b border-slate-200 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 uppercase font-semibold text-[10px]">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center w-16">Qty</th>
                    <th className="py-2 text-right w-24">Unit Rate</th>
                    <th className="py-2 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Labour row */}
                  <tr>
                    <td className="py-2.5 font-medium text-slate-900">
                      Labour / Service Visit ({invoice.serviceType})
                    </td>
                    <td className="py-2.5 text-center text-slate-600">1</td>
                    <td className="py-2.5 text-right font-mono text-slate-600">
                      {formatCurrency(invoice.labourCharge)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(invoice.labourCharge)}
                    </td>
                  </tr>

                  {/* Replaced Parts */}
                  {invoice.partsUsed &&
                    invoice.partsUsed.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 text-slate-800">
                          <div>{p.name}</div>
                          {p.reason && (
                            <div className="text-[10px] text-slate-400 italic">{p.reason}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-slate-600">{p.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {formatCurrency(p.unitPrice)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(p.totalPrice)}
                        </td>
                      </tr>
                    ))}

                  {/* Additional charges */}
                  {invoice.additionalCharges > 0 && (
                    <tr>
                      <td className="py-2.5 text-slate-800">
                        Additional Charges (Gas / Transport / Specialized consumables)
                      </td>
                      <td className="py-2.5 text-center text-slate-600">1</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        {formatCurrency(invoice.additionalCharges)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(invoice.additionalCharges)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              <div className="text-xs space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-[10px] uppercase text-slate-600 mb-1">
                    UPI Payment
                  </div>
                  <div className="font-mono text-slate-800 font-semibold">
                    UPI ID: {settings?.upiId || 'coolcare@upi'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Scan via Google Pay, PhonePe or Paytm to settle balance.
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Terms: </span>
                  {invoice.warrantyTerms || settings?.warrantyTerms}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Labour Charge:</span>
                  <span className="font-mono">{formatCurrency(invoice.labourCharge)}</span>
                </div>
                {invoice.partsCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Parts & Spares:</span>
                    <span className="font-mono">{formatCurrency(invoice.partsCost)}</span>
                  </div>
                )}
                {invoice.additionalCharges > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Additional Charges:</span>
                    <span className="font-mono">{formatCurrency(invoice.additionalCharges)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount:</span>
                  <span className="font-mono text-sky-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-rose-600 pt-1 border-t border-slate-100">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-12 flex justify-between items-end text-xs text-slate-500">
              <div className="border-t border-slate-300 pt-1.5 w-44 text-center">
                Customer Signature
              </div>
              <div className="border-t border-slate-300 pt-1.5 w-48 text-center font-semibold text-slate-700">
                Technician / Authorized Stamp
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
