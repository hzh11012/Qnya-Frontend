import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SearchAnimeItem } from '@/apis';

interface SearchAnimeStore {
  list: SearchAnimeItem[];
  hasMore: boolean;
  total: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setTotal: (total: number) => void;
  setList: (list: SearchAnimeItem[]) => void;
  setHasMore: (hasMore: boolean) => void;
}

const useSearchAnimeStore = create<SearchAnimeStore>()(
  devtools(
    immer(set => ({
      list: [],
      hasMore: false,
      total: 0,
      page: 1,
      pageSize: 1,
      setPage: page => set({ page }),
      setTotal: total => set({ total }),
      setList: list => set({ list }),
      setHasMore: hasMore => set({ hasMore })
    }))
  )
);

export { useSearchAnimeStore };
