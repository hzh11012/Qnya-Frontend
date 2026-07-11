import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CircleXIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useClickAway } from 'ahooks';
import { useSearchHistoryStore } from '@/store';
import Exception from '@/components/custom/exception';
import type { SearchSuggestItem } from '@/apis/search';

interface SearchInputProps {
  defaultKeyword?: string;
  suggests: SearchSuggestItem[];
  className?: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onChange: (keyword: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  className,
  onSubmit,
  onChange,
  suggests,
  defaultKeyword = '',
  ...props
}) => {
  const containerRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [isFocused, setIsFocused] = useState(false);

  useClickAway(() => setIsFocused(false), containerRef, 'mousedown');

  const activated = !!(keyword || isFocused);

  // 搜索历史相关
  const histories = useSearchHistoryStore(state => state.list);
  const createHistory = useSearchHistoryStore(state => state.createHistory);
  const removeHistory = useSearchHistoryStore(state => state.removeHistory);
  const clearHistory = useSearchHistoryStore(state => state.clearHistory);

  // 处理搜索提交
  const handleSubmit = useCallback(() => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword) {
      setIsFocused(false);
      createHistory(trimmedKeyword);
      onSubmit(trimmedKeyword);
    }
  }, [keyword, createHistory, onSubmit]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value.slice(0, 50);
    setKeyword(keyword);
    setIsFocused(true);
    onChange(keyword);
  };

  // 处理清空输入
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setKeyword('');
    inputRef.current?.focus();
  }, []);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 处理历史记录点击
  const handleHistoryClick = useCallback(
    (e: React.MouseEvent, historyItem: string) => {
      e.stopPropagation();
      setIsFocused(false);
      setKeyword(historyItem);
      createHistory(historyItem);
      onSubmit(historyItem);
    },
    [createHistory, onSubmit]
  );

  // 处理删除历史记录
  const handleRemoveHistory = useCallback(
    (e: React.MouseEvent, historyItem: string) => {
      e.stopPropagation();
      removeHistory(historyItem);
    },
    [removeHistory]
  );

  const handlePopoverClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={cn('flex items-center transition-all duration-200', className)}
      data-activated={activated}
    >
      <Input
        ref={inputRef}
        className={cn(
          'w-full px-2.5 md:px-4',
          'hover:bg-border focus-visible:bg-transparent!',
          'bg-input border-transparent',
          {
            'pr-8 md:pr-8 md:border-ring md:bg-transparent!': keyword
          }
        )}
        value={keyword}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        maxLength={50}
        {...props}
      />
      {/* 清空按钮 */}
      {keyword && (
        <CircleXIcon
          className={cn(
            'absolute inset-e-2.5 cursor-pointer text-foreground/40',
            'transition-[color] hover:text-muted-foreground duration-200'
          )}
          onClick={handleClear}
          size={14}
          aria-label='清空输入'
        />
      )}
      {isFocused && (
        <div
          className='absolute top-11 w-full bg-background border border-accent min-h-42.5 rounded-sm overflow-hidden'
          onClick={handlePopoverClick}
        >
          {keyword ? (
            <div
              className={suggests.length ? 'flex flex-col py-2 gap-1' : 'p-4'}
            >
              {suggests.length ? (
                <>
                  {suggests.map((item, index) => {
                    return (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center h-8 text-sm cursor-pointer px-4',
                          'hover:bg-input'
                        )}
                        onClick={e => handleHistoryClick(e, item.name)}
                      >
                        <div
                          className='w-full break-all line-clamp-1'
                          dangerouslySetInnerHTML={{
                            __html: item.highlightName
                          }}
                        ></div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <Exception
                  type='empty'
                  className='h-34 md:h-34'
                />
              )}
            </div>
          ) : (
            <div className='p-4'>
              <div className='flex items-center justify-between select-none'>
                <div className='font-medium'>搜索历史</div>
                <span
                  className={cn(
                    'text-xs text-muted cursor-pointer',
                    'hover:text-primary transition-[color] duration-200'
                  )}
                  onClick={clearHistory}
                >
                  清空
                </span>
              </div>
              <div className='flex mt-4 gap-2.5 flex-wrap'>
                {histories.length ? (
                  histories.map(item => {
                    return (
                      <div
                        key={item}
                        className='relative group/history cursor-pointer select-none'
                        onClick={e => handleHistoryClick(e, item)}
                        title={item}
                      >
                        <div
                          className={cn(
                            'py-1 px-2.5 bg-input text-sm rounded-sm max-w-30 overflow-hidden truncate',
                            'hover:text-primary transition-[color] duration-200'
                          )}
                        >
                          {item}
                        </div>
                        <CircleXIcon
                          className='group-hover/history:block hidden absolute -top-1 -right-1 text-foreground/40'
                          onClick={e => handleRemoveHistory(e, item)}
                          size={12}
                        />
                      </div>
                    );
                  })
                ) : (
                  <Exception
                    type='empty'
                    className='h-34 md:h-34'
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
