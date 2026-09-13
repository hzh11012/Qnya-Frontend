import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

interface CodeDialogProps {
  email: string;
  countDown: {
    isDisable: boolean;
    count: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (
    email: string,
    code: string,
    setCode: (code: string) => void
  ) => Promise<void>;
  onSend: (email: string) => void;
}

const CodeDialog: React.FC<CodeDialogProps> = ({
  open,
  onOpenChange,
  email,
  countDown,
  onComplete,
  onSend
}) => {
  const { count, isDisable } = countDown;
  const [code, setCode] = useState('');

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) setCode('');
  };

  const handleComplete = async () => {
    await onComplete(email, code, setCode);
  };

  const handleSendCode = () => {
    onSend(email);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className='w-full max-w-[min(21.875rem,calc(100%-2rem))] p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='text-lg'>请输入验证码</DialogTitle>
          <DialogDescription className='text-sm text-muted'>
            邮箱验证码已发送至
            <span className='text-foreground font-medium'> {email}</span>
          </DialogDescription>
        </DialogHeader>
        <div className='mx-auto my-7.5'>
          <InputOTP
            value={code}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            onComplete={handleComplete}
            onChange={setCode}
          >
            <InputOTPGroup>
              <div className='flex w-full gap-1.5 sm:gap-2'>
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <InputOTPSlot
                    key={index}
                    className='size-11 rounded-xl border-border bg-background first:rounded-l-xl last:rounded-r-xl dark:border-border/60'
                    index={index}
                  />
                ))}
              </div>
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter className='justify-start'>
          <Button
            variant='outline'
            className='h-11 w-full rounded-xl'
            onClick={handleSendCode}
            disabled={isDisable}
          >
            {isDisable ? `${count} 秒后可重新发送` : '发送验证码'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeDialog;
