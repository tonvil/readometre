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
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Completa el teu perfil
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="nom"
          placeholder="Nom"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="cognom"
          placeholder="Cognom"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <input
          name="dataNaixement"
          type="date"
          placeholder="Data de naixement"
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Guarda i continua
        </button>
      </form>
    </main>
  );
}
