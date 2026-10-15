import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function generateInvoicePDF(invoice: Invoice, settings: BusinessSettings, autoDownload = true): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Brand Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Business Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(settings.businessName || 'CoolCare AC Solutions', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Specialist in Home AC Installation, Servicing & Gas Charging`, margin, 21);
  doc.text(`Phone: ${settings.phone} | Email: ${settings.email || 'N/A'}`, margin, 26);
  doc.text(`Address: ${settings.address}`, margin, 31);

  // Big INVOICE Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('INVOICE', pageWidth - margin - 36, 16);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`No: ${invoice.invoiceNumber}`, pageWidth - margin - 36, 22);
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, pageWidth - margin - 36, 27);
  doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, pageWidth - margin - 36, 32);

  // Info Columns (Bill To vs Service Details)
  let currentY = 46;

  // Left Box: Customer Info
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, 86, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, 86, 38, 2, 2, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER / SERVICE LOCATION', margin + 4, currentY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customerName || 'Customer', margin + 4, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Phone: ${invoice.customerMobile}`, margin + 4, currentY + 18);

  const addressLines = doc.splitTextToSize(invoice.customerAddress || 'Address not provided', 78);
  doc.text(addressLines, margin + 4, currentY + 23);

  // Right Box: AC Unit & Job Overview
  const rightX = margin + 92;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, currentY, 90, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, currentY, 90, 38, 2, 2, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPMENT & SERVICE SCOPE', rightX + 4, currentY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`AC Unit: ${invoice.acUnitDetails || 'Air Conditioner'}`, rightX + 4, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Service Type: ${invoice.serviceType}`, rightX + 4, currentY + 18);
  doc.text(`Next Service Due: ${invoice.nextServiceDate ? formatDate(invoice.nextServiceDate) : 'Not scheduled'}`, rightX + 4, currentY + 23);
  doc.text(`Payment Mode: ${invoice.paymentMethod || 'Cash'}`, rightX + 4, currentY + 28);

  currentY += 44;

  // Work summary section if present
  if (invoice.workSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Work Done / Diagnosis:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const summaryLines = doc.splitTextToSize(invoice.workSummary, pageWidth - margin * 2);
    doc.text(summaryLines, margin, currentY + 5);
    currentY += 6 + summaryLines.length * 4;
  }

  // Parts / Charges Table
  const tableRows: (string | number)[][] = [];

  // 1. Labour Charge row
  tableRows.push(['1', `Labour / Service Visit (${invoice.serviceType})`, '1', formatCurrency(invoice.labourCharge), formatCurrency(invoice.labourCharge)]);

  // 2. Parts replaced
  if (invoice.partsUsed && invoice.partsUsed.length > 0) {
    invoice.partsUsed.forEach((part, index) => {
      tableRows.push([
        (index + 2).toString(),
        part.name + (part.reason ? ` (${part.reason})` : ''),
        part.quantity.toString(),
        formatCurrency(part.unitPrice),
        formatCurrency(part.totalPrice),
      ]);
    });
  }

  // 3. Additional charges row if any
  if (invoice.additionalCharges && invoice.additionalCharges > 0) {
    tableRows.push([
      (tableRows.length + 1).toString(),
      'Additional Charges (Gas / Transport / Specialized consumables)',
      '1',
      formatCurrency(invoice.additionalCharges),
      formatCurrency(invoice.additionalCharges),
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item / Service Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Calculate position after table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Financial Breakdown Box (Right Aligned)
  const totalsBoxWidth = 80;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  let totalsY = finalY;

  const addTotalRow = (label: string, value: string, isBold = false, isHighlight = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isHighlight ? 10.5 : 9);

    if (isHighlight) {
      doc.setFillColor(241, 245, 249);
      doc.rect(totalsBoxX, totalsY - 4, totalsBoxWidth, 7, 'F');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setTextColor(71, 85, 105);
    }

    doc.text(label, totalsBoxX + 2, totalsY);
    doc.text(value, pageWidth - margin - 2, totalsY, { align: 'right' });
    totalsY += 6;
  };

  addTotalRow('Labour Charges:', formatCurrency(invoice.labourCharge));
  if (invoice.partsCost > 0) {
    addTotalRow('Parts & Spares:', formatCurrency(invoice.partsCost));
  }
  if (invoice.additionalCharges > 0) {
    addTotalRow('Additional Charges:', formatCurrency(invoice.additionalCharges));
  }
  if (invoice.discount > 0) {
    addTotalRow('Discount Offered:', `-${formatCurrency(invoice.discount)}`);
  }
  addTotalRow('Total Payable:', formatCurrency(invoice.totalAmount), true, true);
  addTotalRow('Amount Received:', formatCurrency(invoice.amountPaid), true);
  addTotalRow('Balance Remaining:', formatCurrency(invoice.balanceDue), true);

  // Left Note & Payment Advice Box
  const notesWidth = totalsBoxX - margin - 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, finalY, notesWidth, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, finalY, notesWidth, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PAYMENT DETAILS & WARRANTY TERMS', margin + 4, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`UPI ID for Instant Payment: ${settings.upiId || 'coolcare@upi'}`, margin + 4, finalY + 11);

  const notesLines = doc.splitTextToSize(`Notes: ${invoice.notes || settings.invoiceNotes}`, notesWidth - 8);
  doc.text(notesLines, margin + 4, finalY + 17);

  const warrantyLines = doc.splitTextToSize(`Warranty: ${invoice.warrantyTerms || settings.warrantyTerms}`, notesWidth - 8);
  doc.text(warrantyLines, margin + 4, finalY + 26);

  // Footer & Signature Area
  const footerY = Math.max(totalsY + 8, finalY + 42);

  // Signature lines
  const sigWidth = 50;
  const customerSigX = margin + 10;
  const techSigX = pageWidth - margin - sigWidth - 10;

  doc.setDrawColor(203, 213, 225);
  doc.line(customerSigX, footerY + 14, customerSigX + sigWidth, footerY + 14);
  doc.line(techSigX, footerY + 14, techSigX + sigWidth, footerY + 14);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Customer's Signature", customerSigX + 8, footerY + 18);
  doc.text('Technician / Authorized Stamp', techSigX + 4, footerY + 18);

  // Bottom Notice
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer generated invoice for AC Home Servicing. Retain for warranty claims.',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  if (autoDownload) {
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  }

  return doc;
}
