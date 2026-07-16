"use client";

import { DashboardContent } from "../dashboard/page";

export default function VoyagesPage() {
  return (
    <DashboardContent
      title="Voyages"
      subtitle="Fleet-wide demurrage reconciliation overview"
      showGraphs={false}
    />
  );
}
