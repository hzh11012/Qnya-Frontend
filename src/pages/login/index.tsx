import { useCallback, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Logo from '@/components/custom/logo';
import { useForm, useWatch } from 'react-hook-form';
import { LineShadowText } from '@/components/ui/line-shadow-text';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/pages/login/login-form';
import { schema, type LoginFormValues } from '@/pages/login/form-schema';
import useCountDown from '@/hooks/use-count-down';
import { useRequest } from 'ahooks';
import { useAuthStore } from '@/store';
import CodeDialog from '@/pages/login/code-dialog';
import Loading from '@/components/custom/loading';
import { login, sendCode } from '@/apis';
import { toast } from 'sonner';

const useAuthLogin = () => {
  const [open, setOpen] = useState(false);
  const lastSentEmailRef = useRef('');
  const { start, count, isDisable, reset } = useCountDown(60);
  const { run: onSendCode, loading } = useRequest(sendCode, {
    manual: true,
    debounceWait: 250,
    onSuccess: () => {
      start();
    }
  });
  const { runAsync: onLogin } = useRequest(login, {
    manual: true,
    debounceWait: 250
  });

  const handleSendCode = useCallback(
    (email: string) => {
      const emailChanged = lastSentEmailRef.current !== email;
      if (emailChanged) {
        reset();
      }
      if (!isDisable || emailChanged) {
        onSendCode(email);
        lastSentEmailRef.current = email;
      }
      setOpen(true);
    },
    [isDisable, onSendCode, reset]
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

const Login: React.FC = () => {
  const { open, setOpen, count, isDisable, handleSendCode, loading, onLogin } =
    useAuthLogin();
  const setInitialized = useAuthStore(state => state.setInitialized);
  const setUser = useAuthStore(state => state.setUser);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });
  const email = useWatch({ control: form.control, name: 'email' });

  const handleLogin = async (
    email: string,
    code: string,
    setCode: (code: string) => void
  ) => {
    try {
      const user = await onLogin(email, code);
      if (user.role !== 'admin') {
        toast.error('权限不足');
        setCode('');
        return;
      }
      setUser(user);
      setInitialized(true);
    } catch {
      setCode('');
    }
  };

  const handleSubmit = (values: LoginFormValues) => {
    const { email } = values;
    handleSendCode(email);
  };

  return (
    <div className='flex items-center justify-center size-full overflow-auto scrollbar-hide select-none'>
      <div className='relative w-87.5 h-auto rounded-md p-6 border-0 sm:border'>
        <div className='flex items-center gap-4 mb-10.5'>
          <Logo
            type='favicon'
            className='size-14'
          />
          <h3 className='font-semibold text-primary text-4xl'>
            Q<LineShadowText className='italic'>nya</LineShadowText>
          </h3>
        </div>
        <div className='font-semibold text-lg mx-2 mb-3'>邮箱登录/注册</div>
        <div className='text-sm mx-2 mb-10'>
          未注册用户验证后将自动注册并登录
        </div>
        <LoginForm
          form={form}
          onSubmit={handleSubmit}
        />
        <Button
          className='w-full mt-10'
          type='submit'
          onClick={form.handleSubmit(handleSubmit)}
        >
          登录
        </Button>
      </div>
      <CodeDialog
        email={email}
        open={open}
        onOpenChange={setOpen}
        countDown={{ count, isDisable }}
        onComplete={handleLogin}
        onSend={handleSendCode}
      />
      {loading && <Loading />}
    </div>
  );
};

export default Login;
