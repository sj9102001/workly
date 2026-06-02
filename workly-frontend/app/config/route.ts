import { NextResponse } from "next/server";

// Always evaluate per-request so the value reflects the runtime environment,
// not whatever was present at `next build` time.
export const dynamic = "force-dynamic";

/**
 * Runtime configuration endpoint.
 *
 * Lets the SAME built frontend image be deployed anywhere (Vercel, K8s, GKE,
 * a VM, ...) and point at any backend without rebuilding. The base URL is read
 * from a server-side environment variable at request time.
 *
 * Resolution order:
 *   1. API_BASE_URL              — runtime, server-only (preferred for deploys)
 *   2. NEXT_PUBLIC_API_BASE_URL  — build-time fallback (legacy / Vercel git deploys)
 *   3. http://localhost:8080     — local dev default
 */
export async function GET() {
  const apiBaseUrl =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080";

  return NextResponse.json({ apiBaseUrl });
}
