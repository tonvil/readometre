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
        <input name="dataNaixement" type="date" placeholder="Data de naixement" className="w-full border p-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full bg-black p-2 text-white">
          Guarda i continua
        </button>
      </form>
    </main>
  );
}
