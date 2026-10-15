# 🎓 DCC CSE — Dhaka City College Science and Engineering Student Academic Dashboard

[![Live Web App](https://img.shields.io/badge/Live_App-dcc--cse--25.vercel.app-0070f3?style=for-the-badge&logo=vercel&logoColor=white)](https://dcc-cse-25.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline_First-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://dcc-cse-25.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**DCC CSE** is an open-source academic management companion and resource portal built for **all students of Dhaka City College Department of Computer Science and Engineering (CSE)**.

Live Web App: **[https://dcc-cse-25.vercel.app/](https://dcc-cse-25.vercel.app/)**

> ℹ️ **Disclaimer:** DCC CSE is an independent open-source project developed by **Mehedi Hasan (Batch 25)** for the Dhaka City College CSE community. It is designed to assist all DCC CSE students across semesters with daily academic routines, attendance management, and study resources.

---

## 🚀 Key Features

| Feature Module | What It Does for DCC CSE Students |
|---|---|
| 🗓️ **Class Routine & Routine Planner** | Class schedules for Section A & Section B, lab group rotations (A1, A2, B1, B2), and personal daily habit checklists. |
| 📅 **Attendance Tracker** | Subject-wise attendance calculation strictly configured to National University Bangladesh regulations (75% collegiate, 60% non-collegiate alerts). |
| 📊 **National University CGPA / SGPA** | Credit-weighted GPA and cumulative CGPA calculator based on the official National University 4.00 grading scale across all 8 semesters. |
| 🎓 **Exam Routines & Seat Plan Finder** | Midterm and semester final timetables with room allocations and instant student roll seat search. |
| 📓 **DCC CSE Notes & Resources** | Centralized lecture notes, subject syllabi, assignments, and study materials for Dhaka City College CSE courses. |
| 🧪 **Lab Projects Repository** | Collaborative space for CSE programming assignments, lab reports, code links, and demo submissions. |
| 💳 **Semester Fees Tracker** | Manage tuition fees, semester exam fees, installment schedules, and payment history in BDT (৳). |
| ☁️ **Cloud Sync & Offline-First PWA** | Works 100% offline using IndexedDB (Dexie.js) and automatically synchronizes to cloud storage across desktop and mobile. |

---

## 🌐 Target Audience & Purpose

* **Institution:** Dhaka City College (DCC)
* **Department:** Computer Science & Engineering (CSE) / Science & Engineering
* **Audience:** All students of DCC CSE across all semesters (1st through 8th)
* **Developer:** Mehedi Hasan (Batch 25)
* **Goal:** Eliminate scattered spreadsheets and missed deadlines by giving every student a unified, offline-capable dashboard.

---

## 🔒 Privacy & Local-First Architecture

* **Zero Tracking of Academic Records:** All grades, attendance entries, personal routines, and fee notes are stored locally in the browser via **IndexedDB**.
* **Encrypted Cloud Sync:** When logged in, your device data securely synchronizes with your personal cloud account.
* **Full Data Ownership:** Export your entire dashboard data as a JSON backup anytime.

---

## 📱 How to Access DCC CSE

### 1. Web App
Visit **[https://dcc-cse-25.vercel.app/](https://dcc-cse-25.vercel.app/)** from any browser on phone, tablet, or PC.

### 2. Install as PWA (Recommended for Mobile)
1. Open [https://dcc-cse-25.vercel.app/](https://dcc-cse-25.vercel.app/) in Google Chrome or Safari.
2. Tap **"Install App"** or **"Add to Home Screen"**.
3. Launch directly from your home screen with instant loading and offline capability.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (App Router + Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4 + Radix / shadcn/ui
* **Local Database:** Dexie.js (IndexedDB)
* **Server Database:** Neon PostgreSQL
* **ORM:** Drizzle ORM
* **Deployment:** Vercel

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/MehediHasanTsx/Student-Academic-Dashboard.git
cd Student-Academic-Dashboard

# Install dependencies
bun install   # or npm install

# Start local development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 👨‍💻 Developer & Author

Built with ❤️ by **[Mehedi Hasan](https://api.whatsapp.com/send/?phone=8801521743944)** (Batch 25) for all Dhaka City College CSE students.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
