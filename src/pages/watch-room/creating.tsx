import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import CoverImage from '@/components/custom/cover-image';
import PlayHeader from '@/pages/anime/play-header';
import { cn } from '@/lib/utils';
import {
  emitAck,
  getWatchRoomSocket,
  ROOM_EVENT,
  type RoomStateAck
} from '@/apis/watch-room-socket';
import { useDocumentTitle } from '@/hooks/use-document-title';

/** 建房页点卡后带过来的载荷。不落 URL：刷新或直访拿不到就退回选片页 */
export interface WatchRoomCreatingState {
  name: string;
  videoId: string;
  animeName: string;
  episode: number;
  cover: string;
}

/**
 * 建房基本是毫秒级返回，不设下限的话这页只会闪一下、封面和番名都看不清。
 * 所以最快也要留这么久再走；真慢了就以 ACK 为准，不额外等。
 */
const MIN_DURATION = 2400;

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * @title 正在开场
 * @description 点卡立即跳到这里，房间在后台异步创建（socket ACK 回来再 replace 到
 * `/watch-room/:id`）——用户不用在选片页盯着卡片转圈。失败弹 toast 并退回选片页。
 */
const WatchRoomCreating: React.FC = () => {
  useDocumentTitle('正在开场');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  /** 建房不是幂等操作：StrictMode 会跑两遍 effect，必须只发一次 */
  const started = useRef(false);
  /** 过渡页要停两秒多，期间用户可能已经点走了，那就别再把人拽进房间 */
  const alive = useRef(true);
  const payload = (location.state ?? null) as WatchRoomCreatingState | null;
  /** 进度条要 0 → 100% 有个起点，挂载后下一帧再置位才有过渡动画 */
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilling(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    // 刷新 / 直访时没有载荷，别在这里空转
    if (!payload) {
      navigate('/watch-room/new', { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;

    const startedAt = Date.now();

    void (async () => {
      const result = await emitAck<RoomStateAck>(
        getWatchRoomSocket(),
        ROOM_EVENT.create,
        {
          name: payload.name,
          visibility: 'public',
          videoId: payload.videoId
        }
      );

      if (!result.success) {
        toast.error(result.error?.message ?? '创建房间失败');
        navigate('/watch-room/new', { replace: true });
        return;
      }

      // 大厅列表与「回到房间」入口都缓存过，建完立刻作废，避免回大厅看到旧数据
      queryClient.removeQueries({ queryKey: ['watch-room-rooms'] });
      queryClient.removeQueries({ queryKey: ['watch-room-current'] });

      // 房间已经建好了，只是别让过渡页一闪而过
      const remain = MIN_DURATION - (Date.now() - startedAt);
      if (remain > 0) await sleep(remain);

      if (!alive.current) {
        // 用户在建房完成前就离开了过渡页：房间已落库且本人是房主，
        // 顺手解散掉，别在大厅留一间没人（也回不去）的空房
        void emitAck(getWatchRoomSocket(), ROOM_EVENT.leave, {
          roomId: result.data.state.id
        });
        return;
      }

      navigate(`/watch-room/${result.data.state.id}`, { replace: true });
    })();
  }, [payload, navigate, queryClient]);

  return (
    <>
      {/* 过渡页地址是一次性的（无载荷直访会被退回选片页），分享图标置灰不可点 */}
      <PlayHeader showShare={false} />
      <div className='relative flex min-h-[calc(100dvh-3.125rem)] items-center justify-center overflow-hidden bg-background px-6 py-10 text-center'>
        {/* 背景：封面虚化铺底 + 向下渐隐，别让整屏只剩白/黑 */}
        {payload && (
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0'
          >
            <CoverImage
              src={payload.cover}
              className='size-full scale-125 opacity-20 blur-3xl saturate-150'
            />
            <div className='absolute inset-0 bg-linear-to-b from-background/60 via-background/85 to-background' />
          </div>
        )}

        {/* 竖排居中；md 以上改成「海报 + 状态」并排，横向撑开，别让它看着像半屏空白 */}
        <div className='relative flex w-full max-w-3xl flex-col items-center gap-7 text-center md:flex-row md:justify-center md:gap-14 md:text-left'>
          {payload && (
            <CoverImage
              src={payload.cover}
              className='aspect-3/4 w-40 shrink-0 animate-fade-up rounded-md shadow-2xl ring-1 ring-border sm:w-48 md:w-56 lg:w-60'
            />
          )}

          <div className='flex min-w-0 flex-col items-center md:w-72 md:items-start'>
            <div className='flex items-center gap-3'>
              <Loader2 className='size-5 animate-spin text-primary md:size-6' />
              <h1 className='text-xl font-medium tracking-tight text-foreground md:text-2xl lg:text-3xl'>
                正在开场…
              </h1>
            </div>

            {payload && (
              <p
                className='mt-3 line-clamp-1 max-w-full text-sm text-foreground md:text-base lg:text-lg'
                title={payload.animeName}
              >
                {payload.animeName}
                <span className='text-muted-foreground'>
                  {' '}
                  第 {payload.episode} 话
                </span>
              </p>
            )}

            {/* 进度条：房间基本是瞬间建好的，这条只是把 2.4s 的最短停留画出来 */}
            <div
              aria-hidden
              className='mt-7 h-1 w-60 overflow-hidden rounded-full bg-foreground/10 md:w-full'
            >
              <div
                className={cn(
                  'h-full rounded-full bg-primary transition-[width] duration-[2200ms] ease-out',
                  filling ? 'w-full' : 'w-0'
                )}
              />
            </div>

            <p className='mt-3.5 text-xs text-muted-foreground md:text-sm'>
              正在为你准备放映室，马上就好
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WatchRoomCreating;
