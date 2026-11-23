import React, { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Socket } from 'socket.io-client';
import { getRoomMessages } from '@/apis/watch-room';
import { emitAck, ROOM_EVENT } from '@/apis/watch-room-socket';
import RoomChat from './room-chat';
import type { RoomMessageStore } from './room-message-store';

interface RoomChatPanelProps {
  roomId: string;
  socket: Socket;
  /** 房间页持有的实时消息存储（与 socket 订阅分开，面板卸载也不丢消息） */
  messages: RoomMessageStore;
  currentUserId?: string;
  /** 不在房间成员列表中（已被移出等）：只读，不能发言 */
  disabled?: boolean;
}

/**
 * 聊天面板：历史分页 + 实时消息 + 发送。
 * 实时消息只订阅外部存储，兄弟组件（播放器 / 选集）不会跟着重绘。
 */
const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  roomId,
  socket,
  messages: store,
  currentUserId,
  disabled
}) => {
  const realtimeMessages = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot
  );

  // 面板只在加入房间后渲染，不必再等 state 落地
  const historyQuery = useInfiniteQuery({
    queryKey: ['watch-room-messages', roomId],
    queryFn: ({ pageParam }) =>
      getRoomMessages(roomId, { page: pageParam, pageSize: 30 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return fetched < lastPage.total && lastPage.items.length > 0
        ? allPages.length + 1
        : undefined;
    },
    enabled: !!roomId
  });

  /** 历史（倒序分页）+ 实时流，按 messageId 去重合并 */
  const merged = useMemo(() => {
    const history = historyQuery.data?.pages.flatMap(page =>
      [...page.items].reverse()
    );
    const all = [...(history ?? []), ...realtimeMessages];
    const seen = new Set<string>();
    return all
      .filter(m =>
        seen.has(m.messageId) ? false : (seen.add(m.messageId), true)
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [historyQuery.data, realtimeMessages]);

  const handleSend = useCallback(
    (content: string) => {
      void emitAck(socket, ROOM_EVENT.chat, { roomId, content }).then(
        result => {
          if (!result.success) {
            toast.error(result.error?.message ?? '发送失败');
          }
        }
      );
    },
    [roomId, socket]
  );

  return (
    <RoomChat
      messages={merged}
      disabled={disabled}
      currentUserId={currentUserId}
      onSend={handleSend}
      onLoadMore={() => void historyQuery.fetchNextPage()}
      hasMore={historyQuery.hasNextPage}
      loadingMore={historyQuery.isFetchingNextPage}
    />
  );
};

export default RoomChatPanel;
