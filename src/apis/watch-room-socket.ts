import { io, type Socket } from 'socket.io-client';
import type {
  PlaybackSync,
  WatchRoomMember,
  WatchRoomState
} from './watch-room';

/**
 * 放映室 Socket.IO 客户端（单例）
 *
 * 事件名与载荷以后端 watch-room-socket.ts / watch-room-core.ts 为准：
 * - room:state          { roomId, state }，不在任何房间时 state 为 null
 * - room:message        消息本体（聊天与系统通知统一，无外层包装）
 * - room:member-joined  { roomId, member }
 * - room:member-left    { roomId, userId, reason }，离开者/被踢者本人也会收到
 * - room:closed         { roomId, content }
 * - room:updated        { roomId, name, announcement, visibility }
 * - playback:sync       { roomId, playback }
 * - room:state          连接（含重连）建立时推送一次，不在任何房间时 state 为 null
 * - session:replaced    { socketId }
 *
 * 关键操作全部走 ACK：{ success, data, error }
 */

/** 客户端事件名（建房/加入/离开/踢人/改信息/播放/聊天/校准） */
export const ROOM_EVENT = {
  create: 'room:create',
  join: 'room:join',
  leave: 'room:leave',
  update: 'room:update',
  kick: 'member:kick',
  play: 'playback:play',
  pause: 'playback:pause',
  seek: 'playback:seek',
  changeVideo: 'playback:change-video',
  /** 只读拉取权威播放状态：周期校准 + ACK 往返测 RTT */
  pull: 'playback:pull',
  chat: 'chat:send'
} as const;

/** Socket 服务端事件载荷 */
export interface RoomStatePayload {
  roomId: string | null;
  state: WatchRoomState | null;
}

export interface RoomMemberJoinedPayload {
  roomId: string;
  member: WatchRoomMember;
}

export interface RoomMemberLeftPayload {
  roomId: string;
  userId: string;
  /** left：主动离开/切换房间；kicked：被房主移出 */
  reason: 'left' | 'kicked';
}

export interface RoomClosedPayload {
  roomId: string;
  content: string;
}

export interface RoomUpdatedPayload {
  roomId: string;
  name: string;
  announcement: string | null;
  /** 房主切换公开状态后一并下发，成员端据此更新聊天页顶部的开关 */
  visibility: 'public' | 'private';
}

export interface PlaybackSyncPayload {
  roomId: string;
  playback: PlaybackSync;
}

/** 建房载荷（后端要求必须带初始视频；私人房间必须带密码） */
export type CreateRoomPayload = {
  name: string;
  visibility: 'public' | 'private';
  announcement?: string;
  password?: string;
  videoId: string;
};

/** room:create / room:join 的 ACK 数据 */
export interface RoomStateAck {
  state: WatchRoomState;
}

export interface RoomJoinAck extends RoomStateAck {
  alreadyJoined: boolean;
}

/** ACK 统一结构 */
export interface Ack<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

/** 模块级单例：同一页面多处订阅共享一条连接 */
let socket: Socket | null = null;

export const getWatchRoomSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      // 会话经 Cookie 携带，服务端握手时校验（需 user 及以上角色）
      withCredentials: true,
      transports: ['websocket']
    });
  }
  return socket;
};

/** 关闭连接（登出 / 账号被顶替时调用，停止自动重连） */
export const closeWatchRoomSocket = () => {
  socket?.disconnect();
  socket = null;
};

/**
 * 带超时的 ACK 调用：客户端不能仅凭发送成功认为服务端已完成操作
 */
export const emitAck = <T>(
  socket: Socket,
  event: string,
  payload: Record<string, unknown>,
  timeoutMs = 8000
): Promise<Ack<T>> =>
  new Promise(resolve => {
    const timer = setTimeout(() => {
      resolve({
        success: false,
        data: null as T,
        error: { code: 'TIMEOUT', message: '操作超时，请检查网络' }
      });
    }, timeoutMs);

    socket
      .timeout(timeoutMs)
      .emit(event, payload, (err: unknown, result: Ack<T>) => {
        clearTimeout(timer);
        if (err) {
          resolve({
            success: false,
            data: null as T,
            error: { code: 'NETWORK', message: '网络异常，请稍后重试' }
          });
          return;
        }
        resolve(result);
      });
  });
