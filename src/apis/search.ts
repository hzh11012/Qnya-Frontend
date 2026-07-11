import request from '@/lib/request';

export interface SearchSuggestQuery {
  keyword: string;
}

export interface SearchSuggestItem {
  name: string;
  highlightName: string;
}

const searchSuggest = (params: SearchSuggestQuery) => {
  return request.get<SearchSuggestItem[]>('/api/client/search/suggestions', {
    params,
    showErrorToast: true
  });
};

export { searchSuggest };
