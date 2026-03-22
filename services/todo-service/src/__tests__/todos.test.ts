import request from 'supertest';

import { app } from '../app';

import {
  cleanDatabase,
  createAuthenticatedUser,
  disconnectDatabase,
  type AuthenticatedUser,
} from './testHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a list for the given user, returns its id. */
async function createList(
  authHeader: string,
  name = 'My List'
): Promise<string> {
  const res = await request(app)
    .post('/api/lists')
    .set('Authorization', authHeader)
    .send({ name });
  return res.body.data.list.id as string;
}

/** Creates a todo for the given user, returns its id. */
async function createTodo(
  authHeader: string,
  listId: string,
  overrides?: { title?: string; priority?: string; completed?: boolean }
): Promise<string> {
  const res = await request(app)
    .post('/api/todos')
    .set('Authorization', authHeader)
    .send({ title: overrides?.title ?? 'My Todo', listId, ...overrides });
  return res.body.data.todo.id as string;
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

let user: AuthenticatedUser;
let listId: string;

afterAll(disconnectDatabase);

beforeEach(async () => {
  await cleanDatabase();
  user = await createAuthenticatedUser();
  listId = await createList(user.authHeader);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/todos', () => {
  describe('happy path', () => {
    it('returns 201 and the created todo', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'Buy milk', listId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.todo.title).toBe('Buy milk');
      expect(res.body.data.todo.id).toBeDefined();
    });

    it('defaults priority to MEDIUM when not specified', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'Default priority', listId });

      expect(res.status).toBe(201);
      expect(res.body.data.todo.priority).toBe('MEDIUM');
    });

    it('defaults completed to false and starred to false', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'Defaults', listId });

      expect(res.status).toBe(201);
      expect(res.body.data.todo.completed).toBe(false);
      expect(res.body.data.todo.starred).toBe(false);
    });

    it('accepts HIGH and LOW priorities', async () => {
      const highRes = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'High', listId, priority: 'HIGH' });

      const lowRes = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'Low', listId, priority: 'low' }); // lowercase should be normalised

      expect(highRes.status).toBe(201);
      expect(highRes.body.data.todo.priority).toBe('HIGH');
      expect(lowRes.status).toBe(201);
      expect(lowRes.body.data.todo.priority).toBe('LOW');
    });

    it('includes the related list in the response', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'With list', listId });

      expect(res.status).toBe(201);
      expect(res.body.data.todo.list).toBeDefined();
      expect(res.body.data.todo.list.id).toBe(listId);
    });
  });

  describe('validation errors', () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ listId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when title is an empty string', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: '   ', listId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when listId is missing', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'No list' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for an invalid priority value', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', user.authHeader)
        .send({ title: 'Bad priority', listId, priority: 'URGENT' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('ownership errors', () => {
    it('returns 404 when listId belongs to another user', async () => {
      const other = await createAuthenticatedUser({
        email: 'other@example.com',
      });

      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', other.authHeader)
        .send({ title: 'Hijack', listId }); // listId belongs to `user`, not `other`

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Test', listId });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/todos', () => {
  describe('happy path', () => {
    it('returns 200 and an empty list when user has no todos', async () => {
      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.todos).toHaveLength(0);
      expect(res.body.data.total).toBe(0);
    });

    it('returns todos belonging to the authenticated user', async () => {
      await createTodo(user.authHeader, listId, { title: 'Todo A' });
      await createTodo(user.authHeader, listId, { title: 'Todo B' });

      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.todos).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
    });

    it('does not return todos belonging to another user', async () => {
      const other = await createAuthenticatedUser({
        email: 'other@example.com',
      });
      const otherListId = await createList(other.authHeader, "Other's list");
      await createTodo(other.authHeader, otherListId, {
        title: "Other's todo",
      });

      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', user.authHeader);

      expect(res.body.data.todos).toHaveLength(0);
    });

    it('filters by listId', async () => {
      const list2Id = await createList(user.authHeader, 'List 2');
      await createTodo(user.authHeader, listId, { title: 'In list 1' });
      await createTodo(user.authHeader, list2Id, { title: 'In list 2' });

      const res = await request(app)
        .get(`/api/todos?listId=${listId}`)
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.todos).toHaveLength(1);
      expect(res.body.data.todos[0].title).toBe('In list 1');
    });

    it('filters by completed=true', async () => {
      await createTodo(user.authHeader, listId, { title: 'Active' });
      const doneTodoId = await createTodo(user.authHeader, listId, {
        title: 'Done',
      });

      await request(app)
        .patch(`/api/todos/${doneTodoId}`)
        .set('Authorization', user.authHeader)
        .send({ completed: true });

      const res = await request(app)
        .get('/api/todos?completed=true')
        .set('Authorization', user.authHeader);

      expect(res.body.data.todos).toHaveLength(1);
      expect(res.body.data.todos[0].title).toBe('Done');
    });

    it('filters by priority', async () => {
      await createTodo(user.authHeader, listId, {
        title: 'High',
        priority: 'HIGH',
      });
      await createTodo(user.authHeader, listId, {
        title: 'Low',
        priority: 'LOW',
      });

      const res = await request(app)
        .get('/api/todos?priority=HIGH')
        .set('Authorization', user.authHeader);

      expect(res.body.data.todos).toHaveLength(1);
      expect(res.body.data.todos[0].title).toBe('High');
    });

    it('returns page and limit in the response', async () => {
      const res = await request(app)
        .get('/api/todos?page=2&limit=10')
        .set('Authorization', user.authHeader);

      expect(res.body.data.page).toBe(2);
      expect(res.body.data.limit).toBe(10);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/todos/stats', () => {
  describe('happy path', () => {
    it('returns 200 with zero counts when user has no todos', async () => {
      const res = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toEqual({
        total: 0,
        completed: 0,
        active: 0,
      });
    });

    it('returns correct counts after creating and completing todos', async () => {
      const id1 = await createTodo(user.authHeader, listId, { title: 'T1' });
      await createTodo(user.authHeader, listId, { title: 'T2' });

      await request(app)
        .patch(`/api/todos/${id1}`)
        .set('Authorization', user.authHeader)
        .send({ completed: true });

      const res = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', user.authHeader);

      expect(res.body.data.stats).toEqual({
        total: 2,
        completed: 1,
        active: 1,
      });
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/todos/stats');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/todos/count', () => {
  describe('happy path', () => {
    it('returns 200 with empty counts when user has no todos', async () => {
      const res = await request(app)
        .get('/api/todos/count')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.counts).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('returns incomplete todo counts grouped by list', async () => {
      const list2Id = await createList(user.authHeader, 'List 2');
      await createTodo(user.authHeader, listId, { title: 'T1' });
      await createTodo(user.authHeader, listId, { title: 'T2' });
      await createTodo(user.authHeader, list2Id, { title: 'T3' });

      // Mark one as completed — it should NOT appear in count
      const completedId = await createTodo(user.authHeader, listId, {
        title: 'Done',
      });
      await request(app)
        .patch(`/api/todos/${completedId}`)
        .set('Authorization', user.authHeader)
        .send({ completed: true });

      const res = await request(app)
        .get('/api/todos/count')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      // total = 3 incomplete (T1, T2, T3)
      expect(res.body.data.total).toBe(3);

      const list1Count = res.body.data.counts.find(
        (c: { listId: string; count: number }) => c.listId === listId
      );
      expect(list1Count?.count).toBe(2);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/todos/count');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/todos/:id', () => {
  describe('happy path', () => {
    it('returns 200 and the todo', async () => {
      const todoId = await createTodo(user.authHeader, listId, {
        title: 'Specific',
      });

      const res = await request(app)
        .get(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.todo.id).toBe(todoId);
      expect(res.body.data.todo.title).toBe('Specific');
    });
  });

  describe('not found', () => {
    it('returns 404 for a non-existent id', async () => {
      const res = await request(app)
        .get('/api/todos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when the todo belongs to another user', async () => {
      const other = await createAuthenticatedUser({
        email: 'other@example.com',
      });
      const otherListId = await createList(other.authHeader);
      const todoId = await createTodo(other.authHeader, otherListId);

      const res = await request(app)
        .get(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/todos/some-id');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/todos/:id', () => {
  describe('happy path', () => {
    it('returns 200 and updated todo when marking as completed', async () => {
      const todoId = await createTodo(user.authHeader, listId, {
        title: 'To finish',
      });

      const res = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.todo.completed).toBe(true);
    });

    it('can update title, description, priority, starred, and listId', async () => {
      const list2Id = await createList(user.authHeader, 'List 2');
      const todoId = await createTodo(user.authHeader, listId, {
        title: 'Original',
      });

      const res = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({
          title: 'Updated',
          description: 'Now has a description',
          priority: 'HIGH',
          starred: true,
          listId: list2Id,
        });

      expect(res.status).toBe(200);
      const todo = res.body.data.todo;
      expect(todo.title).toBe('Updated');
      expect(todo.description).toBe('Now has a description');
      expect(todo.priority).toBe('HIGH');
      expect(todo.starred).toBe(true);
      expect(todo.listId).toBe(list2Id);
    });

    it('can clear dueDate by passing null', async () => {
      const todoId = await createTodo(user.authHeader, listId);
      await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({ dueDate: '2030-01-01T00:00:00.000Z' });

      const clearRes = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({ dueDate: null });

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.data.todo.dueDate).toBeNull();
    });
  });

  describe('validation errors', () => {
    it('returns 400 when title is set to an empty string', async () => {
      const todoId = await createTodo(user.authHeader, listId);

      const res = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for an invalid priority value', async () => {
      const todoId = await createTodo(user.authHeader, listId);

      const res = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({ priority: 'CRITICAL' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('not found', () => {
    it('returns 404 for a non-existent id', async () => {
      const res = await request(app)
        .patch('/api/todos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', user.authHeader)
        .send({ title: 'Ghost' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when todo belongs to another user', async () => {
      const other = await createAuthenticatedUser({
        email: 'other@example.com',
      });
      const otherListId = await createList(other.authHeader);
      const todoId = await createTodo(other.authHeader, otherListId);

      const res = await request(app)
        .patch(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader)
        .send({ title: 'Hijacked' });

      expect(res.status).toBe(404);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app)
        .patch('/api/todos/some-id')
        .send({ title: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/todos/:id', () => {
  describe('happy path', () => {
    it('returns 200 and removes the todo', async () => {
      const todoId = await createTodo(user.authHeader, listId, {
        title: 'To Delete',
      });

      const deleteRes = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify it is gone
      const getRes = await request(app)
        .get(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader);

      expect(getRes.status).toBe(404);
    });
  });

  describe('not found', () => {
    it('returns 404 for a non-existent id', async () => {
      const res = await request(app)
        .delete('/api/todos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when todo belongs to another user', async () => {
      const other = await createAuthenticatedUser({
        email: 'other@example.com',
      });
      const otherListId = await createList(other.authHeader);
      const todoId = await createTodo(other.authHeader, otherListId);

      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', user.authHeader);

      expect(res.status).toBe(404);
    });
  });

  describe('auth errors', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).delete('/api/todos/some-id');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
