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

function extractCookieValue(
  cookies: string[],
  name: string
): string | undefined {
  const match = cookies.find((c) => c.startsWith(`${name}=`));
  return match?.split(';')[0].split('=')[1];
}
// ─── Lifecycle ───────────────────────────────────────────────────────────────

afterAll(disconnectDatabase);

beforeEach(async () => {
  await cleanDatabase();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
  describe('happy path', () => {
    it('returns 200 and issues a new accessToken cookie', async () => {
      const signupCookies = await signupAndGetCookies();

      const res = await request(app)
        .post('/auth/refresh')
        .set('Cookie', signupCookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Token refreshed successfully');

      // A new accessToken cookie must be present and non-empty
      const refreshedCookies = res.headers['set-cookie'] as unknown as string[];
      const newAccessToken = extractCookieValue(
        refreshedCookies,
        'accessToken'
      );
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken?.length).toBeGreaterThan(0);
    });

    it('new accessToken works for authenticated requests', async () => {
      const signupCookies = await signupAndGetCookies();

      // Refresh — get a new accessToken cookie
      const refreshRes = await request(app)
        .post('/auth/refresh')
        .set('Cookie', signupCookies);

      const newCookies = refreshRes.headers[
        'set-cookie'
      ] as unknown as string[];

      // /me with the NEW token must succeed
      const meRes = await request(app)
        .get('/auth/me')
        .set('Cookie', newCookies);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(VALID_USER.email);
    });
  });

  describe('error cases', () => {
    it('returns 401 when no refreshToken cookie is present', async () => {
      const res = await request(app).post('/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when refreshToken is tampered with', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [
          'refreshToken=this.is.not.a.real.token; Path=/; HttpOnly',
        ]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
