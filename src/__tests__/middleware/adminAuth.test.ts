// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/adminAuth';

vi.mock('@clerk/nextjs/server', () => ({ getAuth: vi.fn() }));

const makeReq = () => new Request('http://localhost/admin', { method: 'GET' }) as any;

describe('withAdminAuth middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no userId', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: null });

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const mw = await withAdminAuth(handler);
    const res = await mw(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 404 when user fetch fails', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'ck_1' });

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })) as any);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const mw = await withAdminAuth(handler);
    const res = await mw(makeReq());
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not admin', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'ck_1' });

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ role: { name: 'user' } }) })) as any);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const mw = await withAdminAuth(handler);
    const res = await mw(makeReq());
    expect(res.status).toBe(403);
  });

  it('calls handler when admin', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockReturnValue({ userId: 'ck_1' });

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ role: { name: 'admin' } }) })) as any);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const mw = await withAdminAuth(handler);
    const res = await mw(makeReq());
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    const { getAuth } = await import('@clerk/nextjs/server');
    (getAuth as any).mockImplementation(() => { throw new Error('oops'); });

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const mw = await withAdminAuth(handler);
    const res = await mw(makeReq());
    expect(res.status).toBe(500);
  });
});
