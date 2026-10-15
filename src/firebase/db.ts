import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import {
  Customer,
  ACUnit,
  ServiceRecord,
  Appointment,
  PartItem,
  Invoice,
  PaymentRecord,
  BusinessSettings,
  ReplacedPartLine,
} from '../types';

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: 'CoolCare AC Solutions',
  ownerName: 'Sunil Kumar (Technician & AC Specialist)',
  phone: '+91 98765 43210',
  alternatePhone: '+91 98765 43211',
  email: 'service@coolcareac.com',
  address: 'Shop #4, Metro HVAC Complex, Sector 18, Noida, UP - 201301',
  invoicePrefix: 'CC-',
  defaultCurrency: 'INR',
  serviceReminderDays: 90,
  invoiceNotes: 'Thank you for choosing CoolCare AC Solutions! For any emergency cooling assistance, please call us directly.',
  warrantyTerms: '30 Days Service Warranty on general labour. 90 Days replacement warranty on newly installed original compressor capacitors and copper joints.',
  upiId: 'coolcare@upi',
};

// Helper to generate short readable IDs
export function generateCode(prefix: string, length = 4): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

/* ============================================================
   1. CUSTOMER OPERATIONS
   ============================================================ */
export async function getCustomers(): Promise<Customer[]> {
  try {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'customers');
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const ref = doc(db, 'customers', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Customer, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `customers/${id}`);
  }
}

export async function addCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'customerCode'>): Promise<Customer> {
  const ref = doc(collection(db, 'customers'));
  const customerCode = generateCode('CUST', 4);
  const now = new Date().toISOString();
  const customer: Customer = {
    ...data,
    id: ref.id,
    customerCode,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.currentUser?.uid || 'system',
  };

  try {
    await setDoc(ref, customer);
    return customer;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `customers/${ref.id}`);
  }
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  try {
    const ref = doc(db, 'customers', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    const ref = doc(db, 'customers', id);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
  }
}

/* ============================================================
   2. AC UNIT OPERATIONS
   ============================================================ */
export async function getACUnits(): Promise<ACUnit[]> {
  try {
    const q = query(collection(db, 'acUnits'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ACUnit, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'acUnits');
  }
}

export async function getACUnitsByCustomer(customerId: string): Promise<ACUnit[]> {
  try {
    const q = query(collection(db, 'acUnits'), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ACUnit, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `acUnits?customerId=${customerId}`);
  }
}

export async function addACUnit(data: Omit<ACUnit, 'id' | 'createdAt'>): Promise<ACUnit> {
  const ref = doc(collection(db, 'acUnits'));
  const now = new Date().toISOString();
  const unit: ACUnit = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.currentUser?.uid || 'system',
  };

  try {
    await setDoc(ref, unit);
    return unit;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `acUnits/${ref.id}`);
  }
}

export async function updateACUnit(id: string, data: Partial<ACUnit>): Promise<void> {
  try {
    const ref = doc(db, 'acUnits', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `acUnits/${id}`);
  }
}

export async function deleteACUnit(id: string): Promise<void> {
  try {
    const ref = doc(db, 'acUnits', id);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `acUnits/${id}`);
  }
}

/* ============================================================
   3. SERVICE RECORD & INVOICE OPERATIONS
   ============================================================ */
export async function getServices(): Promise<ServiceRecord[]> {
  try {
    const q = query(collection(db, 'services'), orderBy('serviceDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRecord, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'services');
  }
}

export async function getServicesByCustomer(customerId: string): Promise<ServiceRecord[]> {
  try {
    const q = query(collection(db, 'services'), where('customerId', '==', customerId));
    const snap = await getDocs(q);
    const services = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRecord, 'id'>) }));
    return services.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `services?customerId=${customerId}`);
  }
}

export async function getServicesByACUnit(acUnitId: string): Promise<ServiceRecord[]> {
  try {
    const q = query(collection(db, 'services'), where('acUnitId', '==', acUnitId));
    const snap = await getDocs(q);
    const services = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRecord, 'id'>) }));
    return services.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `services?acUnitId=${acUnitId}`);
  }
}

export async function createServiceRecord(
  serviceInput: Omit<ServiceRecord, 'id' | 'serviceCode' | 'createdAt' | 'remainingBalance' | 'paymentStatus' | 'invoiceId' | 'invoiceNumber'>,
  generateBillNow = true,
  settings?: BusinessSettings
): Promise<{ service: ServiceRecord; invoice?: Invoice }> {
  const serviceRef = doc(collection(db, 'services'));
  const serviceCode = generateCode('SRV', 4);
  const now = new Date().toISOString();

  // Calculations
  const labourCharge = Number(serviceInput.labourCharge) || 0;
  const partsCost = serviceInput.replacedParts.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
  const additionalCharges = Number(serviceInput.additionalCharges) || 0;
  const discount = Number(serviceInput.discount) || 0;
  const subtotal = labourCharge + partsCost + additionalCharges;
  const totalAmount = Math.max(0, subtotal - discount);
  const amountPaid = Math.min(totalAmount, Number(serviceInput.amountPaid) || 0);
  const remainingBalance = Math.max(0, totalAmount - amountPaid);

  let paymentStatus: ServiceRecord['paymentStatus'] = 'Unpaid';
  if (remainingBalance <= 0 && totalAmount > 0) {
    paymentStatus = 'Paid';
  } else if (amountPaid > 0) {
    paymentStatus = 'Partially Paid';
  }

  const invoiceNumber = generateCode(settings?.invoicePrefix || 'CC', 5);
  const invoiceRef = doc(collection(db, 'invoices'));

  const serviceRecord: ServiceRecord = {
    ...serviceInput,
    id: serviceRef.id,
    serviceCode,
    partsCost,
    totalAmount,
    amountPaid,
    remainingBalance,
    paymentStatus,
    invoiceId: generateBillNow ? invoiceRef.id : undefined,
    invoiceNumber: generateBillNow ? invoiceNumber : undefined,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.currentUser?.uid || 'system',
  };

  const batch = writeBatch(db);
  batch.set(serviceRef, serviceRecord);

  // If replaced parts exist, also log them in parts collection for tracking
  for (const part of serviceInput.replacedParts) {
    const partRef = doc(collection(db, 'parts'));
    const partItem: PartItem = {
      id: partRef.id,
      name: part.name,
      description: part.reason || 'Replaced during AC service',
      quantity: part.quantity,
      unitPrice: part.unitPrice,
      totalPrice: part.totalPrice,
      serviceId: serviceRef.id,
      acUnitId: serviceInput.acUnitId,
      replacementReason: part.reason,
      replacementDate: serviceInput.serviceDate,
      partType: 'consumed_part',
      createdAt: now,
      updatedAt: now,
      createdBy: auth.currentUser?.uid || 'system',
    };
    batch.set(partRef, partItem);
  }

  let createdInvoice: Invoice | undefined;

  if (generateBillNow) {
    createdInvoice = {
      id: invoiceRef.id,
      invoiceNumber,
      serviceId: serviceRef.id,
      customerId: serviceInput.customerId,
      customerName: serviceInput.customerName,
      customerMobile: serviceInput.customerMobile,
      customerAddress: serviceInput.customerAddress,
      acUnitDetails: `${serviceInput.acBrand} ${serviceInput.acType} (${serviceInput.acCapacity})`,
      invoiceDate: serviceInput.serviceDate,
      serviceType: serviceInput.serviceType,
      workSummary: serviceInput.workPerformed,
      partsUsed: serviceInput.replacedParts,
      labourCharge,
      partsCost,
      additionalCharges,
      discount,
      subtotal,
      totalAmount,
      amountPaid,
      balanceDue: remainingBalance,
      paymentMethod: serviceInput.paymentMethod,
      paymentStatus,
      nextServiceDate: serviceInput.nextRecommendedDate,
      notes: settings?.invoiceNotes || 'Thank you for your business.',
      warrantyTerms: settings?.warrantyTerms || '30 days service warranty.',
      createdAt: now,
      updatedAt: now,
      createdBy: auth.currentUser?.uid || 'system',
    };
    batch.set(invoiceRef, createdInvoice);

    // If initial payment was made, add payment entry
    if (amountPaid > 0) {
      const paymentRef = doc(collection(db, 'payments'));
      const payment: PaymentRecord = {
        id: paymentRef.id,
        paymentCode: generateCode('PAY', 4),
        invoiceId: invoiceRef.id,
        invoiceNumber,
        serviceId: serviceRef.id,
        customerId: serviceInput.customerId,
        customerName: serviceInput.customerName,
        amount: amountPaid,
        paymentMethod: serviceInput.paymentMethod,
        paymentDate: serviceInput.serviceDate,
        transactionRef: 'Initial Service Payment',
        notes: `Received at time of service (${serviceInput.paymentMethod})`,
        recordedBy: auth.currentUser?.displayName || 'Technician',
        createdAt: now,
      };
      batch.set(paymentRef, payment);
    }
  }

  try {
    await batch.commit();
    return { service: serviceRecord, invoice: createdInvoice };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'services-and-invoices');
  }
}

export async function updateServiceRecord(id: string, data: Partial<ServiceRecord>): Promise<void> {
  try {
    const ref = doc(db, 'services', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `services/${id}`);
  }
}

export async function deleteServiceRecord(id: string): Promise<void> {
  try {
    const ref = doc(db, 'services', id);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
  }
}

/* ============================================================
   4. APPOINTMENT OPERATIONS
   ============================================================ */
export async function getAppointments(): Promise<Appointment[]> {
  try {
    const q = query(collection(db, 'appointments'), orderBy('appointmentDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
  }
}

export async function addAppointment(data: Omit<Appointment, 'id' | 'appointmentCode' | 'createdAt'>): Promise<Appointment> {
  const ref = doc(collection(db, 'appointments'));
  const appointmentCode = generateCode('APT', 4);
  const now = new Date().toISOString();
  const appt: Appointment = {
    ...data,
    id: ref.id,
    appointmentCode,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.currentUser?.uid || 'system',
  };

  try {
    await setDoc(ref, appt);
    return appt;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `appointments/${ref.id}`);
  }
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  try {
    const ref = doc(db, 'appointments', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  try {
    const ref = doc(db, 'appointments', id);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
  }
}

/* ============================================================
   5. INVOICE & PAYMENT OPERATIONS
   ============================================================ */
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invoice, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'invoices');
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const ref = doc(db, 'invoices', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Invoice, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `invoices/${id}`);
  }
}

export async function getPayments(): Promise<PaymentRecord[]> {
  try {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentRecord, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'payments');
  }
}

export async function recordAdditionalPayment(params: {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentRecord['paymentMethod'];
  paymentDate: string;
  transactionRef?: string;
  notes?: string;
}): Promise<PaymentRecord> {
  const invoice = await getInvoiceById(params.invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const paymentAmount = Number(params.amount);
  if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero');

  const newTotalPaid = (Number(invoice.amountPaid) || 0) + paymentAmount;
  const newBalanceDue = Math.max(0, (Number(invoice.totalAmount) || 0) - newTotalPaid);
  const newPaymentStatus: Invoice['paymentStatus'] = newBalanceDue <= 0 ? 'Paid' : 'Partially Paid';

  const batch = writeBatch(db);
  const paymentRef = doc(collection(db, 'payments'));
  const now = new Date().toISOString();

  const paymentRecord: PaymentRecord = {
    id: paymentRef.id,
    paymentCode: generateCode('PAY', 4),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    serviceId: invoice.serviceId,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    amount: paymentAmount,
    paymentMethod: params.paymentMethod,
    paymentDate: params.paymentDate,
    transactionRef: params.transactionRef,
    notes: params.notes,
    recordedBy: auth.currentUser?.displayName || 'Technician',
    createdAt: now,
  };

  batch.set(paymentRef, paymentRecord);

  // Update invoice
  const invoiceRef = doc(db, 'invoices', invoice.id);
  batch.update(invoiceRef, {
    amountPaid: newTotalPaid,
    balanceDue: newBalanceDue,
    paymentStatus: newPaymentStatus,
    paymentMethod: params.paymentMethod,
    updatedAt: now,
  });

  // Update related service if exists
  if (invoice.serviceId) {
    const serviceRef = doc(db, 'services', invoice.serviceId);
    batch.update(serviceRef, {
      amountPaid: newTotalPaid,
      remainingBalance: newBalanceDue,
      paymentStatus: newPaymentStatus,
      paymentMethod: params.paymentMethod,
      updatedAt: now,
    });
  }

  try {
    await batch.commit();
    return paymentRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payments/${paymentRef.id}`);
  }
}

/* ============================================================
   6. PARTS & MATERIALS
   ============================================================ */
export async function getParts(): Promise<PartItem[]> {
  try {
    const q = query(collection(db, 'parts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PartItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'parts');
  }
}

export async function addPart(data: Omit<PartItem, 'id' | 'createdAt'>): Promise<PartItem> {
  const ref = doc(collection(db, 'parts'));
  const now = new Date().toISOString();
  const part: PartItem = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
    createdBy: auth.currentUser?.uid || 'system',
  };

  try {
    await setDoc(ref, part);
    return part;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `parts/${ref.id}`);
  }
}

export async function updatePart(id: string, data: Partial<PartItem>): Promise<void> {
  try {
    const ref = doc(db, 'parts', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `parts/${id}`);
  }
}

export async function deletePart(id: string): Promise<void> {
  try {
    const ref = doc(db, 'parts', id);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `parts/${id}`);
  }
}

/* ============================================================
   7. BUSINESS SETTINGS
   ============================================================ */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  try {
    const ref = doc(db, 'businessSettings', 'default');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_BUSINESS_SETTINGS;
    }
    return { ...DEFAULT_BUSINESS_SETTINGS, ...(snap.data() as BusinessSettings) };
  } catch (error) {
    console.warn('Could not load remote settings, using default', error);
    return DEFAULT_BUSINESS_SETTINGS;
  }
}

export async function saveBusinessSettings(settings: Partial<BusinessSettings>): Promise<void> {
  try {
    const ref = doc(db, 'businessSettings', 'default');
    await setDoc(
      ref,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'businessSettings/default');
  }
}

/* ============================================================
   8. REAL-TIME SEEDER FOR INSTANT VALUE
   ============================================================ */
export async function seedRealisticSampleData(): Promise<void> {
  const now = new Date();
  const formatDate = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };
  const formatFutureDate = (daysAhead: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // Sample customers
  const customersData = [
    {
      fullName: 'Vikram Malhotra',
      mobileNumber: '9810123456',
      altMobileNumber: '9810123457',
      address: 'Flat 402, Royal Palms, Sector 62',
      area: 'Sector 62, Noida',
      email: 'vikram.m@example.com',
      notes: 'Customer prefers morning service visits between 9 AM to 12 PM.',
    },
    {
      fullName: 'Pooja Sharma',
      mobileNumber: '9871234567',
      address: 'Villa 12, Green Glen Layout, Bellandur',
      area: 'Bellandur, Bangalore',
      email: 'pooja.s@example.com',
      notes: 'Has 2 pets. Outdoor unit is placed on balcony roof terrace.',
    },
    {
      fullName: 'Anand Kumar',
      mobileNumber: '9765432109',
      address: 'B-104, Sunrise Heights, Kothrud',
      area: 'Kothrud, Pune',
      email: 'anand.k@example.com',
      notes: 'Needs regular 3-month seasonal servicing for home clinic.',
    },
    {
      fullName: 'Rajesh Verma',
      mobileNumber: '9923456789',
      address: 'House #84, Model Town, Civil Lines',
      area: 'Model Town, Delhi',
      email: 'rajesh.v@example.com',
      notes: 'Corporate executive, call before arrival.',
    },
  ];

  for (const c of customersData) {
    const customer = await addCustomer(c);

    // Add AC Units for each customer
    if (c.fullName === 'Vikram Malhotra') {
      const ac1 = await addACUnit({
        customerId: customer.id,
        brand: 'Daikin',
        modelNumber: 'FTKM50TV',
        acType: 'Inverter Split',
        capacity: '1.5 ton',
        serialNumber: 'DK-2023-8891',
        locationInHome: 'Master Bedroom',
        notes: 'Copper piping length ~ 5 meters. Very quiet unit.',
      });
      const ac2 = await addACUnit({
        customerId: customer.id,
        brand: 'Voltas',
        modelNumber: '183V CZT',
        acType: 'Split',
        capacity: '1.5 ton',
        serialNumber: 'VL-2021-4320',
        locationInHome: 'Living Room',
        notes: 'Needs outdoor coil jet-wash due to road dust.',
      });

      // Service for AC 1
      await createServiceRecord(
        {
          customerId: customer.id,
          customerName: customer.fullName,
          customerMobile: customer.mobileNumber,
          customerAddress: customer.address,
          customerArea: customer.area,
          acUnitId: ac1.id,
          acBrand: ac1.brand,
          acModel: ac1.modelNumber,
          acType: ac1.acType,
          acCapacity: ac1.capacity,
          acLocation: ac1.locationInHome,
          serviceDate: formatDate(12),
          serviceTime: '10:30',
          serviceType: 'Deep Cleaning',
          complaint: 'Cooling was weak and slight foul smell from blower',
          workPerformed: 'Full indoor deep foam wash, jet pressure wash for condenser coil, filter sanitize, drain tray antibacterial clean.',
          cleaningDetails: 'Chemical coil cleaner used, blower thoroughly washed.',
          technicianNotes: 'Cooling restored to 16°C discharge temp. Running amps normal at 6.1A.',
          replacedParts: [],
          labourCharge: 950,
          partsCost: 0,
          additionalCharges: 100,
          discount: 50,
          totalAmount: 1000,
          amountPaid: 1000,
          paymentMethod: 'UPI',
          nextRecommendedDate: formatFutureDate(78),
          status: 'Completed',
        },
        true,
        DEFAULT_BUSINESS_SETTINGS
      );

      // Appointment for AC 2
      await addAppointment({
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.mobileNumber,
        address: customer.address,
        area: customer.area,
        acUnitId: ac2.id,
        acDetails: 'Voltas 1.5 ton Split - Living Room',
        appointmentDate: formatFutureDate(1),
        appointmentTime: '11:00',
        serviceType: 'General Service',
        notes: 'Pre-summer servicing checkup and condenser wash.',
        status: 'Scheduled',
      });
    }

    if (c.fullName === 'Pooja Sharma') {
      const ac = await addACUnit({
        customerId: customer.id,
        brand: 'LG',
        modelNumber: 'RS-Q19ENZE',
        acType: 'Inverter Split',
        capacity: '1.5 ton',
        serialNumber: 'LG-2024-9012',
        locationInHome: 'Study Room',
        notes: 'Dual inverter compressor, 10-year warranty on compressor.',
      });

      // Service with Gas refilling and Capacitor replacement
      await createServiceRecord(
        {
          customerId: customer.id,
          customerName: customer.fullName,
          customerMobile: customer.mobileNumber,
          customerAddress: customer.address,
          customerArea: customer.area,
          acUnitId: ac.id,
          acBrand: ac.brand,
          acModel: ac.modelNumber,
          acType: ac.acType,
          acCapacity: ac.capacity,
          acLocation: ac.locationInHome,
          serviceDate: formatDate(5),
          serviceTime: '14:00',
          serviceType: 'Gas Refilling',
          complaint: 'Fan runs but no cooling, outdoor unit was tripping.',
          workPerformed: 'Detected micro-leak in flare nut, braze tightened, vacuumed system for 30 mins, refilled R32 refrigerant, replaced worn 45uF starting capacitor.',
          gasLevelDetails: 'R32 gas charged to 125 PSI suction pressure.',
          technicianNotes: 'Tested for 45 minutes continuous running. Sub-cooling and super-heat optimal.',
          replacedParts: [
            {
              name: 'Dual Run Capacitor 45uF (EPCOS)',
              quantity: 1,
              unitPrice: 480,
              totalPrice: 480,
              reason: 'Burnt terminal and low capacitance reading (28uF)',
            },
            {
              name: 'Brass Flare Nut & Copper Washer (1/2")',
              quantity: 2,
              unitPrice: 120,
              totalPrice: 240,
              reason: 'Cracked thread caused slow gas leak',
            },
          ],
          labourCharge: 1200,
          partsCost: 720,
          additionalCharges: 1800, // Refrigerant gas cost
          discount: 100,
          totalAmount: 3620,
          amountPaid: 2500, // Partial payment
          paymentMethod: 'Cash',
          nextRecommendedDate: formatFutureDate(90),
          status: 'Completed',
        },
        true,
        DEFAULT_BUSINESS_SETTINGS
      );
    }

    if (c.fullName === 'Anand Kumar') {
      const ac = await addACUnit({
        customerId: customer.id,
        brand: 'Hitachi',
        modelNumber: 'RAW518KUD',
        acType: 'Window',
        capacity: '1.5 ton',
        serialNumber: 'HT-2020-1120',
        locationInHome: 'Clinic Consulting Room',
        notes: 'Window AC mounted on ground floor wooden frame.',
      });

      // Overdue Appointment
      await addAppointment({
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.mobileNumber,
        address: customer.address,
        area: customer.area,
        acUnitId: ac.id,
        acDetails: 'Hitachi 1.5 ton Window - Clinic Room',
        appointmentDate: formatDate(2), // 2 days ago (overdue)
        appointmentTime: '16:00',
        serviceType: 'Maintenance',
        notes: 'Overdue service: Customer called to reschedule because clinic was busy.',
        status: 'Scheduled',
      });
    }

    if (c.fullName === 'Rajesh Verma') {
      const ac = await addACUnit({
        customerId: customer.id,
        brand: 'Mitsubishi Heavy',
        modelNumber: 'SRK20CRS-S8',
        acType: 'Inverter Split',
        capacity: '2 ton',
        serialNumber: 'MH-2022-7711',
        locationInHome: 'Grand Hall',
        notes: 'Heavy duty cooling unit. High ceiling area.',
      });

      // Today's appointment
      await addAppointment({
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.mobileNumber,
        address: customer.address,
        area: customer.area,
        acUnitId: ac.id,
        acDetails: 'Mitsubishi 2 ton Split - Grand Hall',
        appointmentDate: formatDate(0), // Today!
        appointmentTime: '15:30',
        serviceType: 'Repair',
        notes: 'Water dripping heavily from indoor unit onto cabinet.',
        status: 'Scheduled',
      });
    }
  }

  // Pre-seed common spare parts catalog
  const commonParts: Omit<PartItem, 'id' | 'createdAt'>[] = [
    {
      name: 'Run Capacitor 35uF (Kelvin)',
      description: 'Compressor capacitor suitable for 1 Ton Split AC',
      quantity: 12,
      unitPrice: 380,
      totalPrice: 4560,
      partType: 'consumed_part',
      replacementReason: 'Stock item',
    },
    {
      name: 'Dual Run Capacitor 50uF (Tibcon)',
      description: 'Heavy duty capacitor for 2 Ton Inverter/Non-Inverter units',
      quantity: 8,
      unitPrice: 550,
      totalPrice: 4400,
      partType: 'consumed_part',
      replacementReason: 'Stock item',
    },
    {
      name: 'R32 Refrigerant Gas Cylinder (3kg pack)',
      description: 'Eco-friendly high cooling R32 gas',
      quantity: 4,
      unitPrice: 2200,
      totalPrice: 8800,
      partType: 'consumed_part',
      replacementReason: 'Stock item',
    },
    {
      name: 'Universal AC Remote Control',
      description: 'Compatible with Voltas, Daikin, LG, Samsung, Hitachi, Lloyd',
      quantity: 15,
      unitPrice: 280,
      totalPrice: 4200,
      partType: 'consumed_part',
      replacementReason: 'Stock item',
    },
    {
      name: 'Flexible AC Drain Pipe (10m roll)',
      description: 'UV-resistant corrugated anti-crack drainage pipe',
      quantity: 6,
      unitPrice: 350,
      totalPrice: 2100,
      partType: 'consumed_part',
      replacementReason: 'Stock item',
    },
    {
      name: 'Pressure Jet Washer Gun & Hose Kit',
      description: 'Professional high-pressure indoor coil cleaning tool',
      quantity: 1,
      unitPrice: 3500,
      totalPrice: 3500,
      partType: 'technician_tool',
      replacementReason: 'Technician Toolkit',
    },
    {
      name: 'Digital HVAC Manifold Gauge Set',
      description: 'Two-valve manifold gauge with R32/R410/R22 scales and hoses',
      quantity: 1,
      unitPrice: 4200,
      totalPrice: 4200,
      partType: 'technician_tool',
      replacementReason: 'Technician Toolkit',
    },
  ];

  for (const part of commonParts) {
    await addPart(part);
  }
}
