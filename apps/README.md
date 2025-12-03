# Authenticas Frontend Applications

This directory contains three React dashboards for the Authenticas B2B authentication system.

## Applications

| App | Port | Description |
|-----|------|-------------|
| **Admin** | 5173 | System administration - manage all companies and users |
| **Retailer** | 5174 | Retailer portal - view transactions, configure webhooks, test purchases |
| **Company** | 5175 | Company portal - manage team members and spending limits |

## Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on http://localhost:3000

### Install Dependencies

```bash
# Install shared library
cd apps/shared && npm install

# Install each app
cd apps/admin && npm install
cd apps/retailer && npm install
cd apps/company && npm install
```

### Run Development Servers

```bash
# Terminal 1 - Admin Dashboard
cd apps/admin && npm run dev

# Terminal 2 - Retailer Dashboard  
cd apps/retailer && npm run dev

# Terminal 3 - Company Dashboard
cd apps/company && npm run dev
```

### Access Dashboards

- **Admin**: http://localhost:5173
- **Retailer**: http://localhost:5174
- **Company**: http://localhost:5175

## Test Credentials

All dashboards use the same authentication system:

- **Admin User**: `admin@acme.com` / `admin123`
- **Regular User**: `john.doe@acme.com` / `user123`

## Architecture

```
apps/
├── shared/           # Shared UI component library
│   └── src/
│       ├── components/   # Button, Input, Card, Table, Modal, etc.
│       ├── hooks/        # useAuth
│       ├── utils/        # API client, formatters
│       ├── types/        # TypeScript interfaces
│       └── styles/       # Global CSS design system
│
├── admin/            # Admin Dashboard
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Companies.tsx
│       │   ├── Users.tsx
│       │   └── Audit.tsx
│       └── components/
│           └── Layout.tsx
│
├── retailer/         # Retailer Dashboard
│   └── src/
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Transactions.tsx
│       │   ├── Webhooks.tsx
│       │   └── TestPurchase.tsx
│       └── components/
│           └── Layout.tsx
│
└── company/          # Company Dashboard
    └── src/
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Users.tsx
        │   ├── Transactions.tsx
        │   └── SpendingLimits.tsx
        └── components/
            └── Layout.tsx
```

## Features by Dashboard

### Admin Dashboard
- View system-wide statistics
- Create and manage companies
- Regenerate API keys
- Create and manage all users
- View complete audit trail

### Retailer Dashboard
- View transaction statistics
- Browse transaction history
- Configure webhook URLs
- Test purchase verification

### Company Dashboard
- View company statistics
- Invite team members
- Manage spending limits
- View company transactions

## Design System

The shared library provides a cohesive dark theme with:

- **Typography**: DM Sans + JetBrains Mono
- **Color Palette**: Dark background with accent colors
  - Admin: Purple (#8b5cf6)
  - Retailer: Cyan (#22d3ee)
  - Company: Emerald (#10b981)
- **Components**: Button, Input, Select, Card, Table, Modal, Badge, Stat, Toast, Spinner

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: CSS Modules + CSS Custom Properties
