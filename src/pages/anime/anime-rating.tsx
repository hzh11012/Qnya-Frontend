import React, { useState } from 'react';
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
import { Star } from 'lucide-react';

const schema = z.object({
  score: z.enum(['1', '2', '3', '4', '5'], '请选择评分'),
  content: z
    .string()
    .trim()
    .min(1, '短评内容不能为空')
    .max(1000, '短评最多 1000 字')
});

export type RatingFormValues = z.infer<typeof schema>;

interface AnimeRatingProps {
  loading: boolean;
  children: React.ReactNode;
  onSubmit: (values: RatingFormValues, cb: () => void) => void;
}

const AnimeRating: React.FC<AnimeRatingProps> = ({
  loading,
  children,
  onSubmit
}) => {
  const [open, setOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState('');

  const form = useForm<RatingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      score: undefined as unknown as RatingFormValues['score'],
      content: ''
    }
  });

  const [score, content] = form.watch(['score', 'content']);

  const handleSubmit = (values: RatingFormValues) => {
    onSubmit(values, () => {
      setOpen(false);
      form.reset();
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      title='动漫评分'
      description='请发表你对这部作品的评分'
      confirmText='发表短评'
      confirmDisabled={!score || !content}
      loading={loading}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name='score'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  className='inline-flex gap-0'
                  // 受控：提交后 form.reset() 归零，DOM 里的选中值也得跟着清，
                  // 否则再点同一颗星不触发 change，分数永远选不上
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  {['1', '2', '3', '4', '5'].map(value => (
                    <label
                      key={value}
                      className='relative cursor-pointer rounded-sm px-0.5 outline-none'
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating('')}
                    >
                      <RadioGroupItem
                        id={value}
                        value={value}
                        className='sr-only'
                      />
                      <Star
                        size={26}
                        className={cn(
                          'fill-transparent text-muted-foreground transition-colors duration-200',
                          (hoverRating || field.value || '') >= value &&
                            'fill-orange-400 text-orange-400'
                        )}
                      />
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
                  placeholder='说说你的看法…'
                  maxLength={1000}
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

export default AnimeRating;
