import type { Metadata } from "next";
import { StatsDashboard } from "@/components/stats-dashboard";

export const metadata: Metadata = {
  title: "Estadísticas — Tramo",
};

export default function EstadisticasPage() {
  return <StatsDashboard />;
}
