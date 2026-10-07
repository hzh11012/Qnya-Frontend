import React, { memo, useEffect, useRef } from 'react';
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
import type { DanmakuItem } from '@/apis/play';

interface PlayerProps {
  url: string;
  time?: number;
  className?: string;
  danmaku: DanmakuItem[];
  onDanmuEmit?: (danmu: DanmakuItem) => boolean | Promise<boolean>;
  onIncrementPlay?: () => void;
  onHistoryEmit?: (time: number) => void;
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
      art.on('destroy', () => hls.destroy());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      art.notice.show = '不支持 M3U8 视频';
    }
  } else {
    video.src = url;
  }
};

const Player: React.FC<PlayerProps> = memo(
  ({
    url,
    time,
    className,
    danmaku,
    onDanmuEmit,
    onIncrementPlay,
    onHistoryEmit
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const artRef = useRef<Artplayer | null>(null);
    const lastTimeRef = useRef(0);

    // 开发环境走 vite /s3 代理，绕过 s3 的 CORS 限制
    const safeUrl = import.meta.env.DEV
      ? url.replace(/^https?:\/\/s3\.qnets\.cn/, '/s3')
      : url;

    useEffect(() => {
      if (!ref.current || artRef.current) return;

      const art = new Artplayer({
        url: safeUrl,
        autoplay: true,
        autoSize: false,
        autoMini: false,
        loop: false,
        quality: [],
        playbackRate: true,
        fullscreen: true,
        fullscreenWeb: false,
        autoOrientation: true,
        aspectRatio: false,
        autoPlayback: false,
        setting: false,
        screenshot: false,
        miniProgressBar: true,
        hotkey: true,
        pip: false,
        airplay: false,
        lock: true,
        isLive: false,
        fastForward: true,
        container: ref.current!,
        icons: {
          loading: '<img style="width: 150px;" src="/loading.gif">',
          state: '<img style="width: 80px;" src="/state.svg">'
        },
        customType: {
          m3u8: playVideo
        },
        theme: 'var(--primary)',
        plugins: [
          artplayerPluginHlsQuality({
            control: true,
            setting: false,
            getResolution: level => level.height + 'p',
            title: '画质'
          }),
          artplayerPluginDanmuku({
            width: 644,
            emitter: true,
            danmuku: () => Promise.resolve(danmaku),
            beforeEmit: onDanmuEmit
          })
        ]
      });

      const seekTime = () => {
        if (time) {
          art.seek = time;
        }
      };

      const saveTime = () => {
        lastTimeRef.current = art.currentTime;
      };

      art.on('ready', seekTime);
      art.on('video:timeupdate', saveTime);

      artRef.current = art;

      return () => {
        art.off('ready', seekTime);
        art.off('video:timeupdate', saveTime);
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

      art.switchUrl(safeUrl);
      if (time) {
        art.once('video:canplay', () => {
          art.seek = time;
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

    // 页面关闭/组件卸载时保存进度
    useEffect(() => {
      const save = () => {
        onHistoryEmit?.(lastTimeRef.current);
      };

      window.addEventListener('beforeunload', save);

      return () => {
        window.removeEventListener('beforeunload', save);
        save();
      };
    }, [onHistoryEmit]);

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

    return (
      <div
        ref={ref}
        className={cn(
          'w-full aspect-video mb-12 md:mb-0 md:aspect-auto md:h-[calc(100%-3rem)] lg:h-full',
          className
        )}
      ></div>
    );
  }
);

export default Player;
