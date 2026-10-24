import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MineCard from './mine-card';
import ProfileEditDialog from './profile-edit-dialog';
import { MineCollection, MineHistory, MineHistorySearch } from './mine-list';
import { useAuthStore } from '@/store/auth';
import { useDocumentTitle } from '@/hooks/use-document-title';

const Mine: React.FC = () => {
  useDocumentTitle('个人中心');
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState('collections');
  const [historyInput, setHistoryInput] = useState('');
  const [historyKeyword, setHistoryKeyword] = useState('');
  const role = useAuthStore(state => state.user?.role);
  // 游客角色不可用追番/历史（后端同样限制），仅展示个人资料
  const canViewRecords =
    role === 'user' || role === 'premium' || role === 'admin';

  /** 回车/清空时才提交搜索关键字 */
  const searchHistory = (value: string) => {
    setHistoryInput(value);
    setHistoryKeyword(value.trim());
  };

  return (
    <div className='relative my-4 flex h-full flex-col gap-4 md:my-8 md:gap-8'>
      <MineCard onEdit={() => setEditOpen(true)} />
      {canViewRecords && (
        <Tabs
          value={tab}
          onValueChange={setTab}
          className='size-full select-none'
        >
          <div className='relative'>
            <TabsList className='w-full min-h-12.5 justify-start gap-6 border-b border-border dark:border-border/60'>
              <TabsTrigger
                className='w-18 flex-none text-base after:inset-x-7'
                value='collections'
              >
                我的追番
              </TabsTrigger>
              <TabsTrigger
                className='w-18 flex-none text-base after:inset-x-7'
                value='histories'
              >
                历史记录
              </TabsTrigger>
            </TabsList>
            {/* 历史搜索框：桌面端靠 tabs 行右端；移动端屏宽不够，移至内容区顶部通栏 */}
            {tab === 'histories' && (
              <div className='absolute inset-y-0 right-0 hidden w-40 items-center md:flex md:w-60'>
                <MineHistorySearch
                  value={historyInput}
                  onChange={setHistoryInput}
                  onSearch={searchHistory}
                />
              </div>
            )}
          </div>
          <TabsContent
            className='mt-4 md:mt-6'
            value='collections'
          >
            <MineCollection />
          </TabsContent>
          <TabsContent
            className='mt-4 md:mt-6'
            value='histories'
          >
            {/* 移动端：搜索框通栏置于列表上方 */}
            {tab === 'histories' && (
              <div className='mb-4 md:hidden'>
                <MineHistorySearch
                  value={historyInput}
                  onChange={setHistoryInput}
                  onSearch={searchHistory}
                />
              </div>
            )}
            <MineHistory keyword={historyKeyword} />
          </TabsContent>
        </Tabs>
      )}
      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
};

export default Mine;
