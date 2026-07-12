# Avvai Iyarkai Agam — Organic E-Commerce & ERP Platform

Avvai Iyarkai Agam is a full-stack, farm-to-table organic foods e-commerce and ERP/Inventory management system. Built with modern web technologies, it delivers a high-performance storefront and a comprehensive back-office ERP suite to manage operations, procurement, stock movements, and financial invoices.

---

## 🌟 Key Features

### 🛒 Premium E-Commerce Storefront
- **Responsive Catalogue**: Clean, warm, minimalist shopping experience optimized for organic foods, spices, millets, and cold-pressed oils.
- **Smart Shopping Cart**: Local cart state management with instant updates and seamless navigation.
- **Secure Payment Gateway**: Integrates Razorpay with support for online transactions and Cash on Delivery (COD).

### 💼 ERP & Admin Dashboard
- **Real-Time Analytics**: Visual reports on sales, orders, low-stock alerts, and key business metrics.
- **Granular Inventory System**: Tracks stock units (`GRAM`, `KILOGRAM`, `LITRE`, etc.) with automatic inventory movements (sale, purchase, adjustment, return, damage).
- **Procurement & Suppliers**: Full vendor directory with Purchase Order (PO) workflows from drafting to fulfillment.
- **Invoicing & PDF Generation**: Generates automated, secure PDFs using `@react-pdf/renderer` saved to cloud storage.
- **Notification Engine**: Transactional and automated newsletter dispatching via Nodemailer.
- **Customer Directory (CRM)**: Historical invoices, customer profiles, and GST tax tracking.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js v16](https://nextjs.org) (App Router), [React v19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [Framer Motion](https://www.framer.com/motion/) (animations)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Payment & Cloud Integration**: [Razorpay](https://razorpay.com/), [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- **Mailing**: [Nodemailer](https://nodemailer.com/)
- **Validation & Forms**: [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/)
- **Security**: [Jose](https://github.com/panva/jose) (JWT), `bcryptjs`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- PostgreSQL Database instance

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root directory and configure the environment variables:
```env
# Database Settings
DATABASE_URL="postgresql://username:password@localhost:5432/avvai_db?sslmode=require"

# Authentication
JWT_SECRET="your-jwt-secret-key"
ADMIN_EMAIL="admin@avvai.com"
ADMIN_PASSWORD="secure-password-here"

# Vercel Blob (for PDF & image uploads)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-read-write-token"

# Mail Configuration
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-app-password"

# Public Variables
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BRAND_NAME="Avvai"

# Razorpay Integration
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# Optional LLM Integration
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

### 3. Database Setup
Sync the database schema and seed the initial data:
```bash
# Push database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial store catalog and categories
npm run db:seed
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) for the ERP admin dashboard.

---

## 📂 Directory Structure

```text
├── prisma/               # Database schemas and seed data
├── public/               # Static assets & icons
└── src/
    ├── app/              # Next.js App Router (pages and API endpoints)
    │   ├── (admin)/      # ERP dashboard routes
    │   ├── (store)/      # E-Commerce client routes
    │   └── api/          # Backend JSON REST endpoints
    ├── components/       # Shared UI components (store, admin, shadcn ui)
    ├── lib/              # Client & server helpers (auth, email, pdf, razorpay)
    ├── store/            # Zustand global state (cart, ui)
    └── types/            # Global TypeScript definitions
```
