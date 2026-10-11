import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  type DanmakuData,
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const playerRef = useRef<{ getTime: () => number } | null>(null);

  // 续播进度：从 location.state 渲染期派生（跳转时携带，避免 detail 缓存 30s 导致
  // 续播到旧位置）。无明确集意图的入口（热门/专题/追番/搜索「立即观看」）在
  // detail 返回后自动跳转到最后观看的集（见下方 effect）；
  // 搜索集数列表点进的具体集带 fixed 标记，明确想看该集，跳过跳转
  const [skipResume] = useState(
    () => !!(location.state as { fixed?: boolean } | null)?.fixed
  );
  const resumeTime = (location.state as { time?: number } | null)?.time;
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // 手动切集的目标集从头播放（不恢复历史进度），刷新页面后自动失效
  const [manualVideoId, setManualVideoId] = useState<string | null>(null);

  // 无明确集意图的入口：若该番最后观看的不是当前集，跳转过去并恢复进度；
  // 每次挂载最多跳一次（redirectedRef），避免跳转窗口内心跳保存造成来回跳
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current || !detail || manualVideoId || skipResume) return;
    const history = detail.history;
    if (history?.videoId && history.videoId !== videoId) {
      redirectedRef.current = true;
      navigate(`/anime/${history.videoId}`, {
        state: history.time > 1 ? { time: history.time } : undefined,
        replace: true
      });
    }
  }, [detail, videoId, manualVideoId, skipResume, navigate]);

  /** 弹幕数据转 artplayer 插件结构 */
  const danmakus: DanmakuItem[] = (danmakuRes?.items ?? []).map(d => ({
    text: d.text,
    color: d.color,
    mode: toPluginMode(d.mode),
    time: d.time
  }));

  const handleSelectVideo = (id: string) => {
    if (!id) return;
    // 切走前先保存当前集进度（点击时刻 videoId/时间还是上一集的）
    persistProgress();
    setManualVideoId(id);
    navigate(`/anime/${id}`);
  };

  const invalidateDetail = () => {
    queryClient.invalidateQueries({ queryKey: ['play-detail', videoId] });
  };

  const { mutate: incrementPlay } = useMutation({
    mutationFn: () => incrementPlayCount(videoId),
    // 同步本地缓存，避免 staleTime 内播放数显示旧值
    onSuccess: () => {
      queryClient.setQueryData<PlayDetail>(
        ['play-detail', videoId],
        prev => prev && { ...prev, playCount: prev.playCount + 1 }
      );
    }
  });

  /** 保存进度（静默失败），videoId 与 time 必须来自同一集 */
  const persistProgress = (time?: number) => {
    const vid = playingVideoRef.current;
    const t = time ?? playerRef.current?.getTime() ?? 0;
    if (vid && t > 1) saveHistory(vid, t).catch(() => {});
  };

  // 播放器实际内容与 detail.video 同步，用它确定进度所属的集
  // （keepPreviousData 期间路由 videoId 已变但播放的还是上一集）
  const playingVideoRef = useRef<string | null>(null);
  useEffect(() => {
    playingVideoRef.current = detail?.video.id ?? null;
  }, [detail]);

  // 每 10s 心跳保存进度，刷新最多丢几秒；卸载补存由 Player onUnmounted 回调触发
  // （卸载时子组件 Player 先清理，ref 已不可用，不能再从 getTime 读）
  useEffect(() => {
    const timer = setInterval(persistProgress, 10_000);
    return () => clearInterval(timer);
  }, []);

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
    const data = {
      text: danmu.text,
      color: danmu.color!,
      mode: toStorageMode(danmu.mode!),
      time: danmu.time!
    };
    try {
      await danmakuCreate(videoId, data);
      // 追加到本地缓存，避免 staleTime 内重进该集看不到刚发的弹幕
      queryClient.setQueryData<{ items: DanmakuData[] }>(
        ['danmakus', videoId],
        prev => prev && { items: [...prev.items, data] }
      );
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
          ref={playerRef}
          url={detail.video.url}
          time={
            manualVideoId === videoId
              ? 0
              : typeof resumeTime === 'number' && resumeTime > 1
                ? resumeTime
                : detail.time
          }
          danmaku={danmakus}
          onDanmuEmit={handleDanmuEmit}
          onIncrementPlay={incrementPlay}
          onUnmounted={persistProgress}
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
