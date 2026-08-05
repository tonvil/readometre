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
