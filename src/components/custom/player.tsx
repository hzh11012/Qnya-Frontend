import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Artplayer from 'artplayer';
// light 构建：裁掉字幕/多音轨/EME（约小 37%），画质切换所需 levels/currentLevel 不受影响
import Hls from 'hls.js/light';
// 旧版 artplayer-plugin-hls-quality 已弃用（npm 标 deprecated），换官方继任者 hls-control
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';
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
  /** React 19 ref prop：暴露播放器命令式句柄（进度/播放控制，放映室同步用） */
  ref?: React.Ref<PlayerHandle>;
  /** 播放器卸载时回调最后播放进度（秒）。卸载阶段 ref 已被置空，父组件需依赖此回调补存 */
  onUnmounted?: (time: number) => void;
  /** 单集播放结束回调（自动连播时由父组件切下一集） */
  onEnded?: () => void;
  /** 媒体就绪回调（放映室据此把权威播放进度补给播放器） */
  onReady?: () => void;
  /** 临近结尾回调（剩 NEAR_END_SECONDS 时触发，每次换源最多一次，供父组件预取下一集） */
  onNearEnd?: () => void;
  /** 换源就绪回调（切集后新源可播放，供父组件恢复放映室播放状态） */
  onSwitchReady?: () => void;
  /** 本地播放事件（放映室同步用：用户主动 play/pause/seek，非同步回放触发） */
  onLocalPlay?: () => void;
  onLocalPause?: () => void;
  onLocalSeek?: (time: number) => void;
  /**
   * 只读观看模式（放映室成员端）：去掉播放/暂停、倍速、自动连播，
   * 并禁用播放热键与点击画面切换播放——播放权统一归房主，避免本地操作与房间失步。
   * 画质不在此列：那是各端本地解码档位，不同步也不影响进度。
   * 角色在房间内固定，只在播放器创建时生效。
   */
  viewerMode?: boolean;
  /**
   * 是否提供倍速控件（默认 true）。放映室关掉：倍速只作用于本地，
   * 与房间的墙钟同步会持续累积漂移，房主也一样不给。
   */
  showSpeed?: boolean;
}

/** 播放器命令式句柄 */
export interface PlayerHandle {
  getTime: () => number;
  isPlaying: () => boolean;
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
}

/**
 * 记住用户手动挑的画质档位（按「高度」记而不是按 level 索引）：
 * 换集的码率阶梯未必一样，索引会指到别的档位；`null` 表示用户在「自动」上。
 */
interface QualityMemory {
  height: number | null;
}

/** artplayer 插件表是弱类型，画质插件只在这里借一下它的 update() */
type HlsControlPlugin = { update?: () => void };

const playVideo = (
  video: HTMLVideoElement,
  url: string,
  art: Artplayer,
  quality: QualityMemory
) => {
  const withHls = art as unknown as { hls?: Hls };
  if (url.includes('.m3u8')) {
    if (Hls.isSupported()) {
      const prev = withHls.hls;
      if (prev) {
        // 换源前把当前手动档位存下来：manualLevel 为 -1 说明用户在「自动」上，
        // 那就别在下一集替他锁档
        const level =
          prev.manualLevel >= 0 ? prev.levels[prev.manualLevel] : null;
        quality.height = level?.height ?? null;
        prev.destroy();
      }
      const hls = new Hls({ startLevel: 2 });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // 恢复上一集手动选的档位；这一集没有该档位就留在自动
        const preferred = quality.height;
        if (preferred) {
          const index = hls.levels.findIndex(item => item.height === preferred);
          if (index >= 0) hls.currentLevel = index;
        }
        // 画质控件只在 ready/restart 刷新，而 restart 时清单还没解析完
        // （插件里 levels 为空直接 return），这里补一次，文案别停在上一集
        const plugin = (art.plugins as Record<string, unknown>)
          .artplayerPluginHlsControl as HlsControlPlugin | undefined;
        plugin?.update?.();
      });
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
  onReady,
  onNearEnd,
  onSwitchReady,
  onLocalPlay,
  onLocalPause,
  onLocalSeek,
  viewerMode = false,
  showSpeed = true,
  ref
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<Artplayer | null>(null);
  const nearEndFiredRef = useRef(false);
  /** 手动选的画质档位（跨换集保持，播放器实例级，刷新页面后回到自动） */
  const qualityMemoryRef = useRef<QualityMemory>({ height: null });

  // latest-ref：初始化 effect 闭包固定，回调用 ref 取最新
  const onUnmountedRef = useRef(onUnmounted);
  const onEndedRef = useRef(onEnded);
  const onReadyRef = useRef(onReady);
  const onNearEndRef = useRef(onNearEnd);
  const onSwitchReadyRef = useRef(onSwitchReady);
  const onLocalPlayRef = useRef(onLocalPlay);
  const onLocalPauseRef = useRef(onLocalPause);
  const onLocalSeekRef = useRef(onLocalSeek);
  useEffect(() => {
    onUnmountedRef.current = onUnmounted;
    onEndedRef.current = onEnded;
    onReadyRef.current = onReady;
    onNearEndRef.current = onNearEnd;
    onSwitchReadyRef.current = onSwitchReady;
    onLocalPlayRef.current = onLocalPlay;
    onLocalPauseRef.current = onLocalPause;
    onLocalSeekRef.current = onLocalSeek;
  });

  useImperativeHandle(ref, () => ({
    getTime: () => artRef.current?.currentTime ?? 0,
    isPlaying: () => artRef.current?.playing ?? false,
    seek: (time: number) => {
      if (artRef.current) artRef.current.currentTime = time;
    },
    play: () => {
      void artRef.current?.play();
    },
    pause: () => {
      artRef.current?.pause();
    }
  }));

  // 播放页直接使用后端返回的资源 URL（生产环境媒体经 nginx 同源 /media/ 下发，
  // 无跨域问题；开发环境 /api 已代理，媒体 URL 为绝对地址时需后端允许跨域）
  useEffect(() => {
    const container = containerRef.current;
    if (!container || artRef.current) return;

    const art = new Artplayer({
      url,
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
      // 成员端无播放权：热键（空格切播放）与长按快进一并关掉
      hotkey: !viewerMode,
      pip: false,
      airplay: false,
      lock: true,
      isLive: false,
      fastForward: !viewerMode,
      container,
      icons: {
        loading: '<img style="width: 150px;" src="/loading.webp">',
        state: '<img style="width: 80px;" src="/state.svg">'
      },
      customType: {
        m3u8: (video, src, art) =>
          playVideo(video, src, art, qualityMemoryRef.current)
      },
      theme: 'var(--primary)',
      plugins: [
        // 画质插件依赖 art.hls，仅 m3u8 源注册（mp4 源会在 ready/restart 抽出异常，
        // 且异常会打断同事件的后续 handler，导致 seekTime 恢复进度失效）。
        // 放映室成员端也保留：清晰度是各端自己的解码档位，不参与房间同步，
        // 弱网成员需要能手动降档（只改本地 hls 的 level，不影响播放控制权）
        ...(url.includes('.m3u8')
          ? [
              artplayerPluginHlsControl({
                quality: {
                  control: true,
                  setting: false,
                  title: '画质',
                  // hls-control 会把 currentLevel = -1 显式列成「自动」一项，
                  // 旧插件选了档位就回不到自适应，这里同时把文案中文化
                  auto: '自动',
                  getName: level => `${(level as { height: number }).height}p`
                }
              })
            ]
          : []),
        artplayerPluginDanmuku({
          emitter: true,
          danmuku: () => Promise.resolve(danmaku),
          beforeEmit: onDanmuEmit
        })
      ]
    });

    // 只读观看：保留播放/暂停图标（成员也能看出当前是播还是停），但不可点，
    // 并拦下画面上的点击。artplayer 在根节点监听 click/dblclick 调 art.toggle()，
    // 而 toggle 是只读属性（不能覆写，赋值会直接抛错打断渲染），只能在捕获阶段
    // 截住落到画面上的事件；控制栏与弹层仍可正常交互。
    const VIEWER_INTERACTIVE =
      '.art-bottom, .art-settings, .art-notice, .art-info, .art-contextmenus';
    const blockSurfaceClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(VIEWER_INTERACTIVE)) return;
      event.stopPropagation();
    };

    if (viewerMode) {
      // 图标跟随同步状态切换，只是让控件收不到点击。
      // artplayer 自带的 .art-control 样式优先级更高，用内联样式才盖得住
      const playButton = container.querySelector<HTMLElement>(
        '.art-control-playAndPause'
      );
      if (playButton) {
        playButton.style.pointerEvents = 'none';
        playButton.style.opacity = '0.35';
        playButton.setAttribute('aria-disabled', 'true');
      }

      // 进度条禁用交互：成员不能拖动/点击跳转（进度显示仍跟随房间同步）。
      // pointer-events 可继承，子元素（已播放/指示点）也一并失效
      const progress = container.querySelector<HTMLElement>('.art-progress');
      if (progress) {
        progress.style.pointerEvents = 'none';
        progress.style.cursor = 'default';
      }

      container.addEventListener('click', blockSurfaceClick, true);
      container.addEventListener('dblclick', blockSurfaceClick, true);
    }

    // 倍速固定 1x：成员端本就该跟随房间；放映室房主也不给（房间按墙钟推算进度，
    // 本地倍速会让位置持续漂移）。控制台改 rate 也会被这里立刻拉回
    if (viewerMode || !showSpeed) {
      const lockRate = () => {
        if (art.playbackRate !== 1) art.playbackRate = 1;
      };
      lockRate();
      art.on('video:ratechange', lockRate);
    }

    // 销毁时释放 hls.js 实例（切集只替换 withHls.hls，这里统一释放最新的）
    art.on('destroy', () => {
      (art as unknown as { hls?: Hls }).hls?.destroy();
    });

    // 弹幕发射器挂载位置按“视口宽度”判断，而非插件默认的“播放器宽度”：
    // PC 端侧栏可收起，播放器宽度会随收起状态变化约 380px，按播放器宽度判断会导致
    // 同一窗口下发射器位置不一致；且 artplayer 只监听 window resize，切侧栏不会触发
    // 插件重新评估。统一为：视口 < lg(1024) 外挂到播放器下方，lg 及以上内嵌控制栏。
    // 插件 resize() 只做 art.width < option.width 的比较，这里直接覆写阈值再触发重估
    const EMITTER_VIEWPORT_THRESHOLD = 1024;
    const syncDanmukuMount = () => {
      const plugin = art.plugins.artplayerPluginDanmuku as
        { option: { width: number } } | undefined;
      if (!plugin) return;
      plugin.option.width =
        window.innerWidth < EMITTER_VIEWPORT_THRESHOLD
          ? Number.MAX_SAFE_INTEGER
          : 0;
      art.emit('resize');
    };
    syncDanmukuMount();
    window.addEventListener('resize', syncDanmukuMount);

    const handleReady = () => {
      if (time) {
        art.seek = time;
      }
      // 就绪后才算真正可定位，父组件（放映室）在这里补权威进度
      onReadyRef.current?.();
    };

    art.on('ready', handleReady);

    // 应用持久化的倍速（切源是同一个 video 元素，设置后跨集仍生效）。
    // 成员端与放映室都不应用：倍速与房间不一致会持续累积漂移，只能由同步逻辑决定
    if (!viewerMode && showSpeed && getSettings().playbackRate !== 1) {
      art.playbackRate = getSettings().playbackRate;
    }

    // ---- 控制栏独立控件：倍速 + 自动连播（成员端不提供，播放权归房主） ----
    // 位置在右簇内置控件（截图20/齿轮30/全屏70）左侧。
    // 注意：artplayer 5.4 的 Control.add 漏了 return super.add(option)，
    // 返回值恒为 undefined，不能拿返回值当元素用；控件元素经 art.controls[name] 访问
    let unsubscribeSettings = () => {};

    if (!viewerMode) {
      if (showSpeed) {
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
      }

      // 连播图标（lucide Repeat，stroke=currentColor 以便高亮色生效）
      const AUTO_NEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`;

      art.controls.add({
        name: 'autoNext',
        position: 'right',
        index: 6,
        tooltip: '自动连播',
        html: AUTO_NEXT_ICON,
        style: {
          color: getSettings().autoNext ? 'var(--primary)' : ''
        },
        click() {
          updateSettings({ autoNext: !getSettings().autoNext });
        }
      });

      // 设置页/其他 tab 改了设置，反向同步控件状态（update 会按 name 重建控件）
      unsubscribeSettings = subscribeSettings(settings => {
        if (showSpeed) {
          art.controls.update({
            name: 'speed',
            html: `${settings.playbackRate}x`,
            selector: SPEED_OPTIONS.map(value => ({
              value,
              html: `${value}x`,
              default: value === settings.playbackRate
            }))
          });
        }
        art.controls.update({
          name: 'autoNext',
          style: { color: settings.autoNext ? 'var(--primary)' : '' }
        });
      });
    }

    art.on('video:ended', () => {
      onEndedRef.current?.();
    });

    // 本地播放事件：供放映室区分“用户主动操作”与“同步回放”
    art.on('video:play', () => onLocalPlayRef.current?.());
    art.on('video:pause', () => onLocalPauseRef.current?.());
    art.on('video:seeked', () => onLocalSeekRef.current?.(art.currentTime));

    artRef.current = art;

    return () => {
      // 卸载顺序：子组件 cleanup 先于父组件，此刻还能读到进度，交给父组件补存
      onUnmountedRef.current?.(artRef.current?.currentTime ?? 0);
      unsubscribeSettings();
      window.removeEventListener('resize', syncDanmukuMount);
      if (viewerMode) {
        container.removeEventListener('click', blockSurfaceClick, true);
        container.removeEventListener('dblclick', blockSurfaceClick, true);
      }
      art.off('ready', handleReady);
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

    art.switchUrl(url);
    // 新源可播放：先补定位，再通知父组件（放映室据此在换集后恢复播放）
    art.once('video:canplay', () => {
      if (time) art.seek = time;
      onSwitchReadyRef.current?.();
    });
    if (wasEnded) {
      art.once('video:canplay', () => {
        void art.play();
      });
    }
    // time 与 url 同帧变化（同一集详情），无需单独依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
      // 成员端标记：global.css 据此压掉进度条 hover 指示点（进度只展示，不能拖）
      data-viewer-mode={viewerMode ? 'true' : undefined}
      className={cn(
        // lg 以下父容器高度自适应，必须用 aspect-video 撑起高度；
        // md~lg 段若提前切 aspect-auto + 百分比高度，对 auto 父级解析不出，播放器会隐藏
        'w-full aspect-video mb-12 lg:mb-0 lg:aspect-auto lg:h-full',
        className
      )}
    ></div>
  );
};

// 播放器是纯命令式的（artplayer 实例只建一次），props 不变就不该重渲：
// 放映室的成员进出、切 tab、开关弹窗都会让页面重渲，memo 后播放器不跟着走
export default React.memo(Player);
