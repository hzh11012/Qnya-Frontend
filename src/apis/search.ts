import request from '@/lib/request';

interface SearchSuggestQuery {
  keyword: string;
}

interface SearchSuggestItem {
  name: string;
  highlightName: string;
}

interface SearchAnimeQuery extends SearchSuggestQuery {
  page?: number;
  pageSize?: number;
}

interface SearchAnimeItem {
  id: number;
  name: string;
  description: string;
  cover: string;
  status: string;
  type: string;
  director: string;
  cv: string;
  year: number;
  month: string;
  tags: string[];
  avgScore: number;
  scoreCount: number;
  videoCount: number;
  videoId: number | null;
  highlightName: string;
  videos: {
    id: number;
    name: string;
  }[];
}

interface SearchAnimeRes {
  items: SearchAnimeItem[];
  total: number;
}

const searchSuggest = (params: SearchSuggestQuery) => {
  return request.get<SearchSuggestItem[]>('/api/client/search/suggestions', {
    params,
    showErrorToast: true
  });
};

const searchAnime = (params: SearchAnimeQuery) => {
  return request.get<SearchAnimeRes>('/api/client/search', {
    params,
    showErrorToast: true
  });
};

export {
  searchSuggest,
  searchAnime,
  type SearchSuggestItem,
  type SearchAnimeItem
};
