import request from '@/lib/request';

interface TopicItem {
  id: string;
  name: string;
  description: string;
  cover: string;
  animeCount: number;
}

interface TopicListRes {
  items: TopicItem[];
  total: number;
}

interface TopicAnimeItem {
  id: string;
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
  videoId: string | null;
  videos: {
    id: string;
    episode: number;
  }[];
}

interface TopicDetailRes {
  id: string;
  name: string;
  description: string;
  cover: string;
  anime: TopicAnimeItem[];
}

const getTopicList = (params: { page?: number; pageSize?: number }) => {
  return request.get<TopicListRes>('/api/client/topics', {
    params,
    showErrorToast: true
  });
};

const getTopicDetail = (id: string) => {
  return request.get<TopicDetailRes>(`/api/client/topics/${id}`, {
    showErrorToast: true
  });
};

export { getTopicList, getTopicDetail, type TopicItem, type TopicAnimeItem };
