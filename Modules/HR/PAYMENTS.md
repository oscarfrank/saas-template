# HR Payments – Guide

This document explains what the HR Payments feature is, how it works, and how to use it.

---

## What it is

**Payments** is the payroll batch feature in the HR module. It lets you:

- Create a **payment run** for a date range (e.g. “January 1–31, 2026”).
- **Choose which staff** to include in that run.
- Have the system **compute each person’s amount** from their salary, allowances, and deductions (prorated for the period).
- **Mark payments as done** either **one by one** (pay individually) or **all at once** (process the whole run).

It does **not** move money or initiate bank transfers. It tracks *who should get how much*, *whether you’ve marked it as paid*, and *how* you paid (Paystack, Kuda, Flutterwave, or manual). You can **generate payment slips** (print or save as PDF) for each staff member and **delete** draft runs you no longer need.

---

## Concepts

| Term | Meaning |
|------|--------|
| **Payment run** | One payroll batch. It has a **period** (start + end date), a **status** (draft or processed), and a **total amount**. |
| **Payment run item** | One line in that batch: one staff member + amount + currency + status (pending → paid) + optional paid date. |
| **Draft** | The run is editable; you can still pay items individually or process the whole run. |
| **Processed** | The run is closed; all items are treated as paid (even if some were paid earlier one by one). |
| **Pay (individual)** | Mark a single run item as paid (sets status to “paid” and records the date). |
| **Process run** | Mark the whole run as processed and set all remaining *pending* items to paid. You choose a **payment method** (Paystack, Kuda, Flutterwave, or Manual). |
| **Payment method** | How the payment was made: **Paystack**, **Kuda**, **Flutterwave**, or **Manual / Other**. Stored on the run (for batch) or on each item (for individual pay). |
| **Payment slip** | A printable page (or PDF via “Print”) for one staff member in a run: period, amount, method, date paid. |

---

## How amounts are calculated

You choose **Full amount** (default) or **Prorated** when creating the run.

### Full amount (default, no proration)

- **Monthly-paid staff**: Get their **full base salary** for the period plus **full allowances** minus **full deductions** (no day ratio). Suited to paying a fixed monthly fee (e.g. Nigeria, many roles).
- **Weekly / bi-weekly**: Still calculated by period length (salary × weeks in period, allowances/deductions prorated by days/30) so the amount matches the period.

### Prorated (optional)

- All staff: Base salary, allowances, and deductions are **prorated by days** in the period (e.g. 15 days in a 30-day month ⇒ half of monthly salary). Use when you need partial-month or partial-period pay.

Only staff with **amount > 0** get a line item. Each line uses that staff member’s **salary currency** (e.g. NGN, USD). If every selected staff has the same currency, the run shows a single total in that currency; if staff use different currencies, the run shows **Multiple currencies** and a breakdown (e.g. NGN 150,000, USD 1,200).

---

## How to use it

### 1. Prerequisites

- Staff must have **HR details** (at least salary or allowances).
- Staff must be **active** (no end date, or end date after the run period).
- You create runs from **Payments** in the HR area.

### 2. Create a payment run

1. Go to **HR → Payments** (or the main HR dashboard and open **Payments**).
2. Click **New payment run**.
3. Set **Period start** and **Period end** (e.g. first and last day of the month). Use **Last month** to fill the period with last month’s first and last day; this also sets **Narration** to “Salary *Month Year*” (e.g. “Salary January 2026”), which you can edit.
4. Optionally set **Narration / payment reference** (e.g. “Salary January 2026”). This is shown on the run and on payment slips and can be used as the reference when making the transfer.
5. Leave **Prorate amounts by days in period** **unchecked** for full monthly amount (default), or **tick it** to prorate by days.
6. In **Staff to include**, tick the people who should be in this run (Select all / Deselect all; at least one required; list shows job title, department, and estimated monthly net where set).
7. Click **Create payment run**.

You’re taken to the run’s detail page. The run is in **Draft** and each line is **Pending** until you mark it paid or process the run.

### 3. Review the run

On the run page you see:

- **Summary**: period, status, total amount, number of recipients, and counts of paid vs pending.
- **Table**: each staff, their amount, currency, status (Pending / Paid), and (in draft) an action to pay that line.

Check that amounts and recipients look correct before marking anything as paid.

### 4. Mark payments as done

You can do either or both:

- **Pay individually**  
  - Only in **Draft** runs.  
  - Click **Pay** on a **Pending** line.  
  - Choose **Payment method** (Paystack, Kuda, Flutterwave, or Manual) and confirm.  
  - That line is marked **Paid**, the date and method are stored.  
  - Use this when you pay people on different days or via different channels.

- **Process entire run**  
  - Only when the run is still **Draft**.  
  - Click **Process entire run** in the header.  
  - Choose **Payment method** (Paystack, Kuda, Flutterwave, or Manual) and confirm.  
  - Every line that is still **Pending** is marked **Paid** and the run status becomes **Processed**.  
  - Use this when you’re done with the batch and want to close it in one go.

After a run is **Processed**, you can’t pay more items individually for that run; the run is closed.

### 5. Payment method (Paystack, Kuda, Flutterwave, Manual)

When you **process the entire run** or **pay one item**, you must choose how the payment is made:

- **Paystack** – Paystack
- **Kuda** – Kuda
- **Flutterwave** – Flutterwave  
- **Manual / Other** – Bank transfer, cash, or any other method

The chosen method is saved on the run (for batch) or on that line item (for individual pay). It appears in the run table and on **payment slips**. The app does not integrate with Paystack/Kuda/Flutterwave APIs; it only records which channel you used.

### 6. Delete a payment run

- **Draft** runs: Any member can delete. Click **Delete run** and confirm once. The run and all its line items are permanently removed.
- **Completed** runs: Only the **organization owner** can delete. Click **Delete run**; you must confirm twice (Continue → then final **Delete run**) to reduce the risk of accidental deletion. This cannot be undone.

### 7. Payment slips

- On the run page, each line has a **Slip** link.
- Click **Slip** to open a **payment slip** for that staff member (in a new tab).
- The slip shows: organization name, employee name, tax ID (if set), pay frequency, period, bank details (at time of pay), gross, deductions, bonuses/allowances, **net pay** (emphasized), reference (narration), payment method, and date paid. Bank and tax details are those **at the time the run was created**, so they remain correct even if the staff profile is updated later.
- Use **Print / Save as PDF** to print or save as PDF from your browser.

Slips are for record-keeping and sharing with staff; they are not sent by email from the app.

### 8. Standalone / historical payslips (from staff profile)

- **Staff profile → Payslips**: You can generate payslips for **past periods** (e.g. before you used this platform). Click **Generate payslip**, choose **period start** and **period end**.
  - **Split by pay period** (default on): One payslip is created per pay period in that range — e.g. if the staff is paid **monthly**, you get one slip per month with narration like "Salary January 2022", "Salary February 2022". If **weekly** or **bi-weekly**, one slip per week or per two weeks. You can edit each slip individually afterwards.
  - **Split by pay period** off: A **single** payslip is created for the exact date range; **narration** is whatever you enter (no automatic "Salary Month Year").
- **Duplicate periods**: You cannot generate a payslip for a period that already has one (same staff, same period dates). Delete the existing payslip first if you need to replace it.
- Payslips are listed **by date** (newest first) on the staff profile. You see slips from **payment runs** (View slip) and **standalone** slips (View, Edit, Delete). **Total paid (all time)** is the sum of all run-item amounts plus all standalone payslip net amounts for that staff.
- HR can **delete** or **adjust** standalone payslips as needed. Run-based slips cannot be edited (they reflect the run).

### 8. List of runs

From **HR → Payments** you see:

- All runs (newest first).
- For each: period, status (Draft / Completed), total amount, number of recipients.
- **View** to open the run and pay or process.

---

## Quick reference

| Action | Where | When |
|--------|--------|------|
| Create a new run | Payments → New payment run | Anytime |
| Change period or staff | Only when creating | Before “Create payment run” |
| Pay one person | Run page → Pay on a pending line, choose method | Run is Draft |
| Pay everyone left | Run page → Process entire run, choose method | Run is Draft |
| See who’s paid / pending | Run page (table + summary cards) | Anytime |
| See payment method | Run page (Method column); run header | Anytime |
| Generate payment slip | Run page → Slip on a line (opens in new tab) | Anytime |
| Delete a run | Run page → Delete run (draft only) | Run is Draft |
| See all runs | Payments (index) | Anytime |

---

## Technical notes (for developers)

- **Routes**: `hr.payments.index`, `hr.payments.create`, `hr.payments.store`, `hr.payments.show`, `hr.payments.process`, `hr.payments.items.pay` (single item), `hr.payments.destroy` (delete draft run), `hr.payments.slip` (payment slip for one item).
- **Models**: `PaymentRun` (tenant, period, status, total_amount, **currency** nullable, payment_method, **prorate**, **narration**), `PaymentRunItem` (run, staff, amount, **currency** per staff, status, paid_at, payment_method, **tax_id**, **bank_name**, **bank_account_number**, **bank_account_name**, **pay_frequency**). Run **currency** is set when all items share one currency; otherwise it is null and the UI shows “Multiple currencies” with a per-currency breakdown.
- **Payment snapshot**: When a run is created, each run item stores a copy of that staff member's tax ID, bank name, account number, account name, and pay frequency. The payslip uses this snapshot so you always know how that payment was made, even if the staff profile is updated later.
- **Narration**: Optional payment reference (e.g. “Salary January 2026”). Stored on the run; shown on run page and payment slips. The **Last month** button on create sets period to last month and auto-fills narration as “Salary {Month} {Year}”.
- **Prorate**: When `prorate` is false (default), monthly-paid staff get full base + allowances − deductions. When true, all amounts are prorated by days (see `calculateItemAmount` in the controller).
- **Payment methods**: `paystack`, `kuda`, `flutterwave`, `manual` (see `PaymentRunController::PAYMENT_METHODS`).
- **Staff selection**: Create sends `staff_ids`; only those staff (and only active ones with amount > 0) get items. At least one staff is required.
- **Proration**: Implemented in `PaymentRunController::prorateSalary()` and in the store logic (allowances/deductions by days/30).

For more detail, see `app/Http/Controllers/PaymentRunController.php` and the payment run migrations.
