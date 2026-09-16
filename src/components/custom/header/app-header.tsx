import { Header, HeaderLeft, HeaderRight } from '@/components/ui/header';
import Logo from '@/components/custom/logo';
import SearchInput from '@/components/custom/header/search-input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchSuggest, type SearchSuggestItem } from '@/apis/search';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// 避免每次渲染创建新数组，导致下游 memo 组件失效
const EMPTY_SUGGESTS: SearchSuggestItem[] = [];

const AppHeader: React.FC<React.ComponentProps<typeof Header>> = ({
  ...props
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultKeyword = searchParams.get('keyword') || '';

  // 关键词短防抖：避免逐字请求，同时保持接近实时的响应
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState(defaultKeyword);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 150);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 不用 keepPreviousData：联想词宁可短暂留白，也不展示过期关键词的结果；
  // react-query 只采用当前 queryKey 的响应，天然避免乱序问题
  const { data, isFetching } = useQuery({
    queryKey: ['search-suggest', debouncedKeyword],
    queryFn: () => searchSuggest({ keyword: debouncedKeyword }),
    enabled: !!debouncedKeyword.trim()
  });
  const suggests = data ?? EMPTY_SUGGESTS;

  // 结果未就绪：防抖窗口内，或请求进行中
  const pending =
    !!keyword.trim() &&
    (isFetching || keyword.trim() !== debouncedKeyword.trim());

  const handleSubmit = (value: string) => {
    navigate(`search?keyword=${encodeURIComponent(value)}`);
  };

  const handleChange = (value: string) => {
    setKeyword(value);
  };

  return (
    <Header {...props}>
      <HeaderLeft className='pl-0 items-center'>
        <Logo
          type='favicon'
          className='md:hidden'
        />
        <Logo
          type='logo'
          className='w-auto h-8 hidden md:block'
        />
      </HeaderLeft>
      <HeaderRight className='pl-0 items-center'>
        <SearchInput
          defaultKeyword={defaultKeyword}
          suggests={suggests}
          pending={pending}
          onSubmit={handleSubmit}
          onChange={handleChange}
          placeholder='搜索你感兴趣的动漫'
          className={cn(
            'absolute right-4 md:right-8 w-1/2 md:w-74.5',
            'md:data-[activated=true]:right-[calc(50%-13.4375rem)] md:data-[activated=true]:w-107.5'
          )}
        />
      </HeaderRight>
    </Header>
  );
};

export default AppHeader;
