import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MineCard from './mine-card';
import ProfileEditDialog from './profile-edit-dialog';
import { MineCollection, MineHistory } from './mine-list';

const Mine: React.FC = () => {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className='relative my-4 flex h-full flex-col gap-4 md:my-8 md:gap-8'>
      <MineCard onEdit={() => setEditOpen(true)} />
      <Tabs
        defaultValue='collections'
        className='size-full select-none'
      >
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
          <MineHistory />
        </TabsContent>
      </Tabs>
      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
};

export default Mine;
