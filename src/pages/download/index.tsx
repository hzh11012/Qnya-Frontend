import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DownloadIcon,
  Globe,
  Laptop,
  Maximize,
  Minimize,
  Monitor,
  Pause,
  Play,
  Sparkle,
  TabletSmartphone,
  type LucideIcon
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/use-document-title';
import Logo from '@/components/custom/logo';
import ThemeSwitch from '@/components/custom/theme-switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { getLatestRelease, type LatestRelease } from '@/apis/app';
import { cn } from '@/lib/utils';

/** 漫画风弹幕（面板内横穿）：全部同一样式，靠大小与时机做节奏 */
interface MangaDanmaku {
  text: string;
  /** 距面板顶部百分比 */
  top: string;
  /** 循环时长（s） */
  duration: number;
  /** 负延迟，让弹幕在进页面时就已散布在途中 */
  delay: number;
  size: 'sm' | 'md';
}

/** 弹幕词池：每次进入页面随机取词、随机航道与速度 */
const DANMAKU_TEXTS = [
  '前方高能',
  '爷青回',
  '23333',
  '泪目',
  'awsl',
  '好活当赏',
  '有生之年',
  '名场面打卡',
  '磕到了',
  '版本上新',
  '哈哈哈哈',
  '哔——'
];

/** 生成一条随机弹幕：随机词、随机航道（8%~88%）、随机速度与入场延迟 */
const randomDanmaku = (): MangaDanmaku => ({
  text: DANMAKU_TEXTS[Math.floor(Math.random() * DANMAKU_TEXTS.length)]!,
  top: `${8 + Math.random() * 80}%`,
  duration: 14 + Math.random() * 12,
  delay: -Math.random() * 20,
  size: Math.random() > 0.5 ? 'md' : 'sm'
});

/** 同屏弹幕数量 */
const DANMAKU_COUNT = 9;

const SIZE_CLASS: Record<MangaDanmaku['size'], string> = {
  sm: 'text-xs md:text-sm',
  md: 'text-sm md:text-base'
};

/** 弹幕文字样式（环境弹幕共用）：无底框，实心字 + 底色描边，贴近真实弹幕 */
const DANMAKU_TEXT_CLASS =
  'whitespace-nowrap font-display font-bold text-foreground/60 [-webkit-text-stroke:2px_var(--card)] [paint-order:stroke_fill]';

/** 环境弹幕：left-full 定位在面板右缘外，动画（danmaku-panel）横穿整个面板 */
const AmbientPill = ({ item }: { item: MangaDanmaku }) => (
  <span
    className={cn(
      'absolute left-full whitespace-nowrap',
      DANMAKU_TEXT_CLASS,
      SIZE_CLASS[item.size]
    )}
    style={{
      top: item.top,
      animation: `danmaku-panel ${item.duration}s linear infinite`,
      animationDelay: `${item.delay}s`
    }}
  >
    {item.text}
  </span>
);

/** 即将支持的平台（仅预告，不发放下载） */
const UPCOMING: { name: string; icon: LucideIcon }[] = [
  { name: 'Windows', icon: Monitor },
  { name: 'iOS', icon: TabletSmartphone },
  { name: 'macOS', icon: Laptop }
];

/** 二维码内容：APK 直链转绝对 URL（相对路径按当前站点解析），解析失败回退原文 */
const toAbsoluteUrl = (url: string) => {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
};

/** 放送场景的漫画云：同色 group 整体压透明度，重叠处不叠加发深 */
const Cloud = ({
  className,
  duration = '6s',
  delay = '0s'
}: {
  className?: string;
  duration?: string;
  delay?: string;
}) => (
  <svg
    aria-hidden
    viewBox='0 0 64 30'
    className={cn(
      'absolute animate-[float_6s_ease-in-out_infinite]',
      className
    )}
    style={{ animationDuration: duration, animationDelay: delay }}
  >
    <g
      className='fill-primary'
      opacity='0.1'
    >
      <circle
        cx='20'
        cy='18'
        r='10'
      />
      <circle
        cx='34'
        cy='13'
        r='12'
      />
      <circle
        cx='47'
        cy='19'
        r='9'
      />
      <rect
        x='11'
        y='16'
        width='44'
        height='12'
        rx='6'
      />
    </g>
  </svg>
);

/**
 * 客户端下载 / 宣发页：无需登录，独立于主布局。
 * 漫画分镜视觉：主分镜（虚线墨线框 + 取景角标）是唯一的重墨，
 * 居中题字 + 四角不对称的场景元素；屏幕里弹幕横穿，控制栏可播放/暂停与全屏，
 * Android 版本信息来自 /api/app/latest（公开接口），其余平台在「次回予告」预告
 */
const DownloadPage: React.FC = () => {
  useDocumentTitle('下载');
  const { data: release, isPending } = useQuery({
    queryKey: ['app-latest-release', 'android'],
    queryFn: () => getLatestRelease({ platform: 'android' })
  });
  const latest: LatestRelease | undefined = release ?? undefined;
  const qrValue = latest ? toAbsoluteUrl(latest.url) : undefined;

  const [danmakuOn, setDanmakuOn] = React.useState(true);
  const [playing, setPlaying] = React.useState(true);
  // 弹幕在挂载时随机生成一次：同一次访问内稳定，刷新后换一批
  const [danmakuList] = React.useState<MangaDanmaku[]>(() =>
    Array.from({ length: DANMAKU_COUNT }, () => randomDanmaku())
  );
  const [fullscreen, setFullscreen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  /** 全屏状态跟随浏览器（ESC 退出也能同步图标） */
  React.useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  /** 全屏 / 退出全屏：对主分镜面板生效 */
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void panelRef.current?.requestFullscreen();
    }
  };

  return (
    <div className='relative flex min-h-dvh flex-col overflow-hidden'>
      {/* 页面底色：网点 + 同心圆盘 + 速度线 */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 overflow-hidden'
      >
        <div className='absolute inset-0 bg-dots opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent_75%)]' />
        {/* 两簇同心圆盘：呼应屏幕里的网点，图形化而不喧宾 */}
        <div className='absolute -right-28 -top-32 size-96 rounded-full border border-primary/10' />
        <div className='absolute -right-20 -top-24 size-72 rounded-full bg-primary/[0.05]' />
        <div className='absolute -left-24 bottom-[-4rem] size-64 rounded-full border border-primary/10' />
        <div className='absolute -left-16 bottom-[-2.5rem] size-48 rounded-full bg-primary/[0.05]' />
        <Sparkle
          aria-hidden
          className='absolute left-[16%] top-[24%] size-4 animate-pulse text-primary/40'
          style={{ animationDelay: '0s' }}
        />
        <Sparkle
          aria-hidden
          className='absolute right-[18%] top-[58%] size-3 animate-pulse text-primary/40'
          style={{ animationDelay: '0.8s' }}
        />
        <div className='absolute left-[28%] top-[16%] h-[3px] w-44 -rotate-12 rounded-full bg-foreground/10' />
        <div className='absolute right-[30%] top-[30%] h-[3px] w-56 -rotate-12 rounded-full bg-foreground/10' />
        <div className='absolute bottom-[18%] left-[42%] h-[3px] w-48 -rotate-12 rounded-full bg-foreground/10' />
      </div>

      {/* 顶栏：返回入口 + 主题切换 */}
      <header className='relative z-10 flex shrink-0 items-center justify-between px-5 py-4 md:px-8'>
        <Link
          to='/'
          title='打开网页版'
        >
          <Logo
            type='favicon'
            className='size-9'
          />
        </Link>
        <div className='flex items-center gap-3'>
          <ThemeSwitch className='flex size-10 items-center justify-center' />
        </div>
      </header>

      <main className='relative flex flex-1 flex-col'>
        {/* 主分镜：正在放送的屏幕 */}
        <section className='relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-7 md:px-8 md:py-12'>
          <div className='relative w-full'>
            <div
              ref={panelRef}
              className={cn(
                '@container relative flex min-h-80 flex-col overflow-hidden rounded-2xl border-2 border-dashed border-foreground/60 bg-card shadow-[0_24px_50px_-20px_rgba(0,0,0,0.3)]',
                // 暂停：冻结画面里所有动画（弹幕、云、闪光）
                !playing && '[&_*]:![animation-play-state:paused]'
              )}
            >
              {/* 取景框四角：这是块真的在放送的屏幕 */}
              <span
                aria-hidden
                className='absolute left-3 top-3 z-20 size-5 rounded-tl-sm border-l-2 border-t-2 border-foreground/35'
              />
              <span
                aria-hidden
                className='absolute right-3 top-3 z-20 size-5 rounded-tr-sm border-r-2 border-t-2 border-foreground/35'
              />
              <span
                aria-hidden
                className='absolute bottom-3 left-3 z-20 size-5 rounded-bl-sm border-b-2 border-l-2 border-foreground/35'
              />
              <span
                aria-hidden
                className='absolute bottom-3 right-3 z-20 size-5 rounded-br-sm border-b-2 border-r-2 border-foreground/35'
              />

              {/* 放送中：播放画面左上角的直播指示 */}
              <div className='absolute left-6 top-6 z-20 flex items-center gap-2 text-xs text-foreground/70 select-none'>
                <span className='relative flex size-2'>
                  <span className='absolute inline-flex size-full animate-ping rounded-full bg-primary/60' />
                  <span className='relative inline-flex size-2 rounded-full bg-primary' />
                </span>
                放送中
              </div>

              {/* 网点纸 */}
              <div
                aria-hidden
                className='absolute inset-0 bg-dots opacity-60'
              />

              {/* 放送场景：漂云与闪光 */}
              <Cloud
                className='left-[7%] top-[15%] w-16 md:w-24'
                duration='7s'
                delay='-2s'
              />
              <Cloud
                className='right-[9%] top-[52%] w-12 md:w-20'
                duration='9s'
                delay='-4s'
              />
              <Sparkle
                aria-hidden
                className='absolute left-[12%] top-[30%] size-4 animate-pulse text-primary/50'
                style={{ animationDelay: '0s' }}
              />
              <Sparkle
                aria-hidden
                className='absolute right-[13%] top-[22%] size-3 animate-pulse text-primary/50'
                style={{ animationDelay: '0.6s' }}
              />
              <Sparkle
                aria-hidden
                className='absolute right-[22%] top-[64%] size-3 animate-pulse text-primary/40'
                style={{ animationDelay: '0.3s' }}
              />

              {/* 环境弹幕 */}
              <div
                aria-hidden
                className={cn(
                  'absolute inset-0 overflow-hidden transition-opacity duration-300',
                  !danmakuOn && 'opacity-0'
                )}
              >
                {danmakuList.map((item, index) => (
                  <AmbientPill
                    key={index}
                    item={item}
                  />
                ))}
              </div>

              {/* 屏幕内容：画面区严格 16:9（lg 起），控制栏挂在画面下方 —— 真实播放器的结构 */}
              <div
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-14 text-center md:px-12 md:py-10 lg:flex-none lg:aspect-video',
                  // 全屏时画面区撑满视口，不再锁 16:9
                  fullscreen && 'lg:aspect-auto lg:flex-1'
                )}
              >
                <h1 className='animate-fade-up font-display text-3xl leading-snug font-bold text-foreground md:text-5xl [animation-delay:90ms]'>
                  <span className='block whitespace-nowrap md:-translate-x-4'>
                    把喜欢的番剧，
                  </span>
                  <span className='block whitespace-nowrap md:translate-x-4'>
                    放在
                    <span className='relative inline-block whitespace-nowrap text-primary'>
                      同一个地方
                      {/* 笔触高亮线：微微倾斜，手绘感 */}
                      <span
                        aria-hidden
                        className='absolute inset-x-0 bottom-[0.06em] h-[0.14em] -rotate-1 rounded-full bg-primary/30'
                      />
                    </span>
                  </span>
                </h1>

                <div className='animate-fade-up mt-12 flex flex-col items-center gap-6 md:mt-20 md:flex-row md:gap-10 [animation-delay:230ms]'>
                  <div className='flex flex-col items-center gap-3'>
                    {isPending ? (
                      <Skeleton className='h-11 w-52 rounded-xl md:h-13 md:w-60' />
                    ) : (
                      <Button
                        asChild={!!latest}
                        disabled={!latest}
                        className='h-11 rounded-xl px-8 text-sm shadow-lg shadow-primary/30 md:h-13 md:px-10 md:text-base'
                      >
                        {latest ? (
                          <a
                            href={latest.url}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <DownloadIcon />
                            Android
                          </a>
                        ) : (
                          'Android'
                        )}
                      </Button>
                    )}
                    <div className='text-xs text-muted-foreground select-none'>
                      {isPending
                        ? '正在获取最新版本…'
                        : latest
                          ? `v${latest.versionName} · 官方直链`
                          : '第一个版本正在准备中'}
                    </div>
                  </div>

                  {/* 扫码下载：紧挨下载按钮（移动端本机直接下载，不展示） */}
                  {latest && qrValue && (
                    <div className='hidden flex-col items-center gap-2 md:flex'>
                      <div className='rotate-2 rounded-xl bg-white p-3 shadow-[0_14px_35px_-12px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10'>
                        <QRCodeSVG
                          value={qrValue}
                          size={120}
                          level='M'
                          fgColor='#18181b'
                          bgColor='#ffffff'
                        />
                      </div>
                      <div className='text-xs font-medium text-muted-foreground select-none'>
                        手机扫码，直接下载
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 播放器 chrome：进度条 + 时间 + 弹幕开关 + 全屏 */}
              <div className='relative border-t-2 border-foreground/10 px-6 py-4 md:px-12'>
                <div className='flex items-center gap-2 md:gap-3'>
                  <button
                    type='button'
                    title={playing ? '暂停' : '播放'}
                    onClick={e => {
                      // 不让播放控制触发面板的发射弹幕
                      e.stopPropagation();
                      setPlaying(p => !p);
                    }}
                    className='flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors select-none hover:bg-foreground/5 hover:text-foreground'
                  >
                    {playing ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <div className='h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10'>
                    <div className='h-full w-[72%] rounded-full bg-primary bg-[image:repeating-linear-gradient(45deg,transparent_0_6px,rgba(255,255,255,0.25)_6px_12px)]' />
                  </div>
                  <span className='hidden shrink-0 font-display text-[11px] tracking-[0.18em] text-muted-foreground select-none sm:inline'>
                    23:33 / 24:00
                  </span>
                  <button
                    type='button'
                    onClick={e => {
                      // 不让 toggle 触发面板的发射弹幕
                      e.stopPropagation();
                      setDanmakuOn(on => !on);
                    }}
                    className={cn(
                      'cursor-pointer rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold transition-colors select-none',
                      danmakuOn
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-foreground/25 text-muted-foreground'
                    )}
                  >
                    弹幕 {danmakuOn ? '开' : '关'}
                  </button>
                  <button
                    type='button'
                    title={fullscreen ? '退出全屏' : '全屏观看'}
                    onClick={e => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className='flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors select-none hover:bg-foreground/5 hover:text-foreground'
                  >
                    {fullscreen ? (
                      <Minimize size={15} />
                    ) : (
                      <Maximize size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 次回予告：未上线平台 */}
        <section className='relative z-10 mx-auto mt-10 w-full max-w-5xl px-5 md:mt-12 md:px-8'>
          <div className='flex flex-wrap items-center justify-center gap-x-7 gap-y-3'>
            <span className='inline-block -rotate-3 rounded-sm border-2 border-primary px-2 py-0.5 font-display text-xs font-bold tracking-[0.2em] text-primary select-none'>
              次回予告
            </span>
            {UPCOMING.map(({ name, icon: Icon }) => (
              <span
                key={name}
                className='inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80'
              >
                <Icon
                  size={15}
                  className='text-muted-foreground'
                />
                {name}
                <span className='text-xs text-muted-foreground/70'>筹备中</span>
              </span>
            ))}
            <span
              aria-hidden
              className='hidden h-4 w-px bg-border sm:block'
            />
            <Link
              to='/'
              className='inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80'
            >
              <Globe
                size={15}
                className='text-primary/70'
              />
              Web
            </Link>
          </div>
        </section>
      </main>

      {/* 页脚：收束一句 */}
      <footer className='relative z-10 mx-auto mt-12 w-full max-w-5xl px-5 pb-12 text-center md:px-8'>
        <p className='text-sm text-muted-foreground select-none'>
          愿每一部追过的番，都有始有终。
        </p>
      </footer>
    </div>
  );
};

export default DownloadPage;
