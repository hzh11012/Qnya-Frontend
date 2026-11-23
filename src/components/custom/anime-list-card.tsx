import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimeCard } from '@/components/custom/anime-card';
import type { ClientAnimeItem } from '@/apis/anime';
import { getStatusText } from '@/lib/anime';

/**
 * 番剧列表卡：热门、番剧库等「点卡进播放页」的列表共用一套字段映射
 * （封面 / 番名 / 备注 / 右下角状态）。别再各自拿 AnimeCard 手拼一遍。
 */
const AnimeListCard: React.FC<{ item: ClientAnimeItem }> = ({ item }) => {
  const navigate = useNavigate();

  return (
    <AnimeCard
      title={item.name}
      image={item.cover ?? ''}
      remark={item.remark ?? undefined}
      tip={getStatusText(item)}
      onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
    />
  );
};

export default AnimeListCard;
