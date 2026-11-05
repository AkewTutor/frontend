<div align="center">

# AkewTutor · Frontend

**The student, parent, tutor, and admin experience.**

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)

[Frontend](https://github.com/AkewTutor/frontend) · [Backend](https://github.com/AkewTutor/backend) · [Documentation](https://github.com/AkewTutor/docs)

</div>

---

## Overview

AkewTutor helps Ethiopian students find tutoring support and manage their lessons. This repository contains the React web application, including the public website and the student, parent, tutor, and admin workspaces.

## Video demonstration

[▶ Watch the project demonstration](https://drive.google.com/file/d/1NmXntF1y_rfFZGA31UptuXilovjBzdal/view?usp=sharing)
## Application features

| Workspace | Main screens |
| :--- | :--- |
| **Public and authentication** | Landing page, registration, verification, sign-in, password recovery, and policies. |
| **Student** | Academic profile, tutor search and recommendations, group status, classes, progress, and achievements. |
| **Parent** | Student account creation, guardianship settings, and child-scoped billing and resources. |
| **Tutor** | Teaching profile, subjects, availability, classes, assessments, session misses, and earnings. |
| **Admin** | Tutor verification, matching, people, pricing, payouts, disputes, and reports. |
| **Shared** | Messages, library, notifications, payment history, complaints, and support. |

## Technology

- **React + TypeScript** for the application.
- **Vite** for development and production builds.
- **React Router** for navigation and role-guarded routes.
- **Tailwind CSS, Radix UI, and shadcn/ui** for interface components.
- **TanStack Query, Axios, and Zustand** for server data, API calls, and session state.
- **React Hook Form + Zod** for forms and validation.
- **Vitest + React Testing Library** for tests.

## Run locally

Use **Node.js 22.12 or newer in the Node 22 line**, npm, and a running AkewTutor API. If your Node manager follows the repository’s `.nvmrc`, it selects Node 20. Use at least **20.19** on that line for Vite compatibility.

```bash
git clone https://github.com/AkewTutor/frontend.git
cd frontend
npm ci
cp .env.example .env
```

Set these values in `.env`:

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=AkewTutor
VITE_APP_ENV=development
```

Start the app:

```bash
npm run dev
```

Open the local URL printed by Vite, usually **http://localhost:5173**. Start the backend separately using its README.

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start the development server. |
| `npm run build` | Type-check and create a production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm test -- --run` | Run the test suite once. |
| `npm run lint` | Run ESLint. |
| `npm run format` | Format the project. |

## Code layout

```text
src/
├── components/  # Shared UI and feature components
├── pages/       # Public and role-specific screens
├── routes/      # Route definitions and access guards
├── hooks/       # Data queries and mutations
├── lib/         # API client and shared utilities
├── store/       # Client-side state
├── styles/      # Global styles and design tokens
└── types/       # Shared TypeScript interfaces
tests/           # Component, hook, and page tests
```

## Development status

The app is under active development. Feature availability depends on the checked-out branch and backend configuration. The recorded demonstration uses seeded data and simulated providers. Intended behavior and API contracts are maintained in the [documentation repository](https://github.com/AkewTutor/docs).

## Developer

AkewTutor is an individual project designed and developed by **Adonay Chilotu**.

| Full name | CTC ID |
| :--- | :--- |
| Adonay Chilotu | **CTC-1611-26** |
