"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-900 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">
        ACC BAU TOOLS
      </h1>

      <div className="grid gap-4">
        <div className="bg-zinc-800 p-6 rounded-2xl">
          <h2 className="text-2xl font-semibold">
            Hilti TE 70
          </h2>

          <p className="mt-2 text-zinc-300">
            Status: Na budowie
          </p>

          <p className="text-zinc-300">
            Pracownik: Klepacki
          </p>

          <p className="text-zinc-300">
            Przegląd DGUV: 12.10.2026
          </p>
        </div>
      </div>
    </main>
  );
}