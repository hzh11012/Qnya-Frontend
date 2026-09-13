import type { CSSProperties } from 'react';
import type { FlyDanmaku } from '@/pages/login/use-fly-danmaku';

interface AmbientDanmaku {
  text: string;
  /** 距顶部百分比 */
  top: string;
  /** 循环时长（s） */
  duration: number;
  /** 负延迟，让弹幕在页面打开时就已散布在途中 */
  delay: number;
  size: 'xs' | 'sm';
}

const AMBIENT_DANMAKU: AmbientDanmaku[] = [
  { text: '爷青回', top: '6%', duration: 44, delay: -18, size: 'xs' },
  { text: '23333', top: '14%', duration: 34, delay: -6, size: 'sm' },
  { text: '前方高能', top: '24%', duration: 27, delay: -15, size: 'xs' },
  { text: '泪目', top: '33%', duration: 46, delay: -36, size: 'xs' },
  { text: '磕到了', top: '46%', duration: 38, delay: -8, size: 'xs' },
  { text: 'awsl', top: '56%', duration: 40, delay: -30, size: 'sm' },
  { text: '名场面打卡', top: '70%', duration: 30, delay: -12, size: 'xs' },
  { text: '好活当赏', top: '84%', duration: 36, delay: -22, size: 'sm' },
  { text: '有生之年', top: '92%', duration: 42, delay: -25, size: 'xs' }
];

const SIZE_CLASS: Record<AmbientDanmaku['size'], string> = {
  xs: 'text-[11px] text-muted/40',
  sm: 'text-xs text-muted/60'
};

const PILL_BASE =
  'absolute left-0 rounded-full border border-border/50 bg-card/40 px-3 py-1 whitespace-nowrap backdrop-blur-sm';

/** 环境弹幕胶囊 */
const AmbientPill = ({ item }: { item: AmbientDanmaku }) => (
  <span
    className={`${PILL_BASE} ${SIZE_CLASS[item.size]}`}
    style={{
      top: item.top,
      animation: `danmaku ${item.duration}s linear infinite`,
      animationDelay: `${item.delay}s`
    }}
  >
    {item.text}
  </span>
);

/** 登录页背景层：斜向漂移网格 + 环境弹幕 */
export const LoginBackground = () => (
  <div
    aria-hidden
    className='animate-fade-in pointer-events-none absolute inset-0 overflow-hidden'
  >
    {/* 斜向网格：缓慢漂移 */}
    <div className='animate-[drift_16s_linear_infinite] absolute -inset-1/2 rotate-12 bg-grid opacity-70' />
    {AMBIENT_DANMAKU.map(item => (
      <AmbientPill
        key={item.text}
        item={item}
      />
    ))}
  </div>
);

/** 登录页注脚：手机端底部居中，桌面端右缘竖排 */
export const LoginFootnotes = () => (
  <>
    <div className='absolute inset-x-0 bottom-5 select-none text-center font-display text-[10px] uppercase tracking-[0.35em] text-muted/70 lg:hidden'>
      Qnya Platform
    </div>
    <div
      aria-hidden
      className='pointer-events-none absolute top-1/2 right-5 hidden -translate-y-1/2 select-none font-display text-[11px] uppercase tracking-[0.4em] text-muted/70 [writing-mode:vertical-rl] lg:block'
    >
      Qnya Platform
    </div>
  </>
);

/** 点击发出弹幕的渲染层，位于表单之下 */
export const FlyDanmakuLayer = ({ flies }: { flies: FlyDanmaku[] }) => (
  <div
    aria-hidden
    className='pointer-events-none fixed inset-0'
  >
    {flies.map(fly => (
      <span
        key={fly.id}
        className='animate-[danmaku-fly_linear_forwards] absolute rounded-full border border-border/50 bg-card/40 px-3 py-1 text-xs text-muted/60 whitespace-nowrap backdrop-blur-sm'
        style={
          {
            left: fly.x,
            top: fly.y,
            animationDuration: `${fly.duration}s`,
            '--fly': `-${fly.x + 80}px`
          } as CSSProperties
        }
      >
        {fly.text}
      </span>
    ))}
  </div>
);
