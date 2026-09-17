import type { Metadata } from "next";
import FleetApp from "@/components/fleet/FleetApp";

export const metadata: Metadata = {
  title: "Pojazdy | ACC BAU Tools",
  description: "Flota ACC BAU: pojazdy, kierowcy, przebieg, serwisy, naprawy, faktury i terminy.",
  robots: { index: false, follow: false },
};
export default function VehiclesPage() { return <FleetApp />; }
