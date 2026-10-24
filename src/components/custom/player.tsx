import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import artplayerPluginHlsQualityRaw from 'artplayer-plugin-hls-quality';
// 该插件的 UMD 构建经 Vite 互操作后会多包一层 default
const artplayerPluginHlsQuality =
  (
    artplayerPluginHlsQualityRaw as unknown as {
      default: typeof artplayerPluginHlsQualityRaw;
    }
  ).default ?? artplayerPluginHlsQualityRaw;
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku';
import { cn } from '@/lib/utils';
import { getSettings, subscribeSettings, updateSettings } from '@/lib/settings';
import type { DanmakuItem } from '@/apis/play';

interface PlayerProps {
  url: string;
  time?: number;
  className?: string;
  danmaku: DanmakuItem[];
  onDanmuEmit?: (danmu: DanmakuItem) => boolean | Promise<boolean>;
  onIncrementPlay?: () => void;
  /** React 19 ref prop：暴露 getTime() 供父组件定期保存进度 */
  ref?: React.Ref<{ getTime: () => number }>;
  /** 播放器卸载时回调最后播放进度（秒）。卸载阶段 ref 已被置空，父组件需依赖此回调补存 */
  onUnmounted?: (time: number) => void;
  /** 单集播放结束回调（自动连播时由父组件切下一集） */
  onEnded?: () => void;
  /** 临近结尾回调（剩 NEAR_END_SECONDS 时触发，每次换源最多一次，供父组件预取下一集） */
  onNearEnd?: () => void;
}

const playVideo = (video: HTMLVideoElement, url: string, art: Artplayer) => {
  const withHls = art as unknown as { hls?: Hls };
  if (url.includes('.m3u8')) {
    if (Hls.isSupported()) {
      if (withHls.hls) withHls.hls.destroy();
      const hls = new Hls({ startLevel: 2 });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.LEVEL_SWITCHED, () => {
        requestAnimationFrame(() => {
          video.currentTime = Math.max(0, video.currentTime - 0.001);
        });
      });
      withHls.hls = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      art.notice.show = '不支持 M3U8 视频';
    }
  } else {
    video.src = url;
  }
};

/** 倍速可选档位 */
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** 临近结尾阈值：小于全局 staleTime 30s，保证 ended 时预取缓存仍新鲜 */
const NEAR_END_SECONDS = 20;

const Player: React.FC<PlayerProps> = ({
  url,
  time,
  className,
  danmaku,
  onDanmuEmit,
  onIncrementPlay,
  onUnmounted,
  onEnded,
  onNearEnd,
  ref
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const nearEndFiredRef = useRef(false);

  // latest-ref：初始化 effect 闭包固定，回调用 ref 取最新
  const onUnmountedRef = useRef(onUnmounted);
  const onEndedRef = useRef(onEnded);
  const onNearEndRef = useRef(onNearEnd);
  useEffect(() => {
    onUnmountedRef.current = onUnmounted;
    onEndedRef.current = onEnded;
    onNearEndRef.current = onNearEnd;
  });

  useImperativeHandle(ref, () => ({
    getTime: () => artRef.current?.currentTime ?? 0
  }));

  // 开发环境走 vite /s3 代理，绕过 s3 的 CORS 限制
  const safeUrl = import.meta.env.DEV
    ? url.replace(/^https?:\/\/s3\.qnets\.cn/, '/s3')
    : url;

  useEffect(() => {
    if (!containerRef.current || artRef.current) return;

    const art = new Artplayer({
      url: safeUrl,
      autoplay: true,
      autoSize: false,
      autoMini: false,
      loop: false,
      quality: [],
      // 倍速从齿轮面板拿出来做成控制栏独立控件（见下方 controls.add），面板不再重复展示
      playbackRate: false,
      fullscreen: true,
      fullscreenWeb: false,
      autoOrientation: true,
      aspectRatio: false,
      autoPlayback: false,
      // 倍速/连播已做成控制栏独立控件，齿轮面板只剩弹幕插件设置，入口一并隐藏
      setting: false,
      screenshot: false,
      miniProgressBar: true,
      hotkey: true,
      pip: false,
      airplay: false,
      lock: true,
      isLive: false,
      fastForward: true,
      container: containerRef.current!,
      icons: {
        loading: '<img style="width: 150px;" src="/loading.gif">',
        state: '<img style="width: 80px;" src="/state.svg">'
      },
      customType: {
        m3u8: playVideo
      },
      theme: 'var(--primary)',
      plugins: [
        // 画质插件依赖 art.hls，仅 m3u8 源注册（mp4 源会在 ready/restart 抽出异常，
        // 且异常会打断同事件的后续 handler，导致 seekTime 恢复进度失效）
        ...(url.includes('.m3u8')
          ? [
              artplayerPluginHlsQuality({
                control: true,
                setting: false,
                getResolution: level => level.height + 'p',
                title: '画质'
              })
            ]
          : []),
        artplayerPluginDanmuku({
          width: 644,
          emitter: true,
          danmuku: () => Promise.resolve(danmaku),
          beforeEmit: onDanmuEmit
        })
      ]
    });

    // 销毁时释放 hls.js 实例（切集只替换 withHls.hls，这里统一释放最新的）
    art.on('destroy', () => {
      (art as unknown as { hls?: Hls }).hls?.destroy();
    });

    const seekTime = () => {
      if (time) {
        art.seek = time;
      }
    };

    art.on('ready', seekTime);

    // 应用持久化的倍速（切源是同一个 video 元素，设置后跨集仍生效）
    if (getSettings().playbackRate !== 1) {
      art.playbackRate = getSettings().playbackRate;
    }

    // ---- 控制栏独立控件：倍速 + 自动连播 ----
    // 位置在右簇内置控件（截图20/齿轮30/全屏70）左侧。
    // 注意：artplayer 5.4 的 Control.add 漏了 return super.add(option)，
    // 返回值恒为 undefined，不能拿返回值当元素用；控件元素经 art.controls[name] 访问
    art.controls.add({
      name: 'speed',
      position: 'right',
      index: 5,
      // 不加 tooltip：selector 弹层与悬浮提示会重叠
      html: `${getSettings().playbackRate}x`,
      selector: SPEED_OPTIONS.map(value => ({
        value,
        html: `${value}x`,
        default: value === getSettings().playbackRate
      })),
      onSelect(item) {
        const rate = item.value as number;
        art.playbackRate = rate;
        updateSettings({ playbackRate: rate });
        // 返回字符串会替换控件文案
        return `${rate}x`;
      }
    });

    art.controls.add({
      name: 'autoNext',
      position: 'right',
      index: 6,
      tooltip: '自动连播',
      html: '连播',
      style: {
        color: getSettings().autoNext ? 'var(--primary)' : ''
      },
      click() {
        updateSettings({ autoNext: !getSettings().autoNext });
      }
    });

    // 设置页/其他 tab 改了设置，反向同步控件状态（update 会按 name 重建控件）
    const unsubscribeSettings = subscribeSettings(settings => {
      art.controls.update({
        name: 'speed',
        html: `${settings.playbackRate}x`,
        selector: SPEED_OPTIONS.map(value => ({
          value,
          html: `${value}x`,
          default: value === settings.playbackRate
        }))
      });
      art.controls.update({
        name: 'autoNext',
        style: { color: settings.autoNext ? 'var(--primary)' : '' }
      });
    });

    art.on('video:ended', () => {
      onEndedRef.current?.();
    });

    artRef.current = art;

    return () => {
      // 卸载顺序：子组件 cleanup 先于父组件，此刻还能读到进度，交给父组件补存
      onUnmountedRef.current?.(artRef.current?.currentTime ?? 0);
      unsubscribeSettings();
      art.off('ready', seekTime);
      art.destroy(false);
      artRef.current = null;
    };
    // 仅初始化一次，后续源切换走 switchUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // url 变化时切换视频源，并恢复该集历史进度（切到无进度的集 time 为 0，不会定位）
  const isFirstUrlRef = useRef(true);
  useEffect(() => {
    const art = artRef.current;
    if (!art) return;
    // 首次运行时初始化 effect 已加载同源，跳过
    if (isFirstUrlRef.current) {
      isFirstUrlRef.current = false;
      return;
    }

    // 自动连播场景：切源前处于 ended 状态（此时 playing=false，switchUrl
    // 只保留播放中状态），需在 canplay 后主动恢复播放
    const wasEnded = art.video?.ended === true;

    art.switchUrl(safeUrl);
    if (time) {
      art.once('video:canplay', () => {
        art.seek = time;
      });
    }
    if (wasEnded) {
      art.once('video:canplay', () => {
        void art.play();
      });
    }
    // time 与 safeUrl 同帧变化（同一集详情），无需单独依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeUrl]);

  // 播放开始时播放数 +1（每次换源只记一次）
  useEffect(() => {
    const art = artRef.current;
    if (!art) return;

    const handleTimeUpdate = () => {
      if (!art.playing) return;
      onIncrementPlay?.();
      art.off('video:timeupdate', handleTimeUpdate);
    };

    art.on('video:timeupdate', handleTimeUpdate);

    return () => {
      art.off('video:timeupdate', handleTimeUpdate);
    };
  }, [onIncrementPlay, url]);

  // 弹幕列表更新后重新加载
  useEffect(() => {
    const art = artRef.current;
    const plugin = art?.plugins?.artplayerPluginDanmuku as
      { config: (opts: object) => void; load: () => void } | undefined;
    if (plugin) {
      plugin.config({
        danmuku: danmaku,
        emitter: true
      });
      plugin.load();
    }
  }, [danmaku]);

  // 临近结尾通知：每次换源重新武装，最多触发一次
  useEffect(() => {
    nearEndFiredRef.current = false;
  }, [url]);

  useEffect(() => {
    const art = artRef.current;
    if (!art) return;

    const handleTimeUpdate = () => {
      if (nearEndFiredRef.current || !art.duration) return;
      if (art.duration - art.currentTime <= NEAR_END_SECONDS) {
        nearEndFiredRef.current = true;
        onNearEndRef.current?.();
      }
    };

    art.on('video:timeupdate', handleTimeUpdate);
    return () => {
      art.off('video:timeupdate', handleTimeUpdate);
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className={cn(
        // lg 以下父容器高度自适应，必须用 aspect-video 撑起高度；
        // md~lg 段若提前切 aspect-auto + 百分比高度，对 auto 父级解析不出，播放器会隐藏
        'w-full aspect-video mb-12 lg:mb-0 lg:aspect-auto lg:h-full',
        className
      )}
    ></div>
  );
};

export default Player;
