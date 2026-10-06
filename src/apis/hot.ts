import request from '@/lib/request';
import type { SearchAnimeItem } from '@/apis/search';

/** 热门条目与搜索结果结构一致，仅无高亮字段 */
type HotAnimeItem = Omit<SearchAnimeItem, 'highlightName'>;

interface HotAnimeRes {
  items: HotAnimeItem[];
  total: number;
}

const getHotList = (params: { page?: number; pageSize?: number }) => {
  return request.get<HotAnimeRes>('/api/client/anime/hot', {
    params,
    showErrorToast: true
  });
};

export { getHotList, type HotAnimeItem };
