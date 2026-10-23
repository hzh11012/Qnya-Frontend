import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import CoverImage from '@/components/custom/cover-image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/components/ui/carousel';
import { getStatusText } from '@/lib/anime';
import { cn } from '@/lib/utils';
import type { HomeBannerItem, HomePickItem } from '@/apis/home';

/** 轮播自动播放间隔 */
const CAROUSEL_INTERVAL = 5000;

/** 图上控制按钮：弹窗同款磨砂质感（background/80 + 软阴影，无描边；模糊半径在 settled 态由外部拼接） */
const SLIDE_BTN_CLASS =
  'flex size-8 transform-gpu cursor-pointer items-center justify-center rounded-full bg-background/80 text-foreground shadow-lg transition-colors hover:bg-background';

/** 指示条容器：同质感磨砂胶囊（与右侧按钮同高，视觉中线对齐） */
const SLIDE_DOTS_CLASS =
  'flex h-8 transform-gpu items-center gap-1.5 rounded-full bg-background/80 px-3.5 shadow-lg';

/** 磨砂胶囊通用：停稳时才开模糊，滑动中 backdrop-filter 逐帧重算是掉帧主因 */
const chipGlass = (settled: boolean) =>
  settled ? 'backdrop-blur-md' : 'backdrop-blur-none';

/** 轮播单帧：全幅大图 + 底部渐变，文案只留标题，保持电影感；当前帧缓慢 Ken Burns */
const BannerSlide: React.FC<{
  item: HomeBannerItem;
  settled: boolean;
  active: boolean;
}> = ({ item, settled, active }) => {
  const navigate = useNavigate();

  return (
    <div
      className='relative aspect-video cursor-pointer overflow-hidden sm:aspect-2/1 lg:aspect-auto lg:h-full'
      onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
    >
      <CoverImage
        src={item.banner}
        className='absolute inset-0'
        // 当前帧停稳后缓慢推近（Ken Burns），切帧自动复位
        imageClassName={active && settled ? 'animate-ken-burns' : undefined}
      />
      {/* 底部主渐变 + 左侧渐变：中部文案区压暗，画面上下保持通透 */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent' />
      <div className='absolute inset-0 hidden bg-gradient-to-r from-black/55 via-black/15 to-transparent sm:block' />

      {/* 左侧文字块：底部锚定（有无简介标题位置不变），整体在指示条上方 */}
      <div className='absolute bottom-14 left-5 flex max-w-[65%] flex-col items-start gap-2 sm:bottom-16 sm:left-7 md:left-8'>
        <h2 className='line-clamp-2 text-xl font-semibold text-white drop-shadow-md sm:text-2xl md:text-3xl'>
          {item.name}
        </h2>
        <div className='flex items-center gap-2'>
          {item.remark && (
            <span
              className={cn(
                'flex-none rounded-full bg-background/80 px-3 py-1 text-xs text-foreground shadow-lg',
                chipGlass(settled)
              )}
            >
              {item.remark}
            </span>
          )}
          <span
            className={cn(
              'hidden rounded-full bg-background/80 px-3 py-1 text-xs text-foreground shadow-lg md:block',
              chipGlass(settled)
            )}
          >
            {getStatusText({
              status: item.status,
              videoCount: item.videoCount ?? 0
            })}
          </span>
        </div>
        {item.description && (
          <p className='line-clamp-3 max-lg:hidden text-sm leading-relaxed text-white/80 drop-shadow-md'>
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

/** 大图轮播：embla 横向滑动 + 循环 + 自动播放；控制器悬浮右下角 */
const HeroCarousel: React.FC<{ items: HomeBannerItem[] }> = ({ items }) => {
  const [emblaApi, setEmblaApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  /** 滑动动画中：磨砂暂停（backdrop-filter 逐帧重算是掉帧主因），settle 后恢复 */
  const [settled, setSettled] = useState(true);
  /** 拖拽中：自动播放挂起，松手后恢复 */
  const [dragging, setDragging] = useState(false);
  /** 磨砂开关：滑动动画或拖拽中一律关闭（backdrop-filter 逐帧重算是掉帧主因） */
  const stillGlass = settled && !dragging;

  useEffect(() => {
    if (!emblaApi) return;
    const onPointerDown = () => setDragging(true);
    const onPointerUp = () => setDragging(false);
    emblaApi.on('pointerDown', onPointerDown);
    emblaApi.on('pointerUp', onPointerUp);
    return () => {
      emblaApi.off('pointerDown', onPointerDown);
      emblaApi.off('pointerUp', onPointerUp);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCurrent(emblaApi.selectedScrollSnap());
      setSettled(false);
    };
    const onSettle = () => setSettled(true);
    // 初始同步延迟到事件循环，避免 effect 内直接 setState（react-hooks/set-state-in-effect）
    const id = requestAnimationFrame(() =>
      setCurrent(emblaApi.selectedScrollSnap())
    );
    emblaApi.on('select', onSelect);
    emblaApi.on('settle', onSettle);
    return () => {
      cancelAnimationFrame(id);
      emblaApi.off('select', onSelect);
      emblaApi.off('settle', onSettle);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (paused || dragging || !emblaApi || items.length <= 1) return;
    const timer = setInterval(() => {
      // 后台标签页跳过：浏览器会节流并积压定时器，切回时会连续滚动多帧
      if (document.visibilityState === 'visible') emblaApi.scrollNext();
    }, CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, dragging, emblaApi, items.length]);

  return (
    <Carousel
      setApi={setEmblaApi}
      opts={{ loop: true }}
      className='relative flex-1 animate-fade-up overflow-hidden rounded-sm bg-card lg:min-h-96 [&_[data-slot=carousel-content]]:h-full'
    >
      <CarouselContent className='ml-0 h-full will-change-transform'>
        {items.map((item, i) => (
          <CarouselItem
            key={item.animeId}
            className='h-full pl-0'
          >
            <BannerSlide
              item={item}
              settled={stillGlass}
              active={i === current}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* 左下：指示条（移动端同样显示） */}
      <div className='absolute bottom-4 left-5 sm:bottom-5 sm:left-7 md:left-8'>
        <div className={cn(SLIDE_DOTS_CLASS, chipGlass(stillGlass))}>
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`切换到第${i + 1}个轮播`}
              className={cn(
                'h-1 cursor-pointer rounded-full transition-all',
                i === current
                  ? 'w-5 bg-primary'
                  : 'w-2 bg-foreground/30 hover:bg-foreground/60'
              )}
              onClick={e => {
                e.stopPropagation();
                emblaApi?.scrollTo(i);
              }}
            />
          ))}
        </div>
      </div>

      {/* 右下：控制按钮 */}
      <div className='absolute bottom-4 right-5 flex items-center gap-2 sm:bottom-5 sm:right-7 md:right-8'>
        <button
          aria-label={paused ? '恢复轮播' : '暂停轮播'}
          className={cn(SLIDE_BTN_CLASS, chipGlass(stillGlass))}
          onClick={e => {
            e.stopPropagation();
            setPaused(p => !p);
          }}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        <button
          aria-label='上一个'
          className={cn(SLIDE_BTN_CLASS, chipGlass(stillGlass))}
          onClick={e => {
            e.stopPropagation();
            emblaApi?.scrollPrev();
          }}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          aria-label='下一个'
          className={cn(SLIDE_BTN_CLASS, chipGlass(stillGlass))}
          onClick={e => {
            e.stopPropagation();
            emblaApi?.scrollNext();
          }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </Carousel>
  );
};

/** 新番发现条目：序号 + 竖版小封面 + 名称/评分·状态 */
const PickRow: React.FC<{ item: HomePickItem; index: number }> = ({
  item,
  index
}) => {
  const navigate = useNavigate();

  const meta = [
    // 平台同款 5→10 分制折算，星星图标更直观
    item.scoreCount > 0 ? `⭐ ${(item.score * 2).toFixed(1)}` : null,
    getStatusText(item)
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className='group flex min-w-0 cursor-pointer items-start gap-3 rounded-sm p-2 transition-colors hover:bg-border'
      onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
    >
      <span className='w-7 flex-none self-center text-center text-xl font-bold italic text-primary/25 transition-colors group-hover:text-primary/60'>
        {String(index + 1).padStart(2, '0')}
      </span>
      <CoverImage
        src={item.cover}
        className='h-14 w-10 flex-none rounded-sm'
      />
      <div className='min-w-0 flex-1'>
        <p
          className='line-clamp-1 text-sm font-medium leading-5 transition-colors group-hover:text-primary'
          title={item.name}
        >
          {item.name}
        </p>
        <p
          className='mt-1 line-clamp-1 text-xs leading-4 text-muted-foreground'
          title={meta}
        >
          {meta}
        </p>
      </div>
    </div>
  );
};

/** 首页 Hero：左侧大图轮播 + 右侧新番发现侧栏 */
const HomeHero: React.FC<{
  banners: HomeBannerItem[];
  picks: HomePickItem[];
}> = ({ banners, picks }) => {
  const navigate = useNavigate();

  if (!banners.length && !picks.length) return null;

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6'>
      {banners.length > 0 && <HeroCarousel items={banners} />}
      {/* 新番发现：无数据时整个隐藏，轮播独占整行 */}
      {picks.length > 0 && (
        <div className='flex flex-col rounded-sm bg-card p-3 animate-fade-up [animation-delay:100ms] lg:w-[320px] lg:shrink-0 xl:w-[360px]'>
          <div className='mb-2 flex items-center justify-between px-2 pt-1 lg:px-2'>
            <h2 className='text-lg font-bold'>新番发现</h2>
            <button
              aria-label='查看全部新番'
              className='flex size-8 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-border hover:text-foreground'
              onClick={() => navigate('/bangumi?sort=5')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {/* 满 4 条时两端对齐撑满轮播高度；不足时顶部对齐，避免被拉开大空隙 */}
          <div
            className={cn(
              'grid flex-1 grid-cols-1 content-between gap-1 sm:grid-cols-2 sm:content-start lg:flex lg:flex-col',
              picks.length >= 4 ? 'lg:justify-between' : 'lg:justify-start'
            )}
          >
            {picks.map((item, i) => (
              <PickRow
                key={item.animeId}
                item={item}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeHero;
