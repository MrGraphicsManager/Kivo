# 🛍️ Kivo — Cloud Retail Operating System & Smart POS

<div align="center">

![Kivo Banner](https://img.shields.io/badge/Kivo-Retail%20OS%20v2.0-blue?style=for-the-badge&logo=react)
![PEAN Studio](https://img.shields.io/badge/Studio-PEAN%20Ecosystem-purple?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Hardening-orange?style=for-the-badge)

**A high-performance, low-latency Point of Sale (POS) and retail management platform built for modern Indian Kirana, grocery, and pharmacy counters.**

[Features](#-key-engineering-highlights) • [Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Author](#-creator--author)

</div>

---

## 🚀 Overview

**Kivo** is an end-to-end retail operating system engineered to eliminate checkout queues and digitize small business counter operations. Developed from the ground up to solve the real bottlenecks faced by physical stores, Kivo brings sub-second keyboard checkout, native thermal hardware spooling, real-time multi-device sync, and automated customer credit recovery via WhatsApp.

A flagship venture engineered under the **PEAN** technology studio.

---

## ⚡ Key Engineering Highlights

### 1. ⏱️ Fast POS Checkout
- **F1–F6 Keyboard Shortcuts:** Cashiers can search products, modify quantities, select payment modes, and dispatch bills without touching a mouse.
- **Sub-Second Latency:** Client-side optimistic cart operations and fast indexed item lookups guarantee zero lag at high-volume counters.

### 2. 🔄 Real-Time Distributed Terminal Synchronization
- **Server-Sent Events (SSE) & ntfy.sh Event Bus:** Multiple counter tablets, barcode scanners, and back-office inventory dashboards synchronize state in real time without heavy polling.
- **Zero-Refresh Updates:** Store announcements, maintenance locks, and catalog adjustments propagate instantly across all active merchant sessions.

### 3. 🖨️ Native ESC/POS Thermal Receipt Engine
- **58mm & 80mm ESC/POS Standard:** Direct browser-based spooler formatting clean monochrome receipts with dashed line separators and barcode numbers.
- **Diagnostic Spooling:** Built-in hardware test utility verifying margins, column widths (32/48 col), feed, and paper cut.
- **Custom Branding Toggle:** Merchants can toggle custom header branding and store contact details on demand.

### 4. 💬 1-Tap WhatsApp Digital Cash Memos & Udhaar Recovery
- Replaces traditional manual paper credit notebooks with automated WhatsApp reminders.
- Merchants can dispatch formatted digital cash memos with 1 tap via the WhatsApp Web/App API, reducing unpaid debts and awkward follow-ups.

### 5. 📦 Universal 100+ FMCG Master Barcode Catalog
- Integrated master barcode database covering standard FMCG items (Atta, Maggi, Dettol, Parle-G, Lifebuoy).
- Scanning standard product barcodes instantly auto-fills product names, standard MRP, selling prices, and HSN codes with zero manual typing.

### 6. 📱 Mobile-First UX Overhaul (100% Desktop Preservation)
- **Slide-Out Hamburger Drawer (☰):** Grants full access to all 11 pages (POS, Inventory, Khata, Stock Alerts, Reports, Admin) on smartphones.
- **Floating Cart Pill & Slide-Up Bill Sheet:** Floating pill displays live totals above the bottom bar, expanding into a thumb-friendly bottom checkout sheet.
- **Strict Isolation:** 100% of desktop column layouts (`lg:col-span-5`, `lg:sticky`) remain completely untouched and regressions-free.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Create React App (CRACO), Tailwind CSS, Lucide React, Framer Motion |
| **Backend / API** | FastAPI + Netlify/Vercel serverless API routes, REST APIs |
| **Database & Cache** | MongoDB (FastAPI backend) + serverless sync/persistence |
| **Hardware / Protocol** | ESC/POS Thermal Printing, Webhooks, WhatsApp API |
| **Tooling & Build** | Craco, PostCSS, ESLint, Git & GitHub |

---

## 🏗️ System Architecture

```
[ Barcode Scanner / F1-F6 Counter ]
               │
               ▼
   [ Kivo POS Client (React 18) ]
   ├── Client-side Cart & Tax Calculation (client-side optimistic updates)
   ├── Local-first Cache & Offline Storage
   └── Responsive View Engine (Mobile Drawer / Desktop Grid)
         │                   │                    │
         ▼                   ▼                    ▼
[ ESC/POS Spooler ]   [ WhatsApp API ]   [ SSE Event Bus (ntfy.sh) ]
  • 58mm/80mm Paper     • Digital Memo     • Multi-device Store Sync
  • Cut & Margin Test   • Udhaar Reminders • Instant Announcement Lock
```

---

## 💻 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/MrGraphicsManager/Kivo.git
cd Kivo

# Install frontend dependencies
cd frontend
npm install

# Start local development server
npm start
```

Visit `http://localhost:3000` to launch Kivo.

---

## 👨‍💻 Creator & Author

**Priyen Naik**  
*Full-Stack Software Engineer & Product Architect*  
- 🐙 GitHub: [@MrGraphicsManager](https://github.com/MrGraphicsManager)  
- 📧 Email: [contact@officialdukaan.in](mailto:contact@officialdukaan.in)  
- 🏢 Studio: **PEAN Ecosystem**

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).


## Production backend configuration

Kivo uses the FastAPI + MongoDB backend as the production source of truth. Configure the deployment environment variable `KIVO_BACKEND_URL` to the deployed FastAPI base URL (for example, `https://api.example.com/api`). Do not point it at the legacy Netlify stateful function.

Required backend variables include `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, `ADMIN_EMAIL`, and the payment/email provider secrets used by enabled features.

MongoDB production deployment must support replica sets or MongoDB transactions (for example, Atlas). Kivo checkout uses a transaction to commit the order, stock decrement, and stock movement records atomically; a standalone MongoDB server is not supported for production checkout.
