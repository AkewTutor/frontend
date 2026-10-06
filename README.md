# ⚛️ template-react

> **A production-ready React SPA starter built for serious applications.**
> Modern tooling, scalable architecture, and sensible defaults—so you can focus on building features instead of configuring infrastructure.

---

## ✨ Features

* ⚡ **Vite** for lightning-fast development and builds
* 🔷 **TypeScript** for type-safe development
* 🎨 **Tailwind CSS v4** with **shadcn/ui** and Radix UI primitives
* 🔄 **TanStack Query** for server-state management
* 🧠 **Zustand** for lightweight client-state management
* 🌐 **Axios** with centralized configuration and interceptors
* 🛣️ **React Router v7** with lazy-loaded routes
* 📝 **React Hook Form + Zod** for robust forms and validation
* 🧪 **Vitest + React Testing Library** for testing
* 🧹 **ESLint + Prettier + Husky + lint-staged** for consistent, automated code quality
* 📦 Opinionated folder structure designed for long-term scalability

---

# 🛠 Tech Stack

| Category      | Technology                     |
| ------------- | ------------------------------ |
| Build Tool    | Vite                           |
| Language      | TypeScript                     |
| Styling       | Tailwind CSS v4                |
| UI Components | shadcn/ui + Radix UI           |
| Routing       | React Router v7                |
| Server State  | TanStack Query                 |
| Client State  | Zustand                        |
| HTTP Client   | Axios                          |
| Forms         | React Hook Form                |
| Validation    | Zod                            |
| Testing       | Vitest + React Testing Library |
| Linting       | ESLint                         |
| Formatting    | Prettier                       |
| Git Hooks     | Husky + lint-staged            |

---

# 🚀 Perfect For

This template is designed specifically for authenticated Single Page Applications.

Ideal for:

* SaaS products
* Internal company tools
* Admin dashboards
* Analytics platforms
* CRM systems
* Data visualization applications
* Management portals

---

## ❌ Not Recommended For

Use another starter (such as a Next.js template) if your project requires:

* SEO
* Server-side rendering (SSR)
* Static site generation (SSG)
* Server Actions
* Public marketing websites

---

# 📦 Getting Started

## Prerequisites

* Node.js **20.x**

The repository includes an `.nvmrc` file.

---

## Installation

```bash
git clone <your-repository>

cd template-react

npm install

cp .env.example .env
```

---

## Configure Environment Variables

Edit your `.env` file.

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=MyApp
VITE_APP_ENV=development
```

All browser-exposed variables **must** begin with:

```
VITE_
```

Environment variables are validated using **Zod** during application startup.

---

## Start Development

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

# 📜 Available Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start Vite development server       |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview production build locally    |
| `npm run lint`    | Run ESLint                          |
| `npm run format`  | Format project with Prettier        |
| `npm run test`    | Run Vitest                          |

---

# 📁 Project Structure

```text
src/
├── assets/
│
├── components/
│   ├── ui/
│   ├── common/
│   └── layouts/
│
├── config/
│   └── env.ts
│
├── constants/
│
├── hooks/
│
├── lib/
│   ├── axios.ts
│   ├── queryClient.ts
│   └── utils.ts
│
├── pages/
│
├── routes/
│
├── store/
│
├── styles/
│
├── types/
│
├── utils/
│
├── App.tsx
└── main.tsx


tests/
├── setup.ts
├── index.test.tsx
└── ...
```

---

# 🏗 Architecture Principles

This template intentionally enforces a few rules to keep applications maintainable.

## 1. Use the configured Axios instance

✅ Correct

```ts
import axios from "@/lib/axios";
```

❌ Never

```ts
import axios from "axios";
```

The configured instance automatically handles:

* Authorization headers
* Request interceptors
* Response interceptors
* Global 401 handling

---

## 2. Never fetch data inside `useEffect`

Instead of

```tsx
useEffect(() => {
  fetchUsers();
}, []);
```

Use TanStack Query.

```tsx
const { data } = useQuery(...);
```

Benefits:

* Automatic caching
* Background refetching
* Loading states
* Error handling
* Cache invalidation
* Request deduplication

---

## 3. Never access `import.meta.env`

Always import:

```ts
import { env } from "@/config/env";
```

This guarantees all environment variables are validated before the application runs.

---

## 4. Separate Server State from Client State

### TanStack Query

Use for:

* Users
* Products
* Orders
* API responses
* Remote data

### Zustand

Use for:

* Authentication
* Theme
* Sidebar state
* Modal state
* UI preferences

A simple rule:

> **If it comes from your backend, use TanStack Query. If it belongs only to the UI, use Zustand.**

---

## 5. Mirror Test Structure

Every file inside `src` should have its equivalent test inside `tests`.

Example:

```text
src/hooks/useAuth.ts

↓

tests/hooks/useAuth.test.ts
```

---

# 🔐 Authentication Strategy

Authentication is handled using **Zustand Persist** with **localStorage**.

This approach is intentionally chosen because it is:

* Simple
* Reliable
* Standard for authenticated SPAs
* Easy to integrate with any backend

Trade-off:

Since tokens live in JavaScript-accessible storage, an XSS vulnerability could expose them.

Projects requiring stricter security should instead use:

* httpOnly cookies
* Backend-managed sessions
* CSRF protection

Those patterns require backend support and are intentionally outside the scope of this template.

---

# 🎨 Adding shadcn/ui Components

Components are copied directly into your project.

```bash
npx shadcn@latest add button
```

Multiple components:

```bash
npx shadcn@latest add input dialog sheet table
```

Because the source code is owned by your project, customization is simple.

---

# 🧪 Testing

Run the complete test suite:

```bash
npm run test
```

Technology stack:

* Vitest
* React Testing Library
* jsdom

Tests should mirror the source directory structure.

---

# 🚦 Routing & Code Splitting

Pages are lazy-loaded using:

* `React.lazy()`
* `Suspense`

This keeps the initial bundle small and improves loading performance as the application grows.

Every page component should use a **default export**.

---

# 🚫 Keep This Template Generic

This repository is intended to be cloned for future projects.

Avoid committing:

* Business logic
* Domain models
* Project-specific API endpoints
* Real authentication implementations
* Customer data
* Hardcoded application content

Infrastructure belongs here.

Business logic belongs in the cloned project.

---

# 💡 Design Philosophy

This template favors:

* Simplicity over cleverness
* Convention over configuration
* Scalability over shortcuts
* Readability over abstraction
* Explicit architecture over hidden magic

The goal is to provide a foundation that remains maintainable whether your application has **5 pages or 500**.

---

# 🤝 Contributing

Contributions are welcome.

If you find an issue or have an idea for improvement:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

# 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

### Built with ❤️ using React, TypeScript, and modern frontend tooling.

**Clone. Build. Ship.**

</div>
