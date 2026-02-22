import { create } from 'zustand';

interface TaskStore {
  selectedListId: string | null;
  searchTerm: string;

  setSelectedList: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  selectedListId: null,
  searchTerm: '',

  // Switching list also clears the search so you never land on a filtered view
  // of a new list with a stale search term from the previous one.
  setSelectedList: (id) => set({ selectedListId: id, searchTerm: '' }),
  setSearchTerm: (term) => set({ searchTerm: term }),
}));
