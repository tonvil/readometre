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
        <a href="/forgot-password" className="underline">
          Has oblidat la contrasenya?
        </a>
      </p>
      <p className="text-sm">
        No tens compte? <a href="/signup" className="underline">Registra&apos;t</a>
      </p>
    </main>
  );
}
