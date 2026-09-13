import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import useCountDown from '@/hooks/use-count-down';
import { login, sendCode, type User } from '@/apis/auth';

/** 登录页的验证码发送 + 倒计时 + 弹窗开关逻辑 */
export const useAuthLogin = () => {
  const [open, setOpen] = useState(false);
  const lastSentEmailRef = useRef('');
  const { start, count, isDisable, reset } = useCountDown(60);

  const sendCodeMutation = useMutation({
    mutationFn: sendCode,
    onSuccess: () => {
      start();
    }
  });
  const loginMutation = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      login(email, code)
  });

  // 进行中的登录请求：OTP 输满自动提交时可能连发，并发调用合并为同一次请求
  const inflightLoginRef = useRef<Promise<User> | null>(null);
  const onLogin = (email: string, code: string) => {
    if (inflightLoginRef.current) return inflightLoginRef.current;
    const promise = loginMutation.mutateAsync({ email, code }).finally(() => {
      inflightLoginRef.current = null;
    });
    inflightLoginRef.current = promise;
    return promise;
  };

  const loading = sendCodeMutation.isPending;

  const handleSendCode = useCallback(
    (email: string) => {
      const emailChanged = lastSentEmailRef.current !== email;
      if (emailChanged) {
        reset();
      }
      if (!isDisable || emailChanged) {
        // 请求进行中直接忽略，防止连点重复发送验证码
        if (!sendCodeMutation.isPending) {
          sendCodeMutation.mutate(email);
          lastSentEmailRef.current = email;
        }
      }
      setOpen(true);
    },
    [isDisable, sendCodeMutation, reset]
  );

  return {
    open,
    setOpen,
    count,
    isDisable,
    handleSendCode,
    loading,
    onLogin
  };
};
