import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import FormDialog from '@/components/custom/form-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { type FeedbackType } from '@/apis/feedback';

/** 反馈类型选项 */
const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'consultation', label: '咨询' },
  { value: 'suggestion', label: '建议' },
  { value: 'complaint', label: '投诉' },
  { value: 'other', label: '其他' }
];

const schema = z.object({
  type: z.enum(['consultation', 'suggestion', 'complaint', 'other'], {
    message: '请选择反馈类型'
  }),
  content: z
    .string()
    .trim()
    .min(1, '反馈内容不能为空')
    .max(500, '反馈内容最多 500 字')
});

export type FeedbackFormValues = z.infer<typeof schema>;

interface FeedbackDialogProps {
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FeedbackFormValues, cb: () => void) => void;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  loading,
  open,
  onOpenChange,
  onSubmit
}) => {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: undefined as unknown as FeedbackFormValues['type'],
      content: ''
    }
  });

  // 与其他弹窗一致：必填项没填齐前确认键不可点（校验仍由 schema 兜底）
  const [type, content] = form.watch(['type', 'content']);

  const handleSubmit = (values: FeedbackFormValues) => {
    onSubmit(values, () => {
      onOpenChange(false);
      form.reset();
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title='问题反馈'
      description='反馈内容仅管理员可见，我们会尽快处理'
      confirmText='提交反馈'
      confirmDisabled={!type || !content.trim()}
      loading={loading}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  className='flex flex-wrap gap-2'
                  // 受控：提交后 form.reset() 归零，DOM 里的选中值也要清，
                  // 否则再次打开点同一个类型不触发 change
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  {FEEDBACK_TYPES.map(item => (
                    <label
                      key={item.value}
                      className='cursor-pointer'
                    >
                      <RadioGroupItem
                        value={item.value}
                        className='sr-only'
                      />
                      <span
                        className={cn(
                          'inline-block rounded-sm border border-border px-3 py-1 text-xs text-muted-foreground dark:border-border/60',
                          'transition-colors duration-200',
                          field.value === item.value &&
                            'border-primary bg-primary text-primary-foreground'
                        )}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder='请描述你遇到的问题或建议…'
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormDialog>
  );
};

export default FeedbackDialog;
