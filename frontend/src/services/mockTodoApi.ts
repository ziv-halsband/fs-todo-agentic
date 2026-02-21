export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  starred: boolean;
  priority: Priority;
  dueDate?: string;
  listId: string;
  listName: string;
}

export interface List {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const MOCK_LISTS: List[] = [
  { id: 'work', name: 'Work', icon: 'work', color: '#6C5CE7' },
  { id: 'personal', name: 'Personal', icon: 'person', color: '#FF6B6B' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping_cart', color: '#FFA500' },
];

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design final screens for mobile app',
    completed: false,
    starred: true,
    priority: 'high',
    dueDate: '2024-02-17T17:00:00',
    listId: 'work',
    listName: 'Work',
  },
  {
    id: '2',
    title: 'Renew gym membership subscription',
    completed: false,
    starred: false,
    priority: 'medium',
    dueDate: '2024-02-18T00:00:00',
    listId: 'personal',
    listName: 'Personal',
  },
  {
    id: '3',
    title: 'Buy groceries for the week',
    completed: false,
    starred: false,
    priority: 'low',
    listId: 'shopping',
    listName: 'Shopping',
  },
  {
    id: '4',
    title: 'Morning workout — 30 mins',
    completed: true,
    starred: false,
    priority: 'low',
    listId: 'personal',
    listName: 'Personal',
  },
  {
    id: '5',
    title: 'Review team PRs for Dashboard V2',
    completed: true,
    starred: false,
    priority: 'high',
    dueDate: '2024-02-17T12:00:00',
    listId: 'work',
    listName: 'Work',
  },
  {
    id: '6',
    title: 'Call parents',
    completed: false,
    starred: true,
    priority: 'medium',
    listId: 'personal',
    listName: 'Personal',
  },
  {
    id: '7',
    title: 'Prepare presentation slides',
    completed: false,
    starred: false,
    priority: 'high',
    dueDate: '2024-02-19T10:00:00',
    listId: 'work',
    listName: 'Work',
  },
  {
    id: '8',
    title: 'Order new running shoes',
    completed: false,
    starred: false,
    priority: 'low',
    listId: 'shopping',
    listName: 'Shopping',
  },
];

export const mockGetLists = (): List[] => {
  return MOCK_LISTS;
};

export const mockGetTasks = (params?: {
  listId?: string | null;
  filter?: string;
  searchTerm?: string;
}): Task[] => {
  let filtered = [...MOCK_TASKS];

  if (params?.listId) {
    filtered = filtered.filter((t) => t.listId === params.listId);
  }

  if (params?.filter === 'completed') {
    filtered = filtered.filter((t) => t.completed);
  } else if (params?.filter === 'todo') {
    filtered = filtered.filter((t) => !t.completed);
  } else if (params?.filter === 'in-progress') {
    filtered = filtered.filter((t) => !t.completed);
  } else if (params?.filter === 'starred') {
    filtered = filtered.filter((t) => t.starred);
  }

  if (params?.searchTerm) {
    const term = params.searchTerm.toLowerCase();
    filtered = filtered.filter((t) => t.title.toLowerCase().includes(term));
  }

  return filtered;
};

export const mockAddTask = (data: {
  title: string;
  description?: string;
  priority: Priority;
  listId: string;
  dueDate?: string;
}): Task => {
  const list = MOCK_LISTS.find((l) => l.id === data.listId);
  const newTask: Task = {
    id: String(Date.now()),
    title: data.title,
    description: data.description,
    completed: false,
    starred: false,
    priority: data.priority,
    listId: data.listId,
    listName: list?.name ?? data.listId,
    dueDate: data.dueDate,
  };
  MOCK_TASKS.push(newTask);
  return newTask;
};

export const mockUpdateTask = (
  id: string,
  data: Partial<Omit<Task, 'id'>>
): Task | undefined => {
  const task = MOCK_TASKS.find((t) => t.id === id);
  if (task) {
    Object.assign(task, data);
    if (data.listId) {
      const list = MOCK_LISTS.find((l) => l.id === data.listId);
      task.listName = list?.name ?? data.listId;
    }
  }
  return task;
};

export const mockToggleTaskComplete = (taskId: string): Task | undefined => {
  const task = MOCK_TASKS.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
  }
  return task;
};

export const mockToggleTaskStar = (taskId: string): Task | undefined => {
  const task = MOCK_TASKS.find((t) => t.id === taskId);
  if (task) {
    task.starred = !task.starred;
  }
  return task;
};
