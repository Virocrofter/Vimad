/* src/app/app/groups/store.js */
import { create } from 'zustand';
import { initialGroups } from './data';

export const useGroupStore = create((set, get) => ({
  groups: initialGroups,

  addGroup: (newGroup) => set((state) => ({ groups: [newGroup, ...state.groups] })),

  updateGroup: (id, updater) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === id ? (typeof updater === 'function' ? updater(g) : { ...g, ...updater }) : g
      ),
    })),

  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
    })),

  getGroupById: (id) => get().groups.find((g) => g.id === id),
}));
