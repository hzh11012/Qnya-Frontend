import { searchAnime } from '@/apis';
import type { SearchAnimeItem } from '@/apis';
import FailAvatar from '@/components/custom/fail-avatar';
import { useSearchAnimeStore } from '@/store/search';
import { cn } from '@/lib/utils';
import { useRequest } from 'ahooks';
import { Star } from 'lucide-react';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

const AnimeCard = ({ item }: { item: SearchAnimeItem }) => (
  <div className='flex gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group'>
    <div className='w-20 h-28 rounded-lg overflow-hidden shrink-0 bg-muted'>
      {item.cover ? (
        <img
          src={item.cover}
          alt={item.name}
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <FailAvatar />
      )}
    </div>
    <div className='flex-1 min-w-0 space-y-1.5'>
      <h3
        className='font-semibold text-sm leading-tight line-clamp-2'
        dangerouslySetInnerHTML={{ __html: item.highlightName || item.name }}
      />
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        {item.year && <span>{item.year}</span>}
        {item.type && (
          <>
            <span>·</span>
            <span>{item.type}</span>
          </>
        )}
        {item.status && (
          <>
            <span>·</span>
            <span
              className={cn(
                item.status === '完结' ? 'text-green-500' : 'text-blue-500'
              )}
            >
              {item.status}
            </span>
          </>
        )}
      </div>
      {item.avgScore > 0 && (
        <div className='flex items-center gap-1 text-xs text-amber-500'>
          <Star className='size-3 fill-amber-500' />
          <span>{item.avgScore.toFixed(1)}</span>
          {item.scoreCount > 0 && (
            <span className='text-muted-foreground'>
              ({item.scoreCount}人评)
            </span>
          )}
        </div>
      )}
      {item.description && (
        <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
          {item.description}
        </p>
      )}
      {item.tags?.length > 0 && (
        <div className='flex flex-wrap gap-1 pt-0.5'>
          {item.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className='px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]'
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

const Index = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const { list, page, pageSize, hasMore, setPage, setList, setHasMore } =
    useSearchAnimeStore(
      useShallow(state => ({
        list: state.list,
        total: state.total,
        page: state.page,
        pageSize: state.pageSize,
        hasMore: state.hasMore,
        setPage: state.setPage,
        setHasMore: state.setHasMore,
        setList: state.setList
      }))
    );

  const { loading, runAsync } = useRequest(searchAnime, { manual: true });

  useEffect(() => {
    if (!keyword) return;
    setList([]);
    setPage(1);
    setHasMore(true);
    runAsync({ keyword, page: 1, pageSize }).then(data => {
      setList(data.items);
      setHasMore(data.items.length === pageSize && data.total > pageSize);
    });
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMore = async () => {
    const nextPage = page + 1;
    const data = await runAsync({ keyword, page: nextPage, pageSize });
    setPage(nextPage);
    if (data.items.length === 0) {
      setHasMore(false);
      return;
    }
    const newList = [...list, ...data.items];
    setList(newList);
    setHasMore(newList.length < data.total);
  };

  if (!keyword) {
    return (
      <div className='flex flex-col items-center justify-center h-60 text-muted-foreground gap-2'>
        <p className='text-sm'>请输入关键词搜索</p>
      </div>
    );
  }

  if (!loading && list.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-60 text-muted-foreground gap-2'>
        <p className='text-sm'>未找到与「{keyword}」相关的内容</p>
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={list.length}
      next={fetchMore}
      hasMore={hasMore}
      loader={''}
    >
      <div className='space-y-1'>
        {list.map(item => (
          <AnimeCard
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </InfiniteScroll>
  );
};

export default Index;
