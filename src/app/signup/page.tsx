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
      <main className="relative z-10 mx-auto mt-10 max-w-sm px-4">
        <p className="text-ink">Revisa el teu email per confirmar el compte.</p>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Crea un compte
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="password"
          type="password"
          placeholder="Contrasenya"
          required
          minLength={6}
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Registra&apos;t
        </button>
      </form>
      <p className="text-sm text-ink">
        Ja tens compte?{" "}
        <a href="/login" className="text-accent underline">
          Inicia sessió
        </a>
      </p>
    </main>
  );
}
