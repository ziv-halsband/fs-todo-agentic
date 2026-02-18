import { create } from 'zustand';

interface TaskStore {
  selectedListId: string | null;
  selectedFilter: 'all' | 'todo' | 'in-progress' | 'completed' | 'starred';
  searchTerm: string;

  setSelectedList: (id: string | null) => void;
  setFilter: (
    filter: 'all' | 'todo' | 'in-progress' | 'completed' | 'starred'
  ) => void;
  setSearchTerm: (term: string) => void;
  resetFilter: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  selectedListId: null,
  selectedFilter: 'all',
  searchTerm: '',

  setSelectedList: (id) => set({ selectedListId: id }),
  setFilter: (filter) => set({ selectedFilter: filter }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  resetFilter: () => set({ selectedFilter: 'all' }),
}));
