# Security Specification & Invariants: AC Home Service Management

## Data Invariants
1. Only authenticated technicians and authorized administrators can create, update, or read records.
2. Invoices cannot be modified or deleted once paid, preserving historical accounting and customer bills.
3. Every customer, AC unit, service, appointment, part, invoice, and payment has strict schema validation.
4. User role cannot be self-elevated to admin unless bootstrapped for `guna44662@gmail.com`.
5. Payment amounts must be positive numbers.
6. Service and invoice records cannot contain negative financial values.
7. Customer IDs and unit references must be valid non-empty identifiers.

## The Dirty Dozen Attack Payloads & Test Assertions
1. **Unauthenticated Read on Customers**: Attempting to read `/customers/{customerId}` without auth -> DENIED.
2. **Ghost Field Injection**: Attempting to inject unexpected admin field `{ "role": "superadmin" }` on customer update -> DENIED.
3. **ID Poisoning Attack**: Passing a 2KB garbage string for customerId -> DENIED.
4. **Negative Payment Amount**: Attempting to log a negative payment `{ "amount": -500 }` -> DENIED.
5. **Unauthorized Invoice Deletion**: Attempting to delete an active invoice -> DENIED.
6. **Spoofed CreatedBy User**: A user setting `createdBy: "someone_else"` instead of their own `request.auth.uid` -> DENIED.
7. **Negative Labour Charge**: Attempting to write negative labour charge -> DENIED.
8. **Tampering with Permanent Service History**: Changing customer address inside past service record after completion -> DENIED.
9. **Blanket Query Access**: Unauthenticated list on `/services` -> DENIED.
10. **Arbitrary Write to Business Settings by Non-Admin**: Unauthorized user rewriting mechanic bank/UPI details -> DENIED.
11. **Oversized String Buffer Overflow Payload**: Injecting 50,000 characters into complaint field -> DENIED.
12. **Unverified Email Privilege Escalation**: Forging email claims without verified account -> DENIED.
