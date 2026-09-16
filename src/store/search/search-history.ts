import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface SearchHistory {
  list: string[];
  createHistory: (keyword: string) => void;
  removeHistory: (keyword: string) => void;
  clearHistory: () => void;
}

const useSearchHistoryStore = create<SearchHistory>()(
  devtools(
    persist(
      immer(set => ({
        list: [],

        createHistory: (keyword: string) => {
          set(state => {
            const filtered = state.list.filter(t => t !== keyword);
            state.list = [keyword, ...filtered].slice(0, 10);
          });
        },
        removeHistory: (keyword: string) => {
          set(state => {
            state.list = state.list.filter(t => t !== keyword);
          });
        },
        clearHistory: () => set({ list: [] })
      })),
      {
        name: 'qnya-search-history',
        // 结构变更时递增版本号，避免旧 localStorage 数据不兼容
        version: 1
      }
    )
  )
);

export { useSearchHistoryStore };
