import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SearchSuggestItem } from '@/apis';

interface SearchSuggestStore {
  list: SearchSuggestItem[];
  setList: (list: SearchSuggestItem[]) => void;
}

const useSearchSuggestStore = create<SearchSuggestStore>()(
  devtools(
    immer(set => ({
      list: [],
      setList: list => set({ list })
    }))
  )
);

export { useSearchSuggestStore };
