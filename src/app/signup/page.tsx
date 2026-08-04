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
