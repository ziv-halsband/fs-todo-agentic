import { NotFoundError } from '@fs-project/backend-common';

import prisma from '../config/database';

import type { List } from '@fs-project/db';

export interface CreateListData {
  name: string;
  icon?: string;
  color?: string;
  userId: string;
}

export interface UpdateListData {
  name?: string;
  icon?: string;
  color?: string;
}

class ListRepository {
  async findAllByUserId(userId: string): Promise<List[]> {
    return prisma.list.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, userId: string): Promise<List | null> {
    return prisma.list.findFirst({ where: { id, userId } });
  }

  async create(data: CreateListData): Promise<List> {
    return prisma.list.create({
      data: {
        name: data.name,
        icon: data.icon ?? 'list',
        color: data.color ?? '#6C5CE7',
        userId: data.userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateListData
  ): Promise<List> {
    const { count } = await prisma.list.updateMany({
      where: { id, userId },
      data,
    });
    if (count === 0) {
      throw new NotFoundError('List not found or access denied');
    }
    return prisma.list.findFirst({ where: { id } }) as Promise<List>;
  }

  async delete(id: string, userId: string): Promise<void> {
    const { count } = await prisma.list.deleteMany({ where: { id, userId } });
    if (count === 0) {
      throw new NotFoundError('List not found or access denied');
    }
  }
}

export const listRepository = new ListRepository();
