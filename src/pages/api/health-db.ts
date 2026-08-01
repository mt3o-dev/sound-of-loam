import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import type { D1Like } from '../../lib/db/types';

// Verification scaffolding for F-01: proves the D1 binding reaches server code
// end-to-end. On-demand (not prerendered). S-05/S-06 add the real endpoints.
// Astro v6+ removed locals.runtime.env — bindings come from `cloudflare:workers`.
export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as unknown as { DB?: D1Like }).DB;
  if (!db) {
    return Response.json({ ok: false, error: 'D1 binding "DB" not available' }, { status: 500 });
  }
  const count = async (table: string) => {
    const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
    return row?.n ?? 0;
  };
  const [users, tracks, shares] = await Promise.all([
    count('users'),
    count('tracks'),
    count('shares'),
  ]);
  return Response.json({ ok: true, counts: { users, tracks, shares } });
};
