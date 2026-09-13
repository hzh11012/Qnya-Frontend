import { useCallback, useEffect, useRef, useState } from 'react';

export interface FlyDanmaku {
  id: number;
  x: number;
  y: number;
  text: string;
  duration: number;
}

const DANMAKU_TEXTS = [
  '23333',
  '前方高能',
  'awsl',
  '名场面打卡',
  '好活当赏',
  '爷青回',
  '泪目',
  '有生之年',
  '666',
  'DNA动了',
  '下集一定',
  '弹幕护体',
  '这帧太美了',
  '打卡',
  '非战斗人员请撤离',
  '一整个爱住',
  '梦开始的地方',
  '考古成功',
  '童年回来了',
  '角度刁钻'
];

/** 两次发射的最小间隔（ms） */
const SPAWN_INTERVAL = 300;
/** 弹幕飞行速度（px/s） */
const FLY_SPEED = 110;
/** 飞出左边缘的额外缓冲（px） */
const EDGE_MARGIN = 80;
/** 淡出动画预留时间（ms） */
const FADE_ALLOWANCE = 200;

export const useFlyDanmaku = () => {
  const [flies, setFlies] = useState<FlyDanmaku[]>([]);
  const flyIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach(timer => window.clearTimeout(timer));
      timersRef.current = [];
    },
    []
  );

  const onBackgroundClick = useCallback((e: React.MouseEvent) => {
    // 只有真正点在背景上才触发，表单/按钮等子元素点击忽略
    if (e.target !== e.currentTarget) return;
    const now = Date.now();
    if (now - lastSpawnRef.current < SPAWN_INTERVAL) return;
    lastSpawnRef.current = now;

    const id = ++flyIdRef.current;
    const duration = (e.clientX + EDGE_MARGIN) / FLY_SPEED;
    const fly: FlyDanmaku = {
      id,
      x: e.clientX,
      y: e.clientY,
      text: DANMAKU_TEXTS[Math.floor(Math.random() * DANMAKU_TEXTS.length)],
      duration
    };
    setFlies(list => [...list, fly]);
    timersRef.current.push(
      window.setTimeout(
        () => {
          setFlies(list => list.filter(item => item.id !== id));
        },
        duration * 1000 + FADE_ALLOWANCE
      )
    );
  }, []);

  return { flies, onBackgroundClick };
};
