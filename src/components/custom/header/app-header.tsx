import { Header, HeaderLeft, HeaderRight } from '@/components/ui/header';
import Logo from '@/components/custom/logo';
import SearchInput from '@/components/custom/header/search-input';
import { useSearchSuggestStore } from '@/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { searchSuggest } from '@/apis';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const AppHeader: React.FC<React.ComponentProps<typeof Header>> = ({
  ...props
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultKeyword = searchParams.get('keyword') || '';

  const suggests = useSearchSuggestStore(state => state.list);
  const setList = useSearchSuggestStore(state => state.setList);

  const { run } = useRequest(searchSuggest, {
    manual: true,
    loadingDelay: 150,
    onSuccess: setList
  });

  useEffect(() => {
    if (defaultKeyword.trim()) run({ keyword: defaultKeyword });
  }, []);

  const handleSubmit = (value: string) => {
    navigate(`search?keyword=${encodeURIComponent(value)}`);
  };

  const handleChange = (keyword: string) => {
    if (keyword.trim()) {
      setList([]);
      run({ keyword });
    }
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
