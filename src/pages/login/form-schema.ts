import z from 'zod';

const schema = z.object({
  email: z.email({ message: '邮箱格式错误' }).trim().min(1, '邮箱不能为空')
});

type LoginFormValues = z.infer<typeof schema>;

export { schema, type LoginFormValues };
