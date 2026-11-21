# CivicResolve — AI-Powered Civic Issue Reporting & Management

**CivicResolve** is a civic-tech SaaS platform built for a Google Hackathon that bridges the gap between citizens and municipal authorities. By leveraging **Google Gemini AI**, the platform automatically triages citizen complaints (potholes, garbage overflow, streetlight failures, water main leaks, drainage collapses), evaluates public safety hazards, and dispatches actionable work orders to responsible municipal engineering teams with live, transparent tracking.

---

## 🌟 Key Features

1. **AI-Powered Grievance Triage (Google Gemini 1.5 Flash)**
   - Automatic classification into civic infrastructure domains (Roads, Waste, Lighting, Water, Drainage).
   - Real-time hazard detection and urgency rating ($1$ to $10$).
   - Automated routing to responsible municipal department.
   - Recommended field action checklist for municipal crews.
   - Live AI preview as the citizen types their grievance.

2. **Citizen Portal**
   - Overview metrics of local ward issues (Total, Pending, In Progress, Resolved).
   - Frictionless issue filing with photo evidence and browser geolocation assistance.
   - Status tracking with immutable timestamps and SLA targets.

3. **Public Audit & Tracking Ledger**
   - Instant search by unique Complaint ID (e.g. `CR-2025-1042`).
   - Interactive 3-stage lifecycle progression: **Reported → In Progress → Resolved**.
   - Chronological audit trail showing actor roles (`citizen`, `ai_system`, `officer`, `field_worker`).

4. **Municipal Command Dashboard (Admin)**
   - Live queue of active ward work orders.
   - Multi-dimensional filters (Category, Priority, Status, Search).
   - Work order inspection and status update controls with official engineer notes.
   - One-click CSV export for municipal audits.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Deep navy, clean typography with Inter, subtle civic shadows)
- **Icons**: Lucide React
- **AI Engine**: `@google/generative-ai` (Google Gemini 1.5 Flash) with resilient offline heuristic fallback
- **Backend & Cloud**:
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage
  - Firebase Hosting
- **Testing**: Vitest + React Testing Library + Jest-DOM

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your credentials:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Note**: Even if Firebase or Gemini API keys are omitted during evaluation, CivicResolve includes a fully-functional local persistence layer and a deterministic civic rule engine. Everything works out-of-the-box!

### 4. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests
```bash
npm test
```

### 6. Production Build
```bash
npm run build
```

---

## 🏛️ Architecture & Folder Structure

```
CivicResolve/
├── firestore.rules          # Production-grade Firestore security rules
├── storage.rules            # Firebase Storage file validation rules
├── firebase.json            # Firebase Hosting & emulator configurations
├── src/
│   ├── types/               # TypeScript interfaces & domain models
│   ├── services/
│   │   ├── firebase.ts      # Firebase SDK client initialization
│   │   ├── geminiService.ts # Google Gemini AI & heuristic fallback engine
│   │   ├── complaintService.ts # Dual-mode Firestore + localStorage service
│   │   └── mockData.ts      # Seed civic complaints
│   ├── context/
│   │   ├── AuthContext.tsx  # Citizen / Municipal Officer authentication
│   │   └── ComplaintContext.tsx # Central grievance state & filters
│   ├── components/
│   │   ├── layout/          # Navbar, Footer, Shell Layout
│   │   ├── ui/              # Button, Card, Badge, Modal
│   │   └── complaints/      # StatusTimeline, AIAnalysisCard, ComplaintCard, ComplaintTable
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── CitizenDashboard.tsx
│   │   ├── ReportIssuePage.tsx
│   │   ├── ComplaintTrackingPage.tsx
│   │   └── AdminDashboard.tsx
│   ├── test/                # Unit & component test suites
│   ├── App.tsx              # React Router v6 routing table
│   └── main.tsx             # Application bootstrap
```
