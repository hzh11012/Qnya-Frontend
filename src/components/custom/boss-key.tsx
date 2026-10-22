import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  FileText,
  Image,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2
} from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { comboFromEvent } from '@/lib/keyboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const DISGUISE_TITLE = '学习资料 - 在线文档';
/** 固定热键：Ctrl+Q（简洁易盲按） */
const BOSS_COMBO = 'ctrl+KeyQ';
/** 伪装用 favicon：文档 emoji 的 SVG data URI，无需额外资源文件 */
const DISGUISE_FAVICON =
  'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>';

/** 伪装成在线文档的整页遮罩：跟随站点深/浅主题，内容为真实文字而非占位骨架 */
const DisguisePage = () => {
  // 挂载（即触发伪装）时刻的真实时间，作为「最近编辑」展示
  const now = new Date();
  const editTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      className='fixed inset-0 z-[10000] flex flex-col overflow-hidden bg-background text-foreground select-none'
      aria-hidden
    >
      {/* 顶栏：文档图标 + 标题 + 操作区，仿在线文档布局 */}
      <div className='flex h-13 flex-none items-center gap-3 border-b border-border px-4 md:px-6'>
        <div className='flex size-8 flex-none items-center justify-center rounded-sm bg-primary text-primary-foreground'>
          <FileText className='size-4.5' />
        </div>
        <div className='min-w-0'>
          <div className='truncate text-sm font-medium'>
            学习笔记（持续更新）
          </div>
          <div className='text-xs text-muted-foreground'>已自动保存</div>
        </div>
        <div className='ml-auto flex items-center gap-3'>
          <div className='hidden h-7 items-center rounded-sm bg-primary px-4 text-xs text-primary-foreground sm:flex'>
            分享
          </div>
          <Avatar className='size-7'>
            <AvatarFallback className='text-xs'>记</AvatarFallback>
          </Avatar>
        </div>
      </div>
      {/* 工具栏：真实编辑器图标 */}
      <div className='flex h-10 flex-none items-center gap-1 border-b border-border px-4 md:px-6 text-muted-foreground'>
        {[Undo2, Redo2, Bold, Italic, Underline, List, ListOrdered, Image].map(
          (Icon, i) => (
            <div
              key={i}
              className='flex size-7 items-center justify-center rounded-sm'
            >
              <Icon className='size-4' />
            </div>
          )
        )}
      </div>
      {/* 正文：真实笔记内容 */}
      <div className='flex-1 overflow-hidden'>
        <div className='mx-auto h-full w-full max-w-3xl overflow-y-auto px-6 py-10'>
          <h1 className='text-xl font-bold'>前端开发学习笔记</h1>
          <p className='mt-1.5 text-xs text-muted-foreground'>
            最近编辑：今天 {editTime}
          </p>
          <h2 className='mt-8 text-base font-semibold'>
            一、组件化设计的几个原则
          </h2>
          <p className='mt-3 text-sm leading-7'>
            组件拆分的粒度一直是讨论最多的议题。拆得太细会导致状态提升和跨组件通信的成本陡增，拆得太粗则失去复用价值。比较务实的做法是先按业务语义切出粗粒度模块，等出现真实复用需求时再向下抽取，避免一开始就为了抽象而抽象。
          </p>
          <p className='mt-3 text-sm leading-7'>
            状态管理方面，服务端状态和客户端状态应该分开处理。服务端数据交给缓存层管理，组件只消费；本地
            UI 状态尽量收敛在最近的公共父级，只有真正全局的状态才提升到顶层。
          </p>
          <h2 className='mt-8 text-base font-semibold'>二、本周待办</h2>
          <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-6'>
            <li>整理公共请求层的错误处理约定，补充超时与重试策略</li>
            <li>排查移动端长列表滚动掉帧问题，必要时引入虚拟滚动</li>
            <li>补齐核心流程的单元测试，覆盖率目标 70%</li>
            <li>评审新同学的设计稿，标注需要后端配合的字段</li>
          </ul>
          <h2 className='mt-8 text-base font-semibold'>三、参考资料</h2>
          <p className='mt-3 text-sm leading-7'>
            官方文档永远是第一手资料，其次才是社区的最佳实践总结。遇到难以复现的渲染问题，优先用时间线面板定位，而不是靠猜。
          </p>
        </div>
      </div>
    </div>
  );
};

/** 老板键：按下固定组合键时在「伪装页」与正常页面间切换，激活时暂停全部视频并替换标题/favicon */
const BossKey = () => {
  const { bossKey } = useSettings();
  const [active, setActive] = useState(false);
  const prevTitleRef = useRef('');
  const prevFaviconRef = useRef<string | null>(null);

  // 热键：全局监听；e.code 归一化不受输入法影响
  useEffect(() => {
    if (!bossKey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (comboFromEvent(e) !== BOSS_COMBO) return;
      e.preventDefault();
      setActive(v => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bossKey]);

  // 激活/恢复：切标题、favicon，暂停页面内全部视频
  useEffect(() => {
    if (active) {
      prevTitleRef.current = document.title;
      document.title = DISGUISE_TITLE;

      const icon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      prevFaviconRef.current = icon?.href ?? null;
      if (icon) {
        icon.href = DISGUISE_FAVICON;
      }

      document.querySelectorAll('video').forEach(video => {
        if (!video.paused) {
          video.pause();
        }
      });
    } else if (prevTitleRef.current) {
      document.title = prevTitleRef.current;
      if (prevFaviconRef.current) {
        const icon =
          document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
        if (icon) {
          icon.href = prevFaviconRef.current;
        }
      }
    }
  }, [active]);

  if (!active) return null;
  return <DisguisePage />;
};

export default BossKey;
