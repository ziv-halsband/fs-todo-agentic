import request from 'supertest';

import { app } from '../app';

import { cleanDatabase, disconnectDatabase } from './testHelpers';

// ─── Shared test data ───────────────────────────────────────────────────────

const VALID_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
  fullName: 'Test User',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign up and return the Set-Cookie header value.
 *
 * Supertest doesn't manage a cookie jar automatically — you must
 * capture cookies from a response and manually attach them to the
 * next request via .set('Cookie', cookies).
 */
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

describe('GET /auth/me', () => {
  describe('authenticated', () => {
    it('returns 200 and the current user when cookies are valid', async () => {
      const cookies = await signupAndGetCookies();

      const res = await request(app).get('/auth/me').set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        email: VALID_USER.email,
        fullName: VALID_USER.fullName,
      });
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });
  });

  describe('unauthenticated', () => {
    it('returns 401 when no cookies are sent', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when the Authorization header has an invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer this.is.not.a.valid.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
