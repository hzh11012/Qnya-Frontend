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
      <DialogContent className='w-85.5 sm:w-full'>
        <DialogHeader>
          <DialogTitle className='text-lg'>请输入验证码</DialogTitle>
          <DialogDescription>邮箱验证码已发送至 {email}</DialogDescription>
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
              <div className='flex w-full sm:gap-5'>
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <InputOTPSlot
                    key={index}
                    className='rounded-none sm:rounded-md'
                    index={index}
                  />
                ))}
              </div>
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter>
          <Button
            className='max-w-75 w-full'
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
