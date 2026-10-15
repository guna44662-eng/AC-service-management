# CoolCare Pro - AC Home Service Management System

A complete, responsive web application for Air Conditioner mechanics and technicians providing on-site servicing, repair, chemical foam jet washing, refrigerant gas charging, and maintenance at customers' homes.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (Mobile-first responsive interface with print styles)
- **Database & Auth:** Firebase Firestore & Firebase Authentication
- **PDF Generation:** `jspdf` & `jspdf-autotable`
- **Icons & Polish:** Lucide React, Canvas Confetti

---

## 📋 Features

1. **Operations Dashboard:**
   - Real-time KPI summaries: Total Customers, AC Units, Completed Jobs, Today's Home Visits, Overdue Services, Total Revenue, and Outstanding Balances.
   - Quick Action buttons: Record Service, Add Customer, Schedule Visit, Generate Bill.
   - Today's visit schedule agenda and latest service history table.

2. **Customer Management:**
   - Add, edit, search, and delete customers.
   - Search across Name, Mobile number, Customer Code (`CUST-XXXX`), and Area/Locality.
   - Comprehensive **Customer Profile**: displays all AC units owned, historical service records, past invoices, payment history, and upcoming appointments.

3. **AC Unit Management:**
   - Multi-unit support per household (Split AC, Window AC, Inverter Split, Cassette).
   - Specifications: Tonnage (1 ton, 1.5 ton, 2 ton), Model number, Serial number, Location in home (e.g. Master Bedroom, Hall), and Warranty dates.
   - Complete maintenance history per unit.

4. **Service & Job Records:**
   - Detailed diagnosis: Complaint, Work performed, Cleaning details (jet pressure wash, foam wash), Gas pressure readings (PSI, gas type e.g. R32, R410A, R22), and Technician notes.
   - Dynamic spare parts row addition with unit price and auto-calculation.
   - Labour charges, parts cost, additional fees, discounts, net payable, amount paid, and outstanding balance.
   - Permanent historical snapshots: changes to current customer profiles do not alter past bills.

5. **Appointments & Next Service Reminders:**
   - Schedule or reschedule visits with date & time pickers.
   - Due soon and overdue alert indicators.
   - 1-click option to record service and mark appointment complete.
   - Calendar and List agenda views.

6. **Professional Bills & PDF Invoices:**
   - Clean, professional A4 printable invoice layout.
   - Mechanic business branding, contact numbers, address, and UPI ID for payments.
   - Customer details, AC specifications, itemized labour & parts table, balance due, warranty terms, and signature lines.
   - One-click PDF download and direct printer dialog.

7. **Payments & Revenue Management:**
   - Paid, partially paid, and unpaid invoices tracking.
   - Payment history log with transaction references.
   - Outstanding balance report with instant "Collect Payment" action.
   - Monthly and yearly revenue summaries.
   - Customer-wise expense breakdown.

8. **Spare Parts & Technician Toolkit:**
   - Stock inventory tracking for capacitors, copper fittings, refrigerants, and drain pipes.
   - Distinguishes consumed parts from reusable mechanic tools (manifold gauges, jet pump).
   - Stock valuation counter.

9. **Reports & Analytical Search:**
   - Filter by date range, customer, AC brand, service type, and payment status.
   - One-click CSV export for accounting and taxes.

10. **Business Settings:**
    - Custom shop name, lead technician name, phones, address, invoice prefix, currency (INR ₹), UPI ID, and warranty terms.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or bun

### 2. Installation
```bash
npm install
```

### 3. Running Locally
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 4. Sample Data
Click the **"Seed Sample AC Data"** button in the sidebar footer to instantly populate realistic demo customers, AC units, service logs, appointments, and bills.

---

## 🔒 Firebase Configuration & Deployment

### Firestore Database & Auth
1. Firebase Firestore and Auth are pre-configured via `firebase-applet-config.json`.
2. Security rules are defined in `firestore.rules` and enforced via `rules_version = '2'`.
3. To deploy rules updates:
```bash
# Deployed automatically via Firebase fax.DeployRules RPC
```

### Building for Production
```bash
npm run build
```
Production assets are generated in the `dist/` directory.
