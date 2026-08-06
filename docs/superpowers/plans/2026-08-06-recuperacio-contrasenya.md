# Recuperació de contrasenya — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user who forgot their password recover access via a Supabase-emailed reset link, ending in a new password and a session that lands on `/dashboard`.

**Architecture:** A `/forgot-password` page + Server Action calls `supabase.auth.resetPasswordForEmail`, always returning a generic success message. The email link routes through the existing `/auth/callback` route, which gains optional `next`-param support so it can redirect to `/reset-password` instead of its default dashboard/onboarding logic. `/reset-password` is a client page that calls `supabase.auth.updateUser({ password })` directly against the recovery session already established by the callback, then does a full-page navigation to `/dashboard`.

**Tech Stack:** Next.js (App Router, Server Components, Server Actions), Supabase Auth (`@supabase/ssr`).

## Global Constraints

- No test framework in this plan (deferred, per project decision).
- Styling: Tailwind CSS only, matching existing auth page conventions (`mx-auto mt-20 max-w-sm space-y-6` wrapper, `w-full border p-2` inputs, `w-full bg-black p-2 text-white` submit button, `text-sm text-red-600` errors, `underline` inline links — see `src/app/login/page.tsx` and `src/app/signup/page.tsx`).
- `/forgot-password` never reveals whether an email is registered — it always shows the same generic success message, regardless of what Supabase returns.
- Password minimum length is `6`, matching `/signup`'s existing `minLength={6}` convention — no stricter policy in this plan.
- `/auth/callback`'s existing OAuth behavior (no `next` param) must be unchanged — the `next` handling is strictly additive.
- On successful password reset, use a full page navigation (`window.location.href`), not client-side routing, so the updated session cookies are present on the next server request to `/dashboard` (which is behind the auth middleware).
- Every task ends in its own git commit.

---

## File Structure

```
src/
└── app/
    ├── login/
    │   └── page.tsx                    # Modified: add "Has oblidat la contrasenya?" link
    ├── forgot-password/
    │   ├── page.tsx                     # New: email form
    │   └── actions.ts                   # New: requestPasswordReset()
    ├── auth/
    │   └── callback/
    │       └── route.ts                  # Modified: add optional `next` redirect support
    └── reset-password/
        └── page.tsx                      # New: new-password form
```

---

### Task 1: `/forgot-password` page and Server Action

**Files:**
- Create: `src/app/forgot-password/actions.ts`
- Create: `src/app/forgot-password/page.tsx`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Produces: `requestPasswordReset(formData: FormData): Promise<{ success: true }>` from `src/app/forgot-password/actions.ts`. Always resolves successfully (no error branch) — it never reveals whether the Supabase call itself failed.

- [ ] **Step 1: Write the Server Action**

```typescript
// src/app/forgot-password/actions.ts
"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { success: true };
}
```

- [ ] **Step 2: Write the page**

```typescript
// src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    await requestPasswordReset(formData);
    setSuccess(true);
  }

  if (success) {
    return (
      <main className="mx-auto mt-20 max-w-sm space-y-6">
        <p className="text-sm text-gray-600">
          Si l&apos;email existeix, rebràs un enllaç per restablir la
          contrasenya.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Recupera la contrasenya</h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full border p-2"
        />
        <button type="submit" className="w-full bg-black p-2 text-white">
          Envia l&apos;enllaç
        </button>
      </form>
      <p className="text-sm">
        <a href="/login" className="underline">
          Torna a l&apos;inici de sessió
        </a>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Link from the login page**

In `src/app/login/page.tsx`, add this paragraph right after the closing
`</form>` tag, before the existing "No tens compte?" paragraph:

```tsx
      <p className="text-sm">
        <a href="/forgot-password" className="underline">
          Has oblidat la contrasenya?
        </a>
      </p>
```

- [ ] **Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/forgot-password src/app/login/page.tsx
git commit -m "feat: add forgot-password page and Server Action"
```

---

### Task 2: `next`-param support in `/auth/callback`

**Files:**
- Modify: `src/app/auth/callback/route.ts`

**Interfaces:** None new — this task only extends an existing route.

- [ ] **Step 1: Add the `next` redirect**

Current content of `src/app/auth/callback/route.ts`:

```typescript
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

Replace it with:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const usuari = await prisma.usuari.findUnique({ where: { id: data.user.id } });
  return NextResponse.redirect(`${origin}${usuari ? "/dashboard" : "/onboarding"}`);
}
```

The only change is reading `next` from the query string and, when
present, redirecting there right after a successful code exchange —
before the `Usuari` lookup. Without `next`, behavior is byte-for-byte
identical to before.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat: add optional next-param redirect to auth callback"
```

---

### Task 3: `/reset-password` page

**Files:**
- Create: `src/app/reset-password/page.tsx`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client` (the browser client, same one used by the Google login button in `src/app/login/page.tsx`).

- [ ] **Step 1: Write the page**

```typescript
// src/app/reset-password/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Les contrasenyes no coincideixen.");
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("No s'ha pogut canviar la contrasenya. Torna-ho a provar.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Estableix una contrasenya nova</h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="password"
          type="password"
          placeholder="Contrasenya nova"
          required
          minLength={6}
          className="w-full border p-2"
        />
        <input
          name="confirmPassword"
          type="password"
          placeholder="Repeteix la contrasenya"
          required
          minLength={6}
          className="w-full border p-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-black p-2 text-white">
          Desa la contrasenya
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/reset-password/page.tsx
git commit -m "feat: add reset-password page"
```

---

### Task 4: End-to-end manual verification

**Files:** None — verification only.

- [ ] **Step 1: Full recovery flow with a registered email**

```bash
npm run dev
```

1. Go to `/login`, click "Has oblidat la contrasenya?". Expected:
   lands on `/forgot-password`.
2. Enter a real, registered test account's email and submit. Expected:
   the generic success message appears ("Si l'email existeix...").
3. Check that account's inbox for the Supabase password-reset email
   and click the link. Expected: browser lands on `/reset-password`
   (not `/login`, not `/dashboard`).

- [ ] **Step 2: Unregistered email gives the same response**

1. Go back to `/forgot-password`, submit an email that has never been
   registered. Expected: the exact same generic success message as
   Step 1.2 — no way to tell the two cases apart from the UI.

- [ ] **Step 3: Password confirmation mismatch**

1. On `/reset-password`, enter two different values in the password
   and confirm-password fields, submit. Expected: inline error "Les
   contrasenyes no coincideixen." with no network delay (this check
   happens before calling Supabase).

- [ ] **Step 4: Successful reset and re-login**

1. On `/reset-password`, enter the same new password in both fields
   (at least 6 characters) and submit. Expected: redirected to
   `/dashboard` (the reset session already authenticates you).
2. Log out, then log in again at `/login` using the new password.
   Expected: login succeeds.

- [ ] **Step 5: OAuth flow still works**

1. Log out. On `/login`, click "Continua amb Google" and complete the
   Google sign-in. Expected: lands on `/dashboard` or `/onboarding`
   exactly as before this plan's changes — the `next`-param addition
   must not have altered the no-`next` code path.

- [ ] **Step 6: Stop the dev server**

```bash
# Ctrl+C in the terminal running `npm run dev`
```

No commit — this task only verifies prior work.

---
