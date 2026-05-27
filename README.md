# AnesthesiApp-v3

AnesthesiApp is a premium, modern web application designed for anesthesiologists to streamline case logs, practice CBT (Computer-Based Test) exams, and participate in collaborative learning through a dedicated Community Hub.

---

## 🛠️ Development & Coding
This project is actively developed and pair-programmed using **Antigravity** (a powerful agentic AI coding assistant designed by Google DeepMind).

- **Codebase Management**: Stored and managed securely on [GitHub](https://github.com/arlantictailscale/AnesthesiApp-v3).
- **Deployment**: Deployed on a Virtual Private Server (VPS) and orchestrated via **[Dokploy](https://dokploy.com)** (a self-hosted PaaS platform).

---

## 🚀 Key Features

* **CBT Prep Simulator**: Simulate National Examination time-boxed tests with realistic simulation layouts.
* **Collaborative Community Hub**: Share custom question packages, rate community creations, and engage in peer-to-peer discussions on difficult questions.
* **AI-Powered Question Generation**: Dynamically generate study packages tailored to specific anesthesiology subspecialties via AI.
* **Subspecialty Breakdown**: Track candidate performance across 10 distinct subspecialties including Obstetrik, Pediatrik, Neuroanestesi, Kardiovaskular, and Pain Management.
* **Case Logs & Dashboard**: Keep track of clinical cases and performance statistics.

---

## 💻 Tech Stack

* **Frontend Framework**: Next.js (App Router, Tailwind CSS, Vanilla CSS)
* **Icons & UI Details**: Lucide React, Sonner
* **Database & Auth**: Supabase (PostgreSQL, Realtime, Storage, and Row Level Security)
* **Development Partner**: Antigravity AI
* **Hosting PaaS**: Dokploy on VPS

---

## 🏁 Getting Started

First, ensure you have your Supabase environment variables configured, then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

You can edit pages starting with `app/page.tsx`. The site hot-reloads automatically as you save.
