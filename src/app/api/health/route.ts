/** Health check for Docker and the reverse proxy on the VPS. */
export function GET() {
  return Response.json({ ok: true });
}
