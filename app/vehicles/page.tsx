"use client";
import FleetPage from "@/components/fleet/FleetPage";

export default function VehiclesCompatibilityPage() {
  return (
    <main className="min-h-screen bg-zinc-100 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px]">
        <FleetPage lang="pl" user="" people={[]} projects={[]} />
      </div>
    </main>
  );
}
