import { useSyncExternalStore } from 'react';

/**
 * 站点偏好设置（设备级，存 localStorage）：
 * 与主题（qnya-theme）同思路，不涉及后端；跨 tab 通过 storage 事件同步
 */
export interface Settings {
  /** 看完自动播放下一集 */
  autoNext: boolean;
  /** 播放器倍速（控制栏选速后持久化，重进播放页仍生效） */
  playbackRate: number;
  /** 播放页主题：独立于平台主题（'system' 即跟随平台主题） */
  playTheme: 'light' | 'dark' | 'system';
  /** 界面字体：CSS font-family 值，'' 为站点默认字体栈 */
  fontFamily: string;
  /** 老板键：快速伪装页面并暂停视频，热键固定为 Ctrl+Q */
  bossKey: boolean;
}

const DEFAULTS: Settings = {
  autoNext: true,
  playbackRate: 1,
  playTheme: 'dark',
  fontFamily: '',
  bossKey: true
};

/** 字体选项：内置思源黑体（@fontsource），苹方/雅黑依赖系统字体 */
export const FONT_OPTIONS = [
  { value: '', label: '系统默认' },
  {
    value: "'Noto Sans SC Variable', sans-serif",
    label: '思源黑体'
  },
  {
    value: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    label: '苹果苹方'
  },
  {
    value: "'Microsoft YaHei', 'PingFang SC', sans-serif",
    label: '微软雅黑'
  }
] as const;

const STORAGE_KEY = 'qnya-settings';

const listeners = new Set<(settings: Settings) => void>();

const read = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // 合并默认值，兼容新增设置项的历史存量数据
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    // localStorage 不可用或数据损坏时走默认值
    return DEFAULTS;
  }
};

// 快照缓存：getSnapshot 必须返回稳定引用，否则 useSyncExternalStore 死循环
let snapshot: Settings = read();

const write = (next: Settings) => {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 持久化失败不影响本会话使用
  }
  for (const listener of listeners) listener(snapshot);
};

// 其他 tab 修改时同步本 tab 快照
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) {
    snapshot = read();
    for (const listener of listeners) listener(snapshot);
  }
});

const subscribe = (listener: (settings: Settings) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

/** 响应式读取设置：设置页改动实时反映到消费方（播放器/播放页） */
export const useSettings = () => useSyncExternalStore(subscribe, getSnapshot);

/** 同步读取当前设置（非 hook，供播放器等一次性初始化场景） */
export const getSettings = getSnapshot;

/** 订阅设置变更（非 hook，返回解绑函数，供播放器等一次性初始化场景） */
export const subscribeSettings = subscribe;

/** 局部更新设置（合并式 patch） */
export const updateSettings = (patch: Partial<Settings>) =>
  write({ ...snapshot, ...patch });
