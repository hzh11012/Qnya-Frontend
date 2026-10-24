import React from 'react';
import { ExternalLink, UserRound } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  useSettings,
  updateSettings,
  FONT_OPTIONS,
  type Settings
} from '@/lib/settings';
import { useTheme, type Theme } from '@/components/custom/theme-context';
import { useAuthStore } from '@/store/auth';
import { useShallow } from 'zustand/react/shallow';
import { useLogout } from '@/hooks/use-logout';

/** 友情链接（{ name, url }，填入后自动展示） */
const FRIEND_LINKS = [] as const;

/** 设置行：标题在上，控件在下（B 站客户端风格）；hint 为标题后行内括号说明 */
const SettingRow: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <div className='py-2.5'>
    <div className='text-sm font-medium text-muted-foreground'>
      {title}
      {hint && <span className='text-muted-foreground'>{hint}</span>}
    </div>
    <div className='mt-2'>{children}</div>
  </div>
);

const Settings: React.FC = () => {
  useDocumentTitle('设置');
  const { autoNext, playTheme, fontFamily, bossKey } = useSettings();
  const { theme, setTheme } = useTheme();
  const { name, avatar } = useAuthStore(
    useShallow(state => ({
      name: state.user?.name ?? '',
      avatar: state.user?.avatar ?? ''
    }))
  );
  const { mutate: logout, isPending: logoutLoading } = useLogout();

  return (
    <div className='my-4 md:my-8'>
      {/* 用户信息 */}
      <div className='flex items-center gap-4 pb-6 border-b border-border dark:border-border/60'>
        <Avatar className='size-16'>
          <AvatarImage
            src={avatar}
            alt={name}
          />
          <AvatarFallback>
            <div className='size-full bg-fail-avatar bg-cover' />
          </AvatarFallback>
        </Avatar>
        <div>
          <div
            className='text-lg font-medium line-clamp-1'
            title={name}
          >
            {name}
          </div>
          <button
            className='mt-1 flex items-center gap-1 text-sm text-primary cursor-pointer select-none transition-colors duration-200 hover:text-primary/80 disabled:opacity-50'
            disabled={logoutLoading}
            onClick={() => logout()}
          >
            <UserRound className='size-3.5' />
            切换或退出账号
          </button>
        </div>
      </div>

      {/* 常规设置 */}
      <section className='pt-2'>
        <h2 className='pt-6 text-sm font-bold text-foreground'>常规设置</h2>
        <div className='mt-1'>
          <SettingRow title='主窗口颜色模式设置'>
            <Select
              value={theme}
              onValueChange={value => setTheme(value as Theme)}
            >
              <SelectTrigger className='w-45 text-muted-foreground'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='light'>浅色模式</SelectItem>
                <SelectItem value='dark'>深色模式</SelectItem>
                <SelectItem value='system'>跟随系统</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow title='播放窗口颜色模式设置'>
            <Select
              value={playTheme}
              onValueChange={value =>
                updateSettings({ playTheme: value as Settings['playTheme'] })
              }
            >
              <SelectTrigger className='w-45 text-muted-foreground'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='light'>浅色模式</SelectItem>
                <SelectItem value='dark'>深色模式</SelectItem>
                <SelectItem value='system'>跟随平台主题</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            title='字体选择：'
            hint='（若字体显示异常，可切换为默认字体）'
          >
            {/* Radix Select 把空字符串视为未选择，用 'default' 哨兵值回显「系统默认」，
                存储层仍用 ''（站点默认字体栈） */}
            <Select
              value={fontFamily || 'default'}
              onValueChange={value =>
                updateSettings({ fontFamily: value === 'default' ? '' : value })
              }
            >
              <SelectTrigger className='w-45 text-muted-foreground'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value || 'default'}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </section>

      {/* 快捷键 */}
      <section className='pt-2'>
        <h2 className='pt-6 text-sm font-bold text-foreground'>快捷键</h2>
        <div className='mt-1'>
          <SettingRow
            title='老板键'
            hint='（快速隐藏和显示程序，隐藏时会暂停正在播放的视频，热键为 Ctrl+Q）'
          >
            <label className='flex w-fit cursor-pointer items-center gap-2 text-sm select-none'>
              <Checkbox
                checked={bossKey}
                onCheckedChange={checked =>
                  updateSettings({ bossKey: checked === true })
                }
              />
              <span className='font-medium text-foreground/80'>开启老板键</span>
            </label>
          </SettingRow>
        </div>
      </section>

      {/* 播放设置 */}
      <section className='pt-2'>
        <h2 className='pt-6 text-sm font-bold text-foreground'>播放设置</h2>
        <div className='mt-1'>
          {/* 选项行：方框 checkbox + 文案（B 站风格） */}
          <div className='py-2.5'>
            <label className='flex w-fit cursor-pointer items-center gap-2 text-sm select-none'>
              <Checkbox
                checked={autoNext}
                onCheckedChange={checked =>
                  updateSettings({ autoNext: checked === true })
                }
              />
              <span className='font-medium text-foreground/80'>自动连播</span>
            </label>
          </div>
        </div>
      </section>

      {/* 关于 Qnya */}
      <section className='mt-2 border-t border-border pt-2 dark:border-border/60'>
        <h2 className='pt-6 text-sm font-bold text-foreground'>关于 Qnya</h2>
        <p className='mt-3 text-sm leading-7 text-muted-foreground'>
          Qnya
          诞生于一个简单的想法：把喜欢的番剧放在同一个地方，打开就能看。它没有复杂的算法，也没有满屏的广告，只有一个干净的播放页和一点点用心。愿每一部追过的番，都有始有终。
        </p>
        <p className='mt-3 text-sm leading-7 text-muted-foreground'>
          如果你也在追同一部番，希望你在这里看得开心。
        </p>
        {/* 附注行：与文案同节奏的内联排版 */}
        <p className='mt-3 text-sm leading-7 text-muted-foreground'>
          作者：
          <a
            className='inline-flex items-center gap-0.5 align-baseline text-foreground/80 transition-colors duration-200 hover:text-primary'
            href='https://github.com/hzh11012'
            target='_blank'
            rel='noreferrer'
          >
            Qnets
            <ExternalLink className='size-3.5' />
          </a>
          <span className='mx-1.5'>·</span>
          开源地址：
          <a
            className='inline-flex items-center gap-0.5 align-baseline text-foreground/80 transition-colors duration-200 hover:text-primary'
            href='https://github.com/hzh11012/Qnya-Frontend'
            target='_blank'
            rel='noreferrer'
          >
            GitHub
            <ExternalLink className='size-3.5' />
          </a>
          {FRIEND_LINKS.length > 0 && (
            <>
              <span className='mx-1.5'>·</span>
              友情链接：
              {FRIEND_LINKS.map(({ name, url }) => (
                <a
                  key={name}
                  className='mr-3 inline-flex items-center gap-0.5 align-baseline text-foreground/80 transition-colors duration-200 hover:text-primary'
                  href={url}
                  target='_blank'
                  rel='noreferrer'
                >
                  {name}
                  <ExternalLink className='size-3.5' />
                </a>
              ))}
            </>
          )}
        </p>
      </section>
    </div>
  );
};

export default Settings;
