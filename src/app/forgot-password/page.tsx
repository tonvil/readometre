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
