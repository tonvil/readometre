"use client";

import { useState } from "react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await requestPasswordReset(formData);
    } finally {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
        <p className="text-sm text-ink-muted">
          Si l&apos;email existeix, rebràs un enllaç per restablir la
          contrasenya.
        </p>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4">
      <h1 className="font-display text-2xl font-bold text-ink">
        Recupera la contrasenya
      </h1>
      <form action={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded border border-field-border bg-field-bg p-2 text-ink placeholder:text-ink-muted"
        />
        <button
          type="submit"
          className="w-full rounded bg-accent p-2 font-semibold text-accent-ink"
        >
          Envia l&apos;enllaç
        </button>
      </form>
      <p className="text-sm text-ink">
        <a href="/login" className="text-accent underline">
          Torna a l&apos;inici de sessió
        </a>
      </p>
    </main>
  );
}
