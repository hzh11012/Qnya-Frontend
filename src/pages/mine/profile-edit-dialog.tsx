import { useMutation } from '@tanstack/react-query';
import { CameraIcon, Loader2Icon } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateProfile } from '@/apis/mine';
import { compressAvatar } from '@/lib/avatar';
import { useAuthStore } from '@/store/auth';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 编辑个人资料：修改名称和头像（头像压缩为 128px base64 dataURL） */
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
      {open && <ProfileForm onOpenChange={onOpenChange} />}
    </Dialog>
  );
};

const ProfileForm: React.FC<{ onOpenChange: (open: boolean) => void }> = ({
  onOpenChange
}) => {
  const user = useAuthStore(state => state.user)!;
  const setUser = useAuthStore(state => state.setUser);
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar
  );
  const [avatarError, setAvatarError] = useState('');

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: user => {
      // 同步更新本地用户态（侧栏头像/名称即时生效）
      setUser(user);
      onOpenChange(false);
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 允许重复选择同一文件
    e.target.value = '';
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setAvatarError('图片过大，请选择 20MB 以内的图片');
      return;
    }

    try {
      const dataURL = await compressAvatar(file);
      setAvatarPreview(dataURL);
      setAvatarError('');
    } catch {
      setAvatarError('图片处理失败，请更换图片');
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    mutation.mutate({ name: trimmedName, avatar: avatarPreview });
  };

  return (
    <DialogContent className='max-w-sm bg-card border-border dark:border-border/60'>
      <DialogHeader>
        <DialogTitle className='sm:text-left'>编辑资料</DialogTitle>
        <DialogDescription className='sr-only'>
          修改你的名称和头像
        </DialogDescription>
      </DialogHeader>

      <div className='flex flex-col items-center gap-4 py-2'>
        <label className='group relative cursor-pointer select-none'>
          <Avatar className='size-24 border border-border dark:border-border/60'>
            <AvatarImage src={avatarPreview ?? undefined} />
            <AvatarFallback>{name?.[0] ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className='absolute inset-0 rounded-full flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
            <CameraIcon size={20} />
          </div>
          <input
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />
        </label>

        <div className='w-full space-y-1.5'>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder='输入名称'
            maxLength={30}
          />
          {(avatarError || !name.trim()) && (
            <p className='text-xs text-destructive'>
              {avatarError || '名称不能为空'}
            </p>
          )}
        </div>
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
