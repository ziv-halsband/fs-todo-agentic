import request from 'supertest';

import { app } from '../app';

import { cleanDatabase, disconnectDatabase } from './testHelpers';

// ─── Shared test data ───────────────────────────────────────────────────────

const VALID_USER = {
  email: 'test@example.com',
  password: 'Test1234!',
  fullName: 'Test User',
};

// ─── Lifecycle ───────────────────────────────────────────────────────────────

afterAll(disconnectDatabase);

beforeEach(async () => {
  await cleanDatabase();
  // Every login test needs a pre-existing user
  await request(app).post('/auth/signup').send(VALID_USER);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  describe('happy path', () => {
    it('returns 200 and the user on valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: VALID_USER.email, password: VALID_USER.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({ email: VALID_USER.email });
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('sets accessToken and refreshToken cookies', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: VALID_USER.email, password: VALID_USER.password });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const accessCookie = cookies.find((c) => c.startsWith('accessToken='));
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();
      expect(accessCookie).toMatch(/HttpOnly/i);
      expect(refreshCookie).toMatch(/HttpOnly/i);
    });
  });

  describe('auth errors', () => {
    it('returns 401 when email does not exist', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: VALID_USER.password });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      // Must NOT leak whether the email exists — same generic message
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('returns 401 when password is wrong', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: VALID_USER.email, password: 'WrongPass9!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('validation errors', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ password: VALID_USER.password });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: VALID_USER.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
