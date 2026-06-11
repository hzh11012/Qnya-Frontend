import { Compass, Flame, Shapes, SquareUserRound } from 'lucide-react';

const links = [
  {
    title: '首页',
    icon: Compass,
    url: '/'
  },
  {
    title: '专题',
    icon: Shapes,
    url: '/topic'
  },
  {
    title: '热门',
    icon: Flame,
    url: '/rank'
  },
  {
    title: '我的',
    icon: SquareUserRound,
    url: '/mine'
  }
] as const;

export { links };
