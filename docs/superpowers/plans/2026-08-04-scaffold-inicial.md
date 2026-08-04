# Scaffold Inicial — Diari de lectura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the "Diari de lectura" project: a working Next.js app with Prisma/Supabase data layer and full login flow (email/password + Google), ending at a protected placeholder dashboard — no book-management screens yet.

**Architecture:** Next.js App Router app generated with `create-next-app`, Prisma ORM against Supabase Postgres, Supabase Auth (via `@supabase/ssr`) for session management with three client variants (browser, server, middleware), and a one-time onboarding step that creates the app-level `Usuari` row on first login.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, Prisma, Supabase (Postgres + Auth), npm, git/GitHub.

## Global Constraints

- Package manager: npm only (spec decision).
- Language: TypeScript everywhere, App Router (`src/app`), no Pages Router.
- Styling: Tailwind CSS only, no CSS Modules.
- Auth providers in this phase: email/password and Google only — no GitHub/Microsoft.
- No test framework is introduced in this plan (deferred to first real feature, per spec).
- No advanced error handling (retries, external logging) — simple inline error messages only.
- Every task ends in its own git commit ("un pas = un diff").
- Local git identity for this repo: `user.name = "Toni Vila"`, `user.email = "avila@digiteix.com"` (already configured, repo-local only).

---

## File Structure

```
readOmetre/
├── prisma/
│   └── schema.prisma              # Usuari, Book, ReadingEntry, ReadingStatus enum
├── src/
│   ├── app/
│   │   ├── page.tsx                # Public home page
│   │   ├── login/page.tsx          # Login form (client component)
│   │   ├── login/actions.ts        # Server Action: login()
│   │   ├── signup/page.tsx         # Signup form (client component)
│   │   ├── signup/actions.ts       # Server Action: signup()
│   │   ├── onboarding/page.tsx     # Complete-profile form
│   │   ├── onboarding/actions.ts   # Server Action: completeProfile()
│   │   ├── dashboard/page.tsx      # Protected placeholder + logout
│   │   ├── dashboard/actions.ts    # Server Action: logout()
│   │   └── auth/callback/route.ts  # OAuth + email-confirm callback
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # createClient() — browser
│   │   │   ├── server.ts           # createClient() — Server Components/Actions/Route Handlers
│   │   │   └── middleware.ts       # updateSession(request) — session refresh + route guard
│   │   └── prisma.ts               # Shared PrismaClient singleton
│   └── middleware.ts               # Next.js middleware entrypoint
├── .env.example                    # Documented env vars (committed)
└── .env.local                      # Real secrets (gitignored, created manually)
```

---

### Task 1: Bootstrap the Next.js project

**Files:**
- Create: entire `create-next-app` output (`src/app/*`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts`, `.eslintrc*`/`eslint.config.*`, `postcss.config.*`, `.gitignore`, `next-env.d.ts`)

**Interfaces:**
- Produces: a running Next.js dev server at `http://localhost:3000` with the default starter page at `src/app/page.tsx` (replaced in Task 12).

The project root already has `claude.md`, `.claude/`, `.agents/`, `docs/`, `skills-lock.json`, and an initialized git repo — `create-next-app` refuses to run in a non-empty directory with unrecognized files, so we scaffold into a temp folder and merge.

- [ ] **Step 1: Scaffold into a temporary folder**

```bash
cd "E:/Projectes/readOmetre"
npx create-next-app@latest tmp-scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

- [ ] **Step 2: Merge generated files into the project root**

```bash
cd "E:/Projectes/readOmetre"
mv tmp-scaffold/src tmp-scaffold/public tmp-scaffold/package.json tmp-scaffold/package-lock.json \
   tmp-scaffold/tsconfig.json tmp-scaffold/next.config.ts tmp-scaffold/next-env.d.ts \
   tmp-scaffold/postcss.config.mjs tmp-scaffold/eslint.config.mjs .
cat tmp-scaffold/.gitignore >> .gitignore
sort -u .gitignore -o .gitignore
rm -rf tmp-scaffold
```

Note: exact file list (e.g. `eslint.config.mjs` vs `.eslintrc.json`, presence of `tailwind.config.ts`) depends on the installed `create-next-app` version — move whatever it generated, adjusting file names as needed.

- [ ] **Step 3: Verify the dev server runs**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` with no errors. Open it in a browser and confirm the default Next.js starter page renders. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add -A
git -c safe.directory="E:/Projectes/readOmetre" commit -m "chore: bootstrap Next.js app with create-next-app"
```

---

### Task 2: Create the Supabase project and capture credentials

**Files:**
- Create: `.env.example`, `.env.local`

**Interfaces:**
- Produces: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL` — consumed by Tasks 3, 5.

This task is manual (Supabase dashboard), guided step by step.

- [ ] **Step 1: Create the Supabase project**

Go to https://supabase.com/dashboard, sign in with your existing account, click "New project". Name it e.g. `diari-de-lectura`, choose a region close to you, set a strong database password (save it — you'll need it below), and wait for provisioning to finish (~2 min).

- [ ] **Step 2: Collect API credentials**

In the project dashboard: **Project Settings → API**. Copy:
- `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 3: Collect database connection strings**

In **Project Settings → Database → Connection string**, select the "URI" tab:
- Copy the **Transaction pooler** (port 6543) URI → this is `DATABASE_URL`; append `?pgbouncer=true` to the end if not already present.
- Copy the **Session pooler / Direct connection** (port 5432) URI → this is `DIRECT_URL`.

Replace `[YOUR-PASSWORD]` in both with the database password from Step 1.

- [ ] **Step 4: Write `.env.example` (committed, no secrets)**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
```

- [ ] **Step 5: Write `.env.local` (gitignored, real values)**

Create `.env.local` with the same four keys filled in with the real values from Steps 2–3. Confirm `.env.local` is listed in `.gitignore` (it is, by default from `create-next-app`).

- [ ] **Step 6: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add .env.example
git -c safe.directory="E:/Projectes/readOmetre" commit -m "chore: add env var template for Supabase credentials"
```

---

### Task 3: Define the Prisma schema and run the first migration

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (adds `prisma`, `@prisma/client` dependencies)

**Interfaces:**
- Produces: `Usuari`, `Book`, `ReadingEntry`, `ReadingStatus` Prisma models — consumed by Task 4 (`prisma.ts`), Task 9 (onboarding), Task 12 (dashboard).

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write the schema**

Replace the generated `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Usuari {
  id             String         @id
  nom            String
  cognom         String
  email          String         @unique
  edat           Int
  createdAt      DateTime       @default(now())
  readingEntries ReadingEntry[]
}

model Book {
  id             String         @id @default(uuid())
  title          String
  author         String
  genre          String?
  pageCount      Int?
  readingEntries ReadingEntry[]
}

enum ReadingStatus {
  reading
  finished
  abandoned
}

model ReadingEntry {
  id        String        @id @default(uuid())
  bookId    String
  book      Book          @relation(fields: [bookId], references: [id])
  usuariId  String
  usuari    Usuari        @relation(fields: [usuariId], references: [id])
  startDate DateTime
  endDate   DateTime?
  status    ReadingStatus
  rating    Int?
  notes     String?
}
```

`Usuari.id` is not auto-generated: it will be set to the Supabase Auth user's UUID when the profile is created in Task 9, so the two records share the same identity.

- [ ] **Step 3: Run the migration**

```bash
npx prisma migrate dev --name init
```

Expected: command succeeds, prints "Your database is now in sync with your schema", and creates `prisma/migrations/<timestamp>_init/`.

- [ ] **Step 4: Verify in Supabase**

In the Supabase dashboard, **Table Editor**, confirm the `Usuari`, `Book`, `ReadingEntry` tables exist with the expected columns.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add prisma package.json package-lock.json
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add Prisma schema for Usuari, Book, ReadingEntry"
```

---

### Task 4: Prisma client singleton

**Files:**
- Create: `src/lib/prisma.ts`

**Interfaces:**
- Consumes: `PrismaClient` from `@prisma/client` (Task 3).
- Produces: `prisma` (named export, `PrismaClient` instance) — consumed by Tasks 9, 12.

- [ ] **Step 1: Write the singleton**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

This avoids exhausting database connections from hot-reload creating a new `PrismaClient` on every file change in dev.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/lib/prisma.ts
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add Prisma client singleton"
```

---

### Task 5: Supabase browser and server clients

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

**Interfaces:**
- Produces: `createClient()` (browser, sync) from `src/lib/supabase/client.ts`; `createClient()` (server, async) from `src/lib/supabase/server.ts` — consumed by Tasks 6–9, 12.

- [ ] **Step 1: Install packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Write the browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Write the server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no request context to write to —
            // safe to ignore because middleware refreshes the session on navigation.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/lib/supabase/client.ts src/lib/supabase/server.ts package.json package-lock.json
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add Supabase browser and server clients"
```

---

### Task 6: Middleware — session refresh and route protection

**Files:**
- Create: `src/lib/supabase/middleware.ts`, `src/middleware.ts`

**Interfaces:**
- Consumes: `createServerClient` from `@supabase/ssr` (own instance, not `lib/supabase/server.ts` — middleware needs request/response-bound cookies, not `next/headers`).
- Produces: `updateSession(request: NextRequest): Promise<NextResponse>` from `src/lib/supabase/middleware.ts` — consumed by `src/middleware.ts`.

- [ ] **Step 1: Write `updateSession`**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/onboarding"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
```

- [ ] **Step 2: Wire up the middleware entrypoint**

```typescript
// src/middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual check — protected route redirects**

```bash
npm run dev
```

In a browser (no session), visit `http://localhost:3000/dashboard`. Expected: redirected to `/login` (which is still the default page until Task 7 — a 404 there is fine, the redirect itself is what we're checking). Stop the server.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/lib/supabase/middleware.ts src/middleware.ts
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add middleware for session refresh and route protection"
```

---

### Task 7: Login page

**Files:**
- Create: `src/app/login/actions.ts`, `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 5), `prisma` from `@/lib/prisma` (Task 4).
- Produces: `login(formData: FormData): Promise<{ error: string } | never>` (redirects on success) — used only by this page's form.

- [ ] **Step 1: Write the login Server Action**

```typescript
// src/app/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Email o contrasenya incorrectes." };
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: data.user.id } });
  redirect(usuari ? "/dashboard" : "/onboarding");
}
```

- [ ] **Step 2: Write the login page**

```typescript
// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { login } from "./actions";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) setError(result.error);
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Inicia sessió</h1>
      <form action={handleSubmit} className="space-y-4">
        <input name="email" type="email" placeholder="Email" required className="w-full border p-2" />
        <input name="password" type="password" placeholder="Contrasenya" required className="w-full border p-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-black p-2 text-white">
          Entra
        </button>
      </form>
      <button onClick={handleGoogleLogin} className="w-full border p-2">
        Continua amb Google
      </button>
      <p className="text-sm">
        No tens compte? <a href="/signup" className="underline">Registra&apos;t</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Verify it compiles and renders**

```bash
npx tsc --noEmit
npm run dev
```

Visit `http://localhost:3000/login`. Expected: form renders, submitting with a bogus email/password shows "Email o contrasenya incorrectes." with no crash. Stop the server.

- [ ] **Step 4: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/app/login
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add login page with email/password and Google"
```

---

### Task 8: Signup page

**Files:**
- Create: `src/app/signup/actions.ts`, `src/app/signup/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 5).
- Produces: `signup(formData: FormData): Promise<{ error?: string; success?: boolean }>` — used only by this page's form.

- [ ] **Step 1: Write the signup Server Action**

```typescript
// src/app/signup/actions.ts
"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: "No s'ha pogut crear el compte. Torna-ho a provar." };
  }

  return { success: true };
}
```

- [ ] **Step 2: Write the signup page**

```typescript
// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { signup } from "./actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await signup(formData);
    if (result?.error) setError(result.error);
    if (result?.success) setSuccess(true);
  }

  if (success) {
    return (
      <main className="mx-auto mt-20 max-w-sm">
        <p>Revisa el teu email per confirmar el compte.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Crea un compte</h1>
      <form action={handleSubmit} className="space-y-4">
        <input name="email" type="email" placeholder="Email" required className="w-full border p-2" />
        <input name="password" type="password" placeholder="Contrasenya" required minLength={6} className="w-full border p-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-black p-2 text-white">
          Registra&apos;t
        </button>
      </form>
      <p className="text-sm">
        Ja tens compte? <a href="/login" className="underline">Inicia sessió</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Verify it compiles and renders**

```bash
npx tsc --noEmit
npm run dev
```

Visit `http://localhost:3000/signup`, submit with a real email you can check and a password. Expected: "Revisa el teu email..." message appears, and a confirmation email arrives from Supabase. Stop the server.

- [ ] **Step 4: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/app/signup
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add signup page with email verification"
```

---

### Task 9: Auth callback route

**Files:**
- Create: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 5), `prisma` from `@/lib/prisma` (Task 4).
- Produces: `GET` handler at `/auth/callback` — target of `emailRedirectTo` (Task 8) and OAuth `redirectTo` (Task 7).

- [ ] **Step 1: Write the route handler**

```typescript
// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: data.user.id } });
  return NextResponse.redirect(`${origin}${usuari ? "/dashboard" : "/onboarding"}`);
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/app/auth
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add auth callback route for OAuth and email confirmation"
```

---

### Task 10: Configure Google OAuth provider

**Files:** None (external configuration only, in Google Cloud Console and Supabase dashboard).

- [ ] **Step 1: Create Google OAuth credentials**

In https://console.cloud.google.com: create (or reuse) a project, go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**, application type "Web application". Add authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback` (found in Supabase **Authentication → Providers → Google**, which shows the exact callback URL to paste). Copy the generated **Client ID** and **Client Secret**.

- [ ] **Step 2: Enable the provider in Supabase**

In the Supabase dashboard, **Authentication → Providers → Google**, toggle it on, paste the Client ID and Client Secret from Step 1, save.

- [ ] **Step 3: Verify end-to-end**

```bash
npm run dev
```

Visit `http://localhost:3000/login`, click "Continua amb Google", complete the Google consent screen. Expected: redirected back through `/auth/callback` to `/onboarding` (first time) with no errors. Stop the server.

(No commit — no files changed in this task.)

---

### Task 11: Onboarding page

**Files:**
- Create: `src/app/onboarding/actions.ts`, `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 5), `prisma` from `@/lib/prisma` (Task 4).
- Produces: `completeProfile(formData: FormData): Promise<{ error: string } | never>` (redirects on success) — used only by this page's form.

- [ ] **Step 1: Write the Server Action**

```typescript
// src/app/onboarding/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nom = formData.get("nom") as string;
  const cognom = formData.get("cognom") as string;
  const edat = Number(formData.get("edat"));

  if (!nom || !cognom || !edat) {
    return { error: "Omple tots els camps." };
  }

  await prisma.usuari.create({
    data: {
      id: user.id,
      nom,
      cognom,
      email: user.email!,
      edat,
    },
  });

  redirect("/dashboard");
}
```

- [ ] **Step 2: Write the page**

```typescript
// src/app/onboarding/page.tsx
"use client";

import { useState } from "react";
import { completeProfile } from "./actions";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await completeProfile(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Completa el teu perfil</h1>
      <form action={handleSubmit} className="space-y-4">
        <input name="nom" placeholder="Nom" required className="w-full border p-2" />
        <input name="cognom" placeholder="Cognom" required className="w-full border p-2" />
        <input name="edat" type="number" placeholder="Edat" required min={1} className="w-full border p-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-black p-2 text-white">
          Guarda i continua
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. (Full manual verification of this page happens in Task 13's end-to-end walkthrough, since it requires a live session.)

- [ ] **Step 4: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/app/onboarding
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add onboarding page to complete user profile"
```

---

### Task 12: Dashboard and home page

**Files:**
- Create: `src/app/dashboard/actions.ts`, `src/app/dashboard/page.tsx`
- Modify: `src/app/page.tsx` (replace `create-next-app` starter content)

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server` (Task 5), `prisma` from `@/lib/prisma` (Task 4).
- Produces: `logout(): Promise<never>` (redirects) — used only by the dashboard page.

- [ ] **Step 1: Write the logout Server Action**

```typescript
// src/app/dashboard/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Write the dashboard page**

```typescript
// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: user.id } });

  if (!usuari) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Benvingut, {usuari.nom}</h1>
      <p className="text-sm text-gray-600">
        Aquí aniran els teus llibres i estadístiques (properament).
      </p>
      <form action={logout}>
        <button type="submit" className="border p-2">
          Tanca sessió
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Replace the home page**

```typescript
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6 text-center">
      <h1 className="text-3xl font-bold">Diari de lectura</h1>
      <p className="text-gray-600">Registra els llibres que llegeixes i segueix el teu hàbit lector.</p>
      <div className="flex justify-center gap-4">
        <a href="/login" className="border p-2">Inicia sessió</a>
        <a href="/signup" className="bg-black p-2 text-white">Registra&apos;t</a>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -c safe.directory="E:/Projectes/readOmetre" add src/app/dashboard src/app/page.tsx
git -c safe.directory="E:/Projectes/readOmetre" commit -m "feat: add protected dashboard and public home page"
```

---

### Task 13: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Full signup → onboarding → dashboard flow**

```bash
npm run dev
```

1. Visit `http://localhost:3000/`, click "Registra't".
2. Sign up with a real email + password. Confirm the "revisa el teu email" message appears.
3. Open the confirmation email, click the link. Expected: lands on `/onboarding`.
4. Fill in Nom/Cognom/Edat, submit. Expected: redirected to `/dashboard`, shows "Benvingut, <nom>".

- [ ] **Step 2: Logout and re-login**

1. Click "Tanca sessió". Expected: redirected to `/login`.
2. Log back in with the same email/password. Expected: redirected straight to `/dashboard` (onboarding skipped, since `Usuari` already exists).

- [ ] **Step 3: Google login flow**

1. Log out. On `/login`, click "Continua amb Google" with a *different* Google account than the one used above.
2. Complete the Google consent screen. Expected: redirected to `/onboarding` (first time for this account), complete the form, land on `/dashboard`.

- [ ] **Step 4: Route protection**

1. Log out. Visit `http://localhost:3000/dashboard` directly. Expected: redirected to `/login`.

- [ ] **Step 5: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---

### Task 14: Push to GitHub

**Files:** None — repository operation only.

- [ ] **Step 1: Create the GitHub repository**

```bash
gh repo create avila-digiteix/readometre --private --source="E:/Projectes/readOmetre" --remote=origin
```

Confirm with the user which account/org and repo name to use before running this — adjust the `avila-digiteix/readometre` slug accordingly if different.

- [ ] **Step 2: Push**

```bash
git -c safe.directory="E:/Projectes/readOmetre" push -u origin master
```

Expected: push succeeds, repository visible on GitHub with the full commit history from this plan.

No further commit needed.

---
