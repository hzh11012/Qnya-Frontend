import React, { memo, useEffect, useRef, useState } from 'react';
import { MessageCircle, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from './format';
import type { WatchRoomMessage } from '@/apis/watch-room';
import { cn } from '@/lib/utils';

interface RoomChatProps {
  messages: WatchRoomMessage[];
  onSend: (content: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  currentUserId?: string;
  disabled?: boolean;
}

/** 同一人 5 分钟内的连续发言合并展示，省掉重复的头像与昵称 */
const isContinued = (
  previous: WatchRoomMessage | undefined,
  current: WatchRoomMessage
) =>
  !!previous &&
  previous.type === 'chat' &&
  current.type === 'chat' &&
  previous.user?.userId === current.user?.userId &&
  new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime() <
    5 * 60_000;

/**
 * 单条消息行。
 * 消息面板每来一条新消息都会重算列表，行内 props 都是原始值且消息对象引用稳定，
 * memo 之后只有「新增的那条」和「连发状态翻转的上一条」会重绘。
 */
const ChatRow = memo<{
  message: WatchRoomMessage;
  mine: boolean;
  continued: boolean;
}>(({ message, mine, continued }) => (
  <div
    className={cn(
      'flex items-start gap-2',
      // 自己的消息靠右：头像与内容整体镜像，读起来是同一套气泡流向
      mine && 'flex-row-reverse',
      continued ? 'mt-1' : 'mt-3'
    )}
  >
    {continued ? (
      <span className='w-7 shrink-0' />
    ) : (
      <Avatar className='size-7 shrink-0'>
        {message.user?.avatar && <AvatarImage src={message.user.avatar} />}
        <AvatarFallback className='text-[11px]'>
          {message.user?.nickname.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
    )}

    <div className={cn('min-w-0 flex-1', mine && 'text-right')}>
      {!continued && (
        <div
          className={cn(
            'flex items-baseline gap-2',
            mine && 'flex-row-reverse'
          )}
        >
          <span
            className={cn(
              'text-xs',
              mine ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {message.user?.nickname}
          </span>
          <span className='text-[10px] text-muted-foreground/60'>
            {formatDate(message.createdAt)}
          </span>
        </div>
      )}
      <p className='text-sm leading-relaxed break-words'>{message.content}</p>
    </div>
  </div>
));
ChatRow.displayName = 'ChatRow';

/** 系统通知行（居中灰底小字） */
const SystemRow = memo<{ content: string }>(({ content }) => (
  <div className='flex justify-center py-1.5'>
    <span className='max-w-[90%] rounded-sm bg-card px-2.5 py-1 text-center text-[11px] leading-relaxed text-muted-foreground'>
      {content}
    </span>
  </div>
));
SystemRow.displayName = 'SystemRow';

/** 聊天 + 系统通知混合消息面板（按时间正序展示） */
const RoomChat: React.FC<RoomChatProps> = ({
  messages,
  onSend,
  onLoadMore,
  hasMore,
  loadingMore,
  currentUserId,
  disabled
}) => {
  const [content, setContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  // 新消息到达时，若用户正停留在底部则自动跟随滚动
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const handleSend = () => {
    const text = content.trim();
    if (!text) return;
    onSend(text);
    setContent('');
  };

  return (
    // flex-1（而不是 h-full）：父级是 flex 列，靠百分比高度撑不满时消息列表
    // 和输入框会缩在顶部，下面空出一截
    <div className='flex min-h-0 w-full flex-1 flex-col'>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className='min-h-55 flex-1 overflow-y-auto px-3 pt-2 pb-3'
      >
        {hasMore && (
          <div className='flex justify-center pt-1 pb-2'>
            <Button
              variant='link'
              className='h-auto p-0 text-xs font-normal'
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? '加载中…' : '加载更早的消息'}
            </Button>
          </div>
        )}

        {messages.length === 0 && !hasMore && (
          <div className='flex h-full flex-col items-center justify-center gap-2 text-muted-foreground'>
            <MessageCircle className='size-5 opacity-40' />
            <p className='text-xs'>还没有人说话，打个招呼吧</p>
          </div>
        )}

        {messages.map((message, index) =>
          message.type === 'system' ? (
            <SystemRow
              key={message.messageId}
              content={message.content}
            />
          ) : (
            <ChatRow
              key={message.messageId}
              message={message}
              mine={message.user?.userId === currentUserId}
              continued={isContinued(messages[index - 1], message)}
            />
          )
        )}
      </div>

      <div className='flex-none border-t p-3'>
        <div className='flex items-center gap-1 rounded-sm border border-border bg-input/50 py-1 pr-1 pl-3 transition-colors focus-within:border-ring'>
          <input
            value={content}
            maxLength={200}
            disabled={disabled}
            placeholder={disabled ? '仅房间成员可以发言' : '说点什么…'}
            className='h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed'
            onChange={event => setContent(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                handleSend();
              }
            }}
          />
          <Button
            size='icon'
            className='size-7 rounded-sm'
            disabled={disabled || !content.trim()}
            onClick={handleSend}
          >
            <SendHorizonal className='size-3.5' />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomChat;
