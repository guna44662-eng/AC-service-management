export type ACType = 'Split' | 'Window' | 'Inverter Split' | 'Other';
export type ACCapacity = '1 ton' | '1.5 ton' | '2 ton' | 'Other';
export type ServiceType = 
  | 'General Service'
  | 'Deep Cleaning'
  | 'Gas Refilling'
  | 'Repair'
  | 'Installation'
  | 'Uninstallation'
  | 'Maintenance'
  | 'Other';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';
export type ServiceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
export type PartType = 'consumed_part' | 'technician_tool';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'technician';
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  mobileNumber: string;
  altMobileNumber?: string;
  address: string;
  area: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ACUnit {
  id: string;
  customerId: string;
  customerName?: string; // Cache for display
  brand: string;
  modelNumber?: string;
  acType: ACType;
  capacity: ACCapacity;
  serialNumber?: string;
  installationDate?: string;
  warrantyExpiryDate?: string;
  locationInHome?: string; // e.g., Master Bedroom, Living Room
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ReplacedPartLine {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason?: string;
}

export interface ServiceRecord {
  id: string;
  serviceCode: string;
  // Immutable Customer Snapshot
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  customerArea?: string;
  // AC Unit Snapshot
  acUnitId: string;
  acBrand: string;
  acModel?: string;
  acType: ACType;
  acCapacity: ACCapacity;
  acLocation?: string;
  
  serviceDate: string; // YYYY-MM-DD
  serviceTime?: string; // HH:mm
  serviceType: ServiceType;
  complaint?: string;
  workPerformed: string;
  cleaningDetails?: string;
  gasLevelDetails?: string; // e.g. "R32 gas refilled - 65 PSI"
  technicianNotes?: string;
  
  replacedParts: ReplacedPartLine[];
  
  labourCharge: number;
  partsCost: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  nextRecommendedDate?: string; // YYYY-MM-DD
  status: ServiceStatus;
  
  invoiceId?: string;
  invoiceNumber?: string;
  
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PartItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceId?: string;
  acUnitId?: string;
  replacementReason?: string;
  replacementDate?: string;
  partType: PartType;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Appointment {
  id: string;
  appointmentCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  area?: string;
  acUnitId?: string;
  acDetails?: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  serviceType: ServiceType;
  notes?: string;
  status: ServiceStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  serviceId: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  acUnitDetails: string;
  invoiceDate: string;
  
  serviceType: string;
  workSummary: string;
  partsUsed: ReplacedPartLine[];
  
  labourCharge: number;
  partsCost: number;
  additionalCharges: number;
  discount: number;
  subtotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  nextServiceDate?: string;
  notes?: string;
  warrantyTerms?: string;
  
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PaymentRecord {
  id: string;
  paymentCode?: string;
  invoiceId: string;
  invoiceNumber: string;
  serviceId?: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionRef?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface BusinessSettings {
  id?: string;
  businessName: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  logoUrl?: string;
  invoicePrefix: string;
  defaultCurrency: string; // 'INR' or '₹'
  serviceReminderDays: number; // e.g. 90
  invoiceNotes: string;
  warrantyTerms: string;
  upiId?: string;
  updatedAt?: string;
}
