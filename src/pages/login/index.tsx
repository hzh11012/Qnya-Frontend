import { zodResolver } from '@hookform/resolvers/zod';
import Logo from '@/components/custom/logo';
import { useForm, useWatch } from 'react-hook-form';
import { LineShadowText } from '@/components/ui/line-shadow-text';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/pages/login/login-form';
import ThemeSwitch from '@/components/custom/theme-switch';
import { schema, type LoginFormValues } from '@/pages/login/form-schema';
import { useAuthStore } from '@/store/auth';
import CodeDialog from '@/pages/login/code-dialog';
import Loading from '@/components/custom/loading';
import { toast } from 'sonner';
import {
  FlyDanmakuLayer,
  LoginBackground,
  LoginFootnotes
} from '@/pages/login/background';
import { useFlyDanmaku } from '@/pages/login/use-fly-danmaku';
import { useAuthLogin } from '@/pages/login/use-auth-login';

const Login: React.FC = () => {
  const { flies, onBackgroundClick } = useFlyDanmaku();
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
    <div
      className='relative flex items-center justify-center size-full overflow-auto scrollbar-hide select-none'
      onClick={onBackgroundClick}
    >
      <ThemeSwitch className='absolute top-4 right-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border bg-card/60 text-foreground/60 backdrop-blur-md transition-colors hover:bg-card hover:text-foreground' />
      <LoginBackground />
      <LoginFootnotes />
      <FlyDanmakuLayer flies={flies} />
      <div className='relative my-auto flex w-[calc(100%-2rem)] max-w-87.5 flex-col pb-12'>
        <div className='animate-fade-up mt-8 flex items-center gap-3.5'>
          <Logo
            type='favicon'
            className='animate-float size-12'
          />
          <h3 className='font-display font-semibold text-primary text-5xl'>
            Q<LineShadowText className='italic'>nya</LineShadowText>
          </h3>
        </div>
        <div className='animate-fade-up mt-10 flex items-center gap-3 [animation-delay:90ms]'>
          <div
            aria-hidden
            className='h-px w-10 bg-linear-to-r from-primary/60 to-transparent'
          />
          <span className='font-display text-[11px] font-medium uppercase tracking-[0.3em] text-muted'>
            Sign in
          </span>
        </div>
        <div className='animate-fade-up mt-2.5 font-semibold text-lg [animation-delay:160ms]'>
          邮箱登录 / 注册
        </div>
        <div className='animate-fade-up mb-8 mt-1 text-sm text-muted [animation-delay:230ms]'>
          未注册用户验证后将自动注册并登录
        </div>
        <div className='animate-fade-up [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-border/60 [&_input]:bg-card/60 [&_input]:backdrop-blur-md [animation-delay:300ms]'>
          <LoginForm
            form={form}
            onSubmit={handleSubmit}
          />
        </div>
        <Button
          className='animate-fade-up mt-5 h-11 w-full rounded-xl shadow-lg shadow-primary/20 [animation-delay:370ms]'
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
