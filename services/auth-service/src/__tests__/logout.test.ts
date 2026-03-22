import request from 'supertest';

import { app } from '../app';

import { cleanDatabase, disconnectDatabase } from './testHelpers';

// ─── Shared test data ────────────────────────────────────────────────────────

const VALID_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
  fullName: 'Test User',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function signupAndGetCookies(): Promise<string[]> {
  const res = await request(app).post('/auth/signup').send(VALID_USER);
  return res.headers['set-cookie'] as unknown as string[];
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

afterAll(disconnectDatabase);

beforeEach(async () => {
  await cleanDatabase();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
  describe('happy path', () => {
    it('returns 200 and clears the auth cookies', async () => {
      const cookies = await signupAndGetCookies();

      const res = await request(app)
        .post('/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Server must send back Set-Cookie headers that clear both cookies.
      // A cleared cookie has an empty value and Max-Age=0 (or a past Expires).
      const clearedCookies = res.headers['set-cookie'] as unknown as string[];
      expect(clearedCookies).toBeDefined();

      const clearedAccess = clearedCookies.find((c) =>
        c.startsWith('accessToken=')
      );
      const clearedRefresh = clearedCookies.find((c) =>
        c.startsWith('refreshToken=')
      );

      expect(clearedAccess).toBeDefined();
      expect(clearedRefresh).toBeDefined();

      // Max-Age=0 tells the browser to delete the cookie immediately
      expect(clearedAccess).toMatch(/Max-Age=0/i);
      expect(clearedRefresh).toMatch(/Max-Age=0/i);
    });

    it('full session lifecycle: /me returns 401 after logout', async () => {
      // 1. Sign up — get valid cookies
      const validCookies = await signupAndGetCookies();

      // 2. /me works with valid cookies
      const beforeLogout = await request(app)
        .get('/auth/me')
        .set('Cookie', validCookies);
      expect(beforeLogout.status).toBe(200);

      // 3. Logout — server sends back cleared (empty) cookies
      const logoutRes = await request(app)
        .post('/auth/logout')
        .set('Cookie', validCookies);
      expect(logoutRes.status).toBe(200);

      // 4. Simulate what a browser does: use the cleared cookies on the next request.
      // The cleared cookies have empty values → no valid token → 401.
      const clearedCookies = logoutRes.headers[
        'set-cookie'
      ] as unknown as string[];
      const afterLogout = await request(app)
        .get('/auth/me')
        .set('Cookie', clearedCookies);
      expect(afterLogout.status).toBe(401);
    });
  });

  describe('unauthenticated', () => {
    it('returns 401 when called without a token', async () => {
      const res = await request(app).post('/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
