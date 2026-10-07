import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='bg-background/90'>
        <DialogHeader>
          <DialogTitle className='sm:text-left'>动漫评分</DialogTitle>
          <DialogDescription>请发表你对这部作品的评分</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className='space-y-6'
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name='score'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      className='inline-flex gap-0'
                      onValueChange={field.onChange}
                    >
                      {['1', '2', '3', '4', '5'].map(value => (
                        <label
                          key={value}
                          className='relative cursor-pointer rounded px-0.5 outline-none'
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
            <Button
              type='submit'
              className='w-full'
              disabled={!score || !content || loading}
            >
              {loading ? '提交中…' : '发表短评'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AnimeRating;
