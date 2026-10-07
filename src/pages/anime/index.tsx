import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import {
  getPlayDetail,
  getDanmakuList,
  danmakuCreate,
  incrementPlayCount,
  saveHistory,
  toggleCollection,
  createRating,
  type DanmakuItem,
  type PlayDetail
} from '@/apis/play';
import { createFeedback } from '@/apis/feedback';
import FeedbackDialog, {
  type FeedbackFormValues
} from '@/pages/anime/feedback-dialog';
import Player from '@/components/custom/player';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import AnimeDescription from '@/pages/anime/anime-description';
import AnimeEpisode from '@/pages/anime/anime-episode';
import AnimeSideList from '@/pages/anime/anime-side-list';
import type { RatingFormValues } from '@/pages/anime/anime-rating';
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  House,
  MessageSquareWarning,
  RefreshCcw
} from 'lucide-react';

/** 弹幕存储的字符串 mode 与 artplayer 数值 mode 互转 */
const toPluginMode = (mode: 'scroll' | 'top' | 'bottom') =>
  ({ scroll: 0, top: 1, bottom: 2 })[mode] as 0 | 1 | 2;

const toStorageMode = (mode: 0 | 1 | 2) =>
  ({ 0: 'scroll', 1: 'top', 2: 'bottom' })[mode] as 'scroll' | 'top' | 'bottom';

const AnimeDropdownMenu: React.FC<{ animeId: string }> = ({ animeId }) => {
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { mutate: handleFeedback, isPending: feedbackLoading } = useMutation({
    mutationFn: (values: FeedbackFormValues) => createFeedback(animeId, values)
  });

  const menuItems = [
    { icon: House, label: '回到首页', onClick: () => navigate('/') },
    { icon: RefreshCcw, label: '重新加载', onClick: () => navigate(0) },
    {
      icon: MessageSquareWarning,
      label: '问题反馈',
      onClick: () => setFeedbackOpen(true)
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={cn(
            'absolute z-20 flex cursor-pointer items-center justify-center rounded-sm size-8 top-2 right-5 text-foreground',
            'transition-colors duration-200 hover:bg-border'
          )}
        >
          <EllipsisVertical size={18} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-fit'
        align='end'
      >
        {menuItems.map(({ icon: Icon, label, onClick }) => (
          <DropdownMenuItem
            key={label}
            className='cursor-pointer text-foreground'
            onClick={onClick}
          >
            <Icon className='text-foreground' />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>

      <FeedbackDialog
        loading={feedbackLoading}
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmit={(values, cb) => handleFeedback(values, { onSuccess: cb })}
      />
    </DropdownMenu>
  );
};

const Anime: React.FC = () => {
  const { videoId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const { data: detail, isPending } = useQuery({
    queryKey: ['play-detail', videoId],
    queryFn: () => getPlayDetail(videoId),
    enabled: !!videoId,
    // 换集时保留旧数据，播放器走 switchUrl 平滑切源，避免整页骨架闪烁
    placeholderData: keepPreviousData
  });

  const { data: danmakuRes } = useQuery({
    queryKey: ['danmakus', videoId],
    queryFn: () => getDanmakuList(videoId),
    enabled: !!videoId,
    placeholderData: keepPreviousData
  });

  // 每部番剧首次加载详情时，若历史记录在其他集则自动跳过去（手动切集后不再触发）
  const jumpedAnimeRef = useRef('');
  // 手动切集的目标集从头播放（不恢复历史进度），刷新页面后自动失效
  const [manualVideoId, setManualVideoId] = useState<string | null>(null);
  useEffect(() => {
    if (!detail || jumpedAnimeRef.current === detail.animeId) return;
    jumpedAnimeRef.current = detail.animeId;
    if (detail.history && detail.history.videoId !== videoId) {
      navigate(`/anime/${detail.history.videoId}`, { replace: true });
    }
  }, [detail, videoId, navigate]);

  /** 弹幕数据转 artplayer 插件结构 */
  const danmakus: DanmakuItem[] = (danmakuRes?.items ?? []).map(d => ({
    text: d.text,
    color: d.color,
    mode: toPluginMode(d.mode),
    time: d.time
  }));

  const handleSelectVideo = (id: string) => {
    if (id) {
      setManualVideoId(id);
      navigate(`/anime/${id}`);
    }
  };

  const invalidateDetail = () => {
    queryClient.invalidateQueries({ queryKey: ['play-detail', videoId] });
  };

  const { mutate: incrementPlay } = useMutation({
    mutationFn: () => incrementPlayCount(videoId)
  });

  const { mutate: saveProgress } = useMutation({
    mutationFn: (time: number) => saveHistory(videoId, time)
  });

  const { mutate: handleRating, isPending: ratingLoading } = useMutation({
    mutationFn: (data: RatingFormValues) =>
      createRating(videoId, {
        score: Number(data.score),
        content: data.content
      }),
    onSuccess: invalidateDetail
  });

  const { mutate: handleCollected } = useMutation({
    mutationFn: () => toggleCollection(videoId),
    onSuccess: res => {
      queryClient.setQueryData<PlayDetail>(
        ['play-detail', videoId],
        prev =>
          prev && {
            ...prev,
            isCollected: res.collected,
            collectionCount: prev.collectionCount + (res.collected ? 1 : -1)
          }
      );
    }
  });

  const handleDanmuEmit = async (danmu: DanmakuItem): Promise<boolean> => {
    if (!videoId) return false;
    try {
      await danmakuCreate(videoId, {
        text: danmu.text,
        color: danmu.color!,
        mode: toStorageMode(danmu.mode!),
        time: danmu.time!
      });
      return true;
    } catch {
      return false;
    }
  };

  if (isPending || !detail) {
    return (
      <div className='flex flex-col gap-4 p-6 lg:flex-row'>
        <Skeleton className='aspect-video flex-1' />
        <div className='flex w-full flex-col gap-3 lg:w-90'>
          <Skeleton className='h-40' />
          <Skeleton className='h-20' />
          <Skeleton className='h-20' />
        </div>
      </div>
    );
  }

  return (
    <div className='group flex flex-col lg:flex-row lg:h-screen'>
      {/* 播放器区域 */}
      <div className='relative isolate bg-black flex-none lg:flex-1'>
        {/* 收起/展开侧栏：hover 播放器时显示在右缘 */}
        <div
          className={cn(
            'hidden lg:group-hover:flex absolute top-1/2 -translate-y-1/2 right-0 z-20',
            'w-7 h-14 items-center justify-center rounded-l-sm cursor-pointer',
            'bg-black/50 text-white'
          )}
          onClick={() => setCollapsed(value => !value)}
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </div>
        <Player
          url={detail.video.url}
          time={manualVideoId === videoId ? 0 : detail.time}
          danmaku={danmakus}
          onDanmuEmit={handleDanmuEmit}
          onIncrementPlay={incrementPlay}
          onHistoryEmit={time => time > 1 && saveProgress(time)}
        />
      </div>

      {/* 侧栏 */}
      {!collapsed && (
        <div className='relative w-full lg:h-full lg:w-95 lg:flex-none border-l border-border bg-background flex flex-col'>
          <div className='min-h-12.5 border-b flex-none flex items-center px-5 text-base'>
            简介
          </div>
          <div className='py-5 flex-1 md:overflow-y-auto'>
            <div className='px-5'>
              <AnimeDescription
                detail={detail}
                isCollected={detail.isCollected}
                isRating={detail.isRating}
                onCollected={handleCollected}
                ratingLoading={ratingLoading}
                onRating={(values, cb) =>
                  handleRating(values, { onSuccess: cb })
                }
              />
              <hr className='my-5 border-border' />
              <AnimeEpisode
                detail={detail}
                onSelectVideo={handleSelectVideo}
              />
              <hr className='my-5 border-border' />
            </div>
            <AnimeSideList
              title={`${detail.name}系列`}
              list={detail.series}
              onAnimeClick={handleSelectVideo}
              className='-my-2'
            />
            {!!detail.series.length && <hr className='my-5 border-border' />}
            <AnimeSideList
              list={detail.recommendations}
              showRating
              onAnimeClick={handleSelectVideo}
              className='-my-2'
            />
          </div>

          <AnimeDropdownMenu animeId={detail.animeId} />
        </div>
      )}
    </div>
  );
};

export default Anime;
