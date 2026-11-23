import type { WatchRoomMessage } from '@/apis/watch-room';

/**
 * 房间实时消息的外部存储（房间页持有，随房间重建）。
 *
 * 为什么不用 useState：消息状态若放在房间页，一条聊天就会把播放器、选集、
 * 侧栏整页重渲；放在面板里又会在切到「播放列表」tab（Radix 卸载非激活内容）
 * 时丢掉这段时间收到的消息。做成外部存储后：
 * - 房间页只负责写入（socket 订阅在这边，不随面板卸载失效），不因聊天重渲；
 * - 面板用 useSyncExternalStore 订阅，只有聊天面板重绘；
 * - 面板卸载期间的消息照样进存储，切回来时列表就是完整的。
 */
export const createMessageStore = () => {
  let messages: WatchRoomMessage[] = [];
  const seen = new Set<string>();
  const listeners = new Set<() => void>();

  return {
    /** 追加一条（按 messageId 去重；重复消息不通知订阅者） */
    append(message: WatchRoomMessage) {
      if (seen.has(message.messageId)) return;
      seen.add(message.messageId);
      messages = [...messages, message];
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** 引用稳定：只在 append 时换新数组（useSyncExternalStore 要求） */
    getSnapshot: () => messages
  };
};

export type RoomMessageStore = ReturnType<typeof createMessageStore>;
