import request from 'supertest';

import { app } from '../app';

import {
  cleanDatabase,
  createAuthenticatedUser,
  disconnectDatabase,
} from './testHelpers';

// ─── Lifecycle ───────────────────────────────────────────────────────────────

afterAll(disconnectDatabase);

beforeEach(async () => {
  await cleanDatabase();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/lists', () => {
  describe('happy path', () => {
    it('returns 200 with a Default list when user has no explicit lists', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lists).toHaveLength(1);
      expect(res.body.data.lists[0].name).toBe('Default');
    });

    it('returns lists belonging to the authenticated user', async () => {
      const { authHeader } = await createAuthenticatedUser();

      await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'Work' });

      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.lists).toHaveLength(1);
      expect(res.body.data.lists[0].name).toBe('Work');
    });

    it('does not return lists belonging to another user', async () => {
      const user1 = await createAuthenticatedUser({
        email: 'user1@example.com',
      });
      const user2 = await createAuthenticatedUser({
        email: 'user2@example.com',
      });

      await request(app)
        .post('/api/lists')
        .set('Authorization', user1.authHeader)
        .send({ name: "User1's list" });

      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', user2.authHeader);

      expect(res.status).toBe(200);
      // user2 sees only their own auto-created Default list, never user1's list
      const names = (res.body.data.lists as Array<{ name: string }>).map(
        (l) => l.name
      );
      expect(names).not.toContain("User1's list");
      const userIds = (res.body.data.lists as Array<{ userId: string }>).map(
        (l) => l.userId
      );
      expect(userIds.every((id) => id === user2.userId)).toBe(true);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/lists');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', 'Bearer not-a-valid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/lists', () => {
  describe('happy path', () => {
    it('returns 201 and the created list', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'Shopping' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.list.name).toBe('Shopping');
      expect(res.body.data.list.id).toBeDefined();
    });

    it('applies default icon and color when not provided', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'Defaults' });

      expect(res.status).toBe(201);
      expect(res.body.data.list.icon).toBe('list');
      expect(res.body.data.list.color).toBe('#6C5CE7');
    });

    it('uses provided icon and color', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'Custom', icon: 'star', color: '#FF0000' });

      expect(res.status).toBe(201);
      expect(res.body.data.list.icon).toBe('star');
      expect(res.body.data.list.color).toBe('#FF0000');
    });
  });

  describe('validation errors', () => {
    it('returns 400 when name is missing', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when name is an empty string', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).post('/api/lists').send({ name: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/lists/:id', () => {
  describe('happy path', () => {
    it('returns 200 and the updated list', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'Old Name' });

      const listId = createRes.body.data.list.id;

      const res = await request(app)
        .patch(`/api/lists/${listId}`)
        .set('Authorization', authHeader)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.list.name).toBe('New Name');
    });

    it('can update icon and color independently', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'My List' });

      const listId = createRes.body.data.list.id;

      const res = await request(app)
        .patch(`/api/lists/${listId}`)
        .set('Authorization', authHeader)
        .send({ icon: 'rocket', color: '#123456' });

      expect(res.status).toBe(200);
      expect(res.body.data.list.icon).toBe('rocket');
      expect(res.body.data.list.color).toBe('#123456');
    });
  });

  describe('ownership errors', () => {
    it('returns 404 when the list belongs to another user', async () => {
      const user1 = await createAuthenticatedUser({ email: 'u1@example.com' });
      const user2 = await createAuthenticatedUser({ email: 'u2@example.com' });

      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', user1.authHeader)
        .send({ name: "User1's list" });

      const listId = createRes.body.data.list.id;

      const res = await request(app)
        .patch(`/api/lists/${listId}`)
        .set('Authorization', user2.authHeader)
        .send({ name: 'Hijacked' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app)
        .patch('/api/lists/some-id')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/lists/:id', () => {
  describe('happy path', () => {
    it('returns 200 and removes the list', async () => {
      const { authHeader } = await createAuthenticatedUser();

      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', authHeader)
        .send({ name: 'To Delete' });

      const listId = createRes.body.data.list.id;

      const deleteRes = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', authHeader);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify the deleted list is gone (a new Default list may be auto-created)
      const getRes = await request(app)
        .get('/api/lists')
        .set('Authorization', authHeader);

      const ids = (getRes.body.data.lists as Array<{ id: string }>).map(
        (l) => l.id
      );
      expect(ids).not.toContain(listId);
    });
  });

  describe('ownership errors', () => {
    it('returns 404 when the list belongs to another user', async () => {
      const user1 = await createAuthenticatedUser({ email: 'u1@example.com' });
      const user2 = await createAuthenticatedUser({ email: 'u2@example.com' });

      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', user1.authHeader)
        .send({ name: "User1's list" });

      const listId = createRes.body.data.list.id;

      const res = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', user2.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).delete('/api/lists/some-id');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
