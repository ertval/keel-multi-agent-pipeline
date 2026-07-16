import { NextResponse } from "next/server";

/**
 * POST /api/voyages — mock upload handler (B-02).
 * Returns a canned success response simulating the FastAPI backend.
 */
export async function POST() {
  // Simulate processing latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json({
    voyage_id: "voyage_001",
    status: "ready",
    message: "Voyage processed successfully (mock)",
  });
}
