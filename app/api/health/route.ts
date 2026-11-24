// Liveness probe. Reads no repo data and touches no cache, so a failed check
// means the Worker is down, not that a card render failed.
export function GET() {
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
