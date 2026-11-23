import React, { useId } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** 内容区：字段之间统一 24px，页面里不要再写 space-y-6 */
const DIALOG_BODY_CLASS = 'flex flex-col gap-6';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 触发元素：给了就挂成 DialogTrigger（如播放页点评分数字弹窗） */
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  /** 说明文字样式：只想给读屏时传 `sr-only` */
  descriptionClassName?: string;
  /** 表单内容（只做确认的场景可以不传） */
  children?: React.ReactNode;
  confirmText?: string;
  confirmDisabled?: boolean;
  /** 提交中：确认按钮转圈并禁用 */
  loading?: boolean;
  /** 普通确认弹窗的点击行为；走表单提交时改用 onSubmit */
  onConfirm?: () => void;
  /**
   * 传了就把内容包进 `<form>`、确认键变成 submit：
   * 回车能提交，react-hook-form 的校验也走原生 submit 链路
   */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  className?: string;
}

/**
 * 站内唯一的弹窗外壳：标题 + 说明 + 内容 + 「取消 / 确认」。
 * 问题反馈、动漫评分、编辑资料、修改房间信息、设为私人、各类二次确认都用它，
 * 页面里不要再手写 Dialog 骨架和按钮排布。
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  descriptionClassName,
  children,
  confirmText = '确认',
  confirmDisabled,
  loading,
  onConfirm,
  onSubmit,
  className
}) => {
  // 确认键在 footer 里，和表单不是同一个 DOM 节点，靠 form 属性关联
  const formId = useId();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn('bg-background/90', className)}>
        <DialogHeader>
          <DialogTitle className='sm:text-left'>{title}</DialogTitle>
          {description && (
            <DialogDescription
              className={cn('text-muted-foreground', descriptionClassName)}
            >
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {onSubmit ? (
          <form
            id={formId}
            className={DIALOG_BODY_CLASS}
            noValidate
            onSubmit={onSubmit}
          >
            {children}
          </form>
        ) : (
          children && <div className={DIALOG_BODY_CLASS}>{children}</div>
        )}

        <DialogFooter className='grid grid-cols-2 gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type={onSubmit ? 'submit' : 'button'}
            form={onSubmit ? formId : undefined}
            onClick={onSubmit ? undefined : onConfirm}
            disabled={confirmDisabled || loading}
          >
            {loading && <Loader2 className='size-4 animate-spin' />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
