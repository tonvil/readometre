export default function HomePage() {
  return (
    <main className="relative z-10 mx-auto mt-10 max-w-sm space-y-6 px-4 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">Diari de lectura</h1>
      <p className="text-ink-muted">Registra els llibres que llegeixes i segueix el teu hàbit lector.</p>
      <div className="flex justify-center gap-4">
        <a href="/login" className="rounded border border-field-border p-2 text-ink">Inicia sessió</a>
        <a href="/signup" className="rounded bg-accent p-2 font-semibold text-accent-ink">Registra&apos;t</a>
      </div>
    </main>
  );
}
