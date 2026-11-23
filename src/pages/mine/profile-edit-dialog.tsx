import React, { useState } from 'react';
import FormDialog from '@/components/custom/form-dialog';
import { Input } from '@/components/ui/input';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { useAuthStore } from '@/store/auth';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 编辑资料：修改名称（头像在用户信息条直接点击修改） */
const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  open,
  onOpenChange
}) => {
  const user = useAuthStore(state => state.user)!;
  const [name, setName] = useState(user.name);
  const mutation = useUpdateProfile(() => onOpenChange(false));

  // 每次打开都回到当前名称：上次没保存的输入不带进下一次
  const handleOpenChange = (next: boolean) => {
    if (next) setName(user.name);
    onOpenChange(next);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    mutation.mutate({ name: trimmedName });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title='编辑资料'
      description='修改你的名称'
      // 标题已经说明清楚了，说明只留给读屏
      descriptionClassName='sr-only'
      confirmText='保存'
      confirmDisabled={!name.trim()}
      loading={mutation.isPending}
      onSubmit={event => {
        event.preventDefault();
        handleSave();
      }}
    >
      <div className='flex flex-col gap-1.5'>
        <Input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder='输入名称'
          maxLength={30}
          autoFocus
        />
        {!name.trim() && (
          <p className='text-xs text-destructive'>名称不能为空</p>
        )}
      </div>
    </FormDialog>
  );
};

export default ProfileEditDialog;
