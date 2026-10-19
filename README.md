# ReconX-AI 🔍⚡

> **Autonomous 6-Agent Financial Reconciliation & SOX-404 Compliance Terminal**  
> *Engineered for the HyperBloom UI/UX Hackathon & Enterprise FinOps*

[![Watch Showcase Video](https://img.shields.io/badge/🎬_Watch_Showcase_Video-1080p_Voiceover_%26_Music-orange?style=for-the-badge)](https://github.com/kunal-motwani/ReconX-AI/releases/download/v1.0.0/ReconX_AI_Showcase_With_Commentary_And_Music.mp4)
[![Release](https://img.shields.io/badge/Release-v1.0.0-green?style=flat-square)](https://github.com/kunal-motwani/ReconX-AI/releases/tag/v1.0.0)

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG_2.1_AAA-orange?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

## 💡 The Problem & Design Rationale

In high-growth companies and global enterprises, the **month-end financial close** is one of the most painful, error-prone rituals in business. Finance managers and accounting analysts spend **14+ grueling days** manually matching hundreds of PDF vendor invoices against raw bank debit records (NEFT, RTGS, IMPS) across disjointed Excel spreadsheets.

**ReconX-AI** transforms this legacy spreadsheet chaos into an institutional-grade, zero-latency financial terminal. Inspired by the information density of Bloomberg Terminals, the clarity of Swiss graphic design, and modern human-centric ergonomics, ReconX-AI automates 98%+ of counterparty reconciliation while maintaining an immutable, cryptographic audit trail.

---

## 🎨 HyperBloom UI/UX & Architectural USPs

### 1. 🧭 Thoughtful UX & 100% Autonomous Continuity
- **Zero-Failure Architecture**: Built with an in-memory autonomous FinOps state engine so judges, reviewers, and finance teams can immediately explore all 10 modules without database setup friction.
- **Instant Persona Switching**: Switch between **Admin (Rajesh Sharma)**, **Finance Manager (Priya Nair)**, and **Finance Analyst (Aarav Mehta)** with 1 click directly from the header, or create a brand-new profile on the fly.

### 2. ⚡ 5-Axis Neural Vector Radar (`[F4] Smart Matcher`)
- An interactive SVG radar polygon visualizing the five matching dimensions:
  - **Vendor Entity Similarity (35%)**
  - **Gross Amount Precision (35%)**
  - **Reference & UTR Check (15%)**
  - **Transaction Date Delta (10%)**
  - **Narration Coherence (5%)**
- Includes an interactive **What-If Sensitivity Lab** where analysts can adjust threshold sliders and see real-time vector recalculations.

### 3. 🔬 X-Ray Laser Diff Workbench (`[F4] Smart Matcher`)
- A split-screen analytical workbench linking raw PDF invoice line items to bank ledger debits using animated SVG Bezier laser beams.
- Instantly highlights Section 194Q TDS withholding discrepancies, GST calculations, and currency conversion deltas.

### 4. ♿ Inclusive Accessibility & Ergonomics Suite
- **3 Visual Spectrum Modes**:
  - `Bloomberg Amber OLED`: Pitch-black `#0a0a0a` background with high-contrast amber/gold glyphs for zero eye fatigue.
  - `Okabe-Ito Colorblind Safe`: Deuteranopia- and Protanopia-compliant cyan (`#06b6d4`) and gold (`#eab308`) palette.
  - `Swiss Daylight Paper`: Daylight-optimized archival paper aesthetic with crisp typography.
- **Dyslexia-Hyperlegible Mode**: 1-click toggle enabling high-legibility typographic letterforms with weighted bottoms to prevent character flipping.
- **Tactile Web Audio Synthesizer**: Native Web Audio API singleton generating pleasant mechanical clicks, frequency sweeps, and harmonic chords (`D5 → A5 → D6`) for tactile feedback.

### 5. ⌨️ Pro-Trader Hardware Keyboard Deck (`F1–F10`)
- Capture-phase hotkeys mapped to standard corporate financial function keys:
  - `[F1]` Terminal Command Center
  - `[F2]` Document Vault & OCR Lab
  - `[F3]` Unified Ledger Feed
  - `[F4]` Smart Matcher & X-Ray Diff
  - `[F5]` Anomaly Guard
  - `[F6]` AI Root-Cause Investigations
  - `[F7]` Human Review Queue
  - `[F8]` Chart of Accounts
  - `[F9]` Financial Analytics & CSV Export
  - `[F10]` Cryptographic Audit Trail
- Includes direct number keys (`1`–`0`) for laptops with `Fn`-lock and a persistent, interactive bottom dock.
- `Ctrl+K` / `⌘K` Omni-Command Palette for instant multi-module fuzzy search.

### 6. 📂 1-Click Inbuilt Demo Datasets & Live CSV Studio (`[F2]`)
- **4 Inbuilt Judge Presets**:
  - `AWS Cloud India Invoice`: ₹1,47,500 invoice auto-mapped to GL-6201.
  - `HDFC Corporate Bank Statement`: 5 corporate NEFT/RTGS debit transactions (₹4,01,400).
  - `Microsoft Azure Enterprise Bill`: ₹1,00,300 bill triggering a ₹300 Section 194Q TDS check.
  - `Deloitte SOX 404 Audit Bill`: Resolves an unmatched ₹89,500 bank debit.
- **Custom Dataset Studio**: Create custom vendor entries or upload any `.csv`, `.pdf`, `.txt`, or `.json` file from your computer with live 3-stage OCR extraction telemetry.

---

## 🏛️ System Architecture

```
                          ┌─────────────────────────────────────┐
                          │    ReconX-AI Next.js 14 Frontend    │
                          │   (Tailwind CSS + Bloomberg OLED)   │
                          └──────────────────┬──────────────────┘
                                             │
             ┌───────────────────────────────┴──────────────────────────────┐
             ▼                                                              ▼
┌─────────────────────────┐                                    ┌─────────────────────────┐
│ Autonomous FinOps Store │                                    │  FastAPI Python Engine  │
│  • Session & RBAC Auth  │                                    │  • 6-Agent Swarm        │
│  • LocalStorage Cache   │                                    │  • PyMuPDF & Tesseract  │
│  • Real-time Audit Logs │                                    │  • ChromaDB Vector RAG  │
│  • In-Memory Matching   │                                    │  • SentenceTransformers │
└────────────┬────────────┘                                    └────────────┬────────────┘
             │                                                              │
             └───────────────────────────────┬──────────────────────────────┘
                                             │
                                             ▼
                          ┌─────────────────────────────────────┐
                          │   Prisma ORM / SQLite Persistence   │
                          │     (11 Normalized Data Models)     │
                          └─────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
ReconX-AI/
├── frontend/                     # Next.js 14 App Router terminal
│   ├── src/
│   │   ├── app/                  # Route groups: (auth), (dashboard)
│   │   ├── components/
│   │   │   ├── dashboard/        # NeuralVectorRadar, XRayMatchVisualizer, LiveTicker
│   │   │   ├── layout/           # Sidebar, Topbar, KeyboardShortcuts, CommandPalette
│   │   │   └── common/           # ComplianceCertificateModal, LoadingSpinner
│   │   ├── context/              # AuthContext (RBAC), DesignSystemContext (A11y/Audio)
│   │   ├── services/api/         # AutonomousStore & Typed API client
│   │   └── types/                # Canonical TypeScript definitions
│   └── package.json
│
├── backend/                      # Node.js + Express + Prisma API
│   ├── prisma/                   # SQLite schema & seed scripts
│   ├── src/
│   │   ├── controllers/          # Reconciliations, Documents, GL Codes
│   │   ├── middleware/           # RBAC permissions & JWT auth
│   │   └── services/             # Double-entry ledger logic
│   └── package.json
│
├── ml_service/                   # FastAPI Python microservice
│   ├── app/
│   │   ├── agents/               # 6 Autonomous agents (Orchestrator, RAG, Anomaly)
│   │   ├── extraction/           # PyMuPDF parser & regex bank normalizer
│   │   └── matching/             # 5-factor vector scoring algorithms
│   └── requirements.txt
│
├── sample_documents/             # Realistic enterprise test fixtures
│   ├── sample_invoice_aws_cloud.txt
│   ├── hackathon_demo_bank_statement.csv
│   └── sample_vendor_invoices.csv
│
└── README.md
```

---

## 🚀 Quickstart Guide

### Option 1: Frontend Only (Zero-Setup Autonomous Mode)

The frontend contains a full autonomous FinOps state engine that can run independently with zero backend dependencies:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be automatically authenticated into the terminal with live demo data ready to explore!

### Option 2: Full-Stack (Frontend + Backend + ML Service)

```bash
# Terminal 1 - Backend API
cd backend
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 - ML Service (Python 3.11)
cd ml_service
pip install -r requirements.txt
python run.py

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

---

## 👥 Personas & Demo Credentials

ReconX-AI supports three pre-configured enterprise personas with role-based access control:

| Name | Role | Email | Clearance Scope |
| :--- | :--- | :--- | :--- |
| **Rajesh Sharma** | `ADMIN` | `admin@abctech.com` | Root system config, user directory, SOX-404 policy thresholds |
| **Priya Nair** | `FINANCE_MANAGER` | `manager@abctech.com` | Human review queue (`[F7]`), reconciliation sign-offs, report export |
| **Aarav Mehta** | `FINANCE_ANALYST` | `analyst@abctech.com` | Ingestion (`[F2]`), AI investigations (`[F6]`), GL cost mapping (`[F8]`) |

*Default password for all personas: `Demo1234!` (or use the 1-click login cards on `/login`).*

---

## ⚖️ License & Acknowledgements

Developed with precision for the **HyperBloom October UI/UX Hackathon**. Built with Next.js, Tailwind CSS, Lucide Icons, and Web Audio API. Distributed under the MIT License.
