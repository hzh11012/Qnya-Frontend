import { Loader2Icon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* Content 关闭即卸载，表单状态随打开重新初始化 */}
      {open && <NameForm onOpenChange={onOpenChange} />}
    </Dialog>
  );
};

const NameForm: React.FC<{ onOpenChange: (open: boolean) => void }> = ({
  onOpenChange
}) => {
  const user = useAuthStore(state => state.user)!;
  const [name, setName] = useState(user.name);
  const mutation = useUpdateProfile(() => onOpenChange(false));

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    mutation.mutate({ name: trimmedName });
  };

  return (
    <DialogContent className='max-w-sm'>
      <DialogHeader>
        <DialogTitle className='sm:text-left'>编辑资料</DialogTitle>
        <DialogDescription className='sr-only'>修改你的名称</DialogDescription>
      </DialogHeader>

      <div className='space-y-1.5 py-2'>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder='输入名称'
          maxLength={30}
          autoFocus
        />
        {!name.trim() && (
          <p className='text-xs text-destructive'>名称不能为空</p>
        )}
      </div>

      <DialogFooter className='flex-row gap-2 sm:gap-2'>
        <Button
          variant='outline'
          className='h-9 flex-1'
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
        >
          取消
        </Button>
        <Button
          className='h-9 flex-1'
          onClick={handleSave}
          disabled={mutation.isPending || !name.trim()}
        >
          {mutation.isPending && (
            <Loader2Icon
              className='animate-spin'
              size={16}
            />
          )}
          保存
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ProfileEditDialog;
