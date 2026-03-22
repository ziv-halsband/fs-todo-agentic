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
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /auth/signup', () => {
  describe('happy path', () => {
    it('returns 201 and the created user', async () => {
      const res = await request(app).post('/auth/signup').send(VALID_USER);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toMatchObject({
        email: VALID_USER.email,
        fullName: VALID_USER.fullName,
      });
      // password hash must never appear in the response
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('sets httpOnly accessToken and refreshToken cookies', async () => {
      const res = await request(app).post('/auth/signup').send(VALID_USER);

      expect(res.status).toBe(201);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const accessCookie = cookies.find((c) => c.startsWith('accessToken='));
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

      expect(accessCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();

      // Both cookies must have HttpOnly flag (XSS protection)
      expect(accessCookie).toMatch(/HttpOnly/i);
      expect(refreshCookie).toMatch(/HttpOnly/i);
    });

    it('normalizes email to lowercase', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ ...VALID_USER, email: 'TEST@EXAMPLE.COM' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('validation errors', () => {
    it('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ password: VALID_USER.password, fullName: VALID_USER.fullName });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBeDefined();
    });

    it('returns 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ ...VALID_USER, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when fullName is missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: VALID_USER.email, password: VALID_USER.password });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when fullName contains invalid characters', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ ...VALID_USER, fullName: 'User123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: VALID_USER.email, fullName: VALID_USER.fullName });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is too weak', async () => {
      // validator only checks presence; password strength is enforced in the service
      const res = await request(app)
        .post('/auth/signup')
        .send({ ...VALID_USER, password: 'weakpassword' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('conflict errors', () => {
    it('returns 409 when email is already registered', async () => {
      // First signup
      await request(app).post('/auth/signup').send(VALID_USER);

      // Second signup with the same email
      const res = await request(app).post('/auth/signup').send(VALID_USER);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });
});
