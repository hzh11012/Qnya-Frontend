import { Form } from '@/components/ui/form';
import FormInput from '@/components/custom/form/form-input';
import type { UseFormReturn } from 'react-hook-form';
import { Mail } from 'lucide-react';
import type { LoginFormValues } from '@/pages/login/form-schema';

interface FormProps {
  form: UseFormReturn<LoginFormValues>;
  onFocus?: () => void;
  onSubmit: (values: LoginFormValues) => void;
}

const LoginForm: React.FC<FormProps> = ({ form, onFocus, onSubmit }) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormInput
          control={form.control}
          name='email'
          placeholder={'请输入邮箱'}
          onFocus={onFocus}
          prefixIcon={<Mail size={16} />}
        />
      </form>
    </Form>
  );
};

export { LoginForm };
